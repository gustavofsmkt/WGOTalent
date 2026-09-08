import { db } from "~/server/db";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { processamentoIaRepository } from "~/server/db/repositories/processamento-ia";
import type { ProcessamentoIa } from "~/server/db/schema";
import { runWithLimit } from "~/lib/concurrency/run-with-limit";
import {
  executarClassificadorAderencia,
  type ItemAderencia,
} from "./classificador-aderencia";
import { executarAvaliadorTriagem } from "./avaliador-triagem";

const CONCORRENCIA_FASE2 = 3;

type FluxoIa = "candidato_vagas" | "vaga_candidatos";

function mensagemSanitizada(
  etapa: "classificador" | "avaliador",
  error: unknown,
): string {
  const detail = error instanceof Error ? error.message.toLowerCase() : "";

  if (detail.includes("credencial")) {
    return "Não há credencial ativa disponível para o provedor de IA.";
  }
  if (detail.includes("configurad") || detail.includes("agente")) {
    return "O agente de IA desta etapa não está configurado ou ativo.";
  }
  if (
    detail.includes("quota") ||
    detail.includes("rate limit") ||
    detail.includes("429")
  ) {
    return "O limite temporário do provedor de IA foi atingido.";
  }

  return etapa === "classificador"
    ? "Não foi possível concluir a classificação de aderência."
    : "Não foi possível concluir a avaliação da triagem.";
}

async function finalizarFalha(
  processamentoId: string,
  etapa: "classificador" | "avaliador",
  error: unknown,
  itensPendentes: string[] = [],
): Promise<void> {
  await processamentoIaRepository.finalizar(processamentoId, {
    status: "falha",
    mensagem: mensagemSanitizada(etapa, error),
    itensPendentes,
  });
}

/**
 * Cria a triagem apenas quando necessário e registra a avaliação como uma
 * unidade própria de histórico/retry. Uma triagem existente sem avaliação
 * retoma diretamente no avaliador.
 */
async function processarParAprovado(
  candidatoId: string,
  vagaId: string,
  fluxo: FluxoIa,
  retry?: ProcessamentoIa,
): Promise<void> {
  let processamento = retry;
  let par: { triagemId: string; avaliacaoId: string | null } | null = null;

  try {
    // Só reaproveitamos a triagem fixada no retry se ela ainda estiver ativa.
    // Uma triagem soft-deleted após o registro do processamento não pode
    // receber vínculo nem avaliação — nesse caso retomamos pelo par.
    if (retry?.triagemId && (await triagemRepository.isAtiva(retry.triagemId))) {
      const avaliacaoDoRetry =
        await triagemRepository.findAvaliacaoAtivaPorTriagemId(retry.triagemId);
      par = {
        triagemId: retry.triagemId,
        avaliacaoId: avaliacaoDoRetry?.id ?? null,
      };
    } else {
      par = await triagemRepository.findForParComAvaliacao(candidatoId, vagaId);
    }

    if (par?.avaliacaoId) {
      if (processamento) {
        await processamentoIaRepository.finalizar(processamento.id, {
          status: "sucesso",
          mensagem:
            "A avaliação já estava registrada; nenhuma duplicação foi criada.",
        });
      }
      return;
    }

    processamento ??= await processamentoIaRepository.create({
      fluxo,
      etapa: "avaliador",
      status: "processando",
      candidatoId,
      vagaId,
      triagemId: par?.triagemId ?? null,
    });

    if (!par) {
      try {
        // Desmarcar o banco de talentos e criar a triagem precisam ser
        // atômicos: se o insert falhar, o candidato não pode ficar fora do
        // banco sem uma triagem correspondente.
        const triagem = await db.transaction(async (tx) => {
          await candidatoRepository.desmarcarBancoTalentos(candidatoId, tx);
          return triagemRepository.create(
            {
              candidatoId,
              vagaId,
              etapa: "curriculo",
              resultado: "em_andamento",
            },
            tx,
          );
        });
        par = { triagemId: triagem.id, avaliacaoId: null };
      } catch (error) {
        // Outro fluxo pode ter criado o mesmo par entre a consulta e o insert.
        // Nesse caso, usa a triagem concorrente em vez de duplicá-la.
        par = await triagemRepository.findForParComAvaliacao(
          candidatoId,
          vagaId,
        );
        if (!par) throw error;
      }
    }

    await processamentoIaRepository.vincularTriagem(
      processamento.id,
      par.triagemId,
    );

    if (par.avaliacaoId) {
      await processamentoIaRepository.finalizar(processamento.id, {
        status: "sucesso",
        mensagem:
          "A avaliação já estava registrada; nenhuma duplicação foi criada.",
      });
      return;
    }

    const avaliacaoExistente =
      await triagemRepository.findAvaliacaoAtivaPorTriagemId(par.triagemId);
    if (!avaliacaoExistente) {
      const avaliacao = await executarAvaliadorTriagem(par.triagemId);
      try {
        await triagemRepository.gravarAvaliacaoIA(avaliacao);
      } catch (error) {
        // Proteção idempotente para duas execuções que cheguem ao avaliador da
        // mesma triagem por registros históricos distintos.
        const criadaPorOutraExecucao =
          await triagemRepository.findAvaliacaoAtivaPorTriagemId(par.triagemId);
        if (!criadaPorOutraExecucao) throw error;
      }
    }

    await processamentoIaRepository.finalizar(processamento.id, {
      status: "sucesso",
      mensagem: "Avaliação concluída e registrada.",
    });
  } catch (error) {
    if (!processamento) {
      processamento = await processamentoIaRepository.create({
        fluxo,
        etapa: "avaliador",
        status: "processando",
        candidatoId,
        vagaId,
        // Preserva o vínculo já resolvido para que o retry retome no avaliador.
        triagemId: par?.triagemId ?? null,
      });
    }
    // finalizarFalha não pode escapar deste catch: se ela lançar (ex.: banco
    // indisponível), o erro se propagaria e o processamento ficaria preso em
    // "processando" sem caminho de recuperação. Registramos e seguimos.
    try {
      await finalizarFalha(processamento.id, "avaliador", error);
    } catch (finalizeError) {
      console.error(
        "[processarParAprovado] Não foi possível finalizar o processamento em falha.",
        finalizeError,
      );
    }
  }
}

async function executarFluxoCandidatoVagas(
  candidatoId: string,
  processamento?: ProcessamentoIa,
): Promise<void> {
  const registro =
    processamento ??
    (await processamentoIaRepository.create({
      fluxo: "candidato_vagas",
      etapa: "classificador",
      status: "processando",
      candidatoId,
    }));
  let idsComparacao: string[] = [];

  try {
    const candidato = await candidatoRepository.findById(candidatoId);
    if (!candidato) {
      throw new Error("Candidato não encontrado para classificação.");
    }

    let vagasAbertas = await vagaRepository.findOpenByCidade(candidato.cidade);
    if (processamento && processamento.itensPendentes.length > 0) {
      const pendentes = new Set(processamento.itensPendentes);
      vagasAbertas = vagasAbertas.filter((vaga) => pendentes.has(vaga.id));
    }

    idsComparacao = vagasAbertas.map((vaga) => vaga.id);
    if (vagasAbertas.length === 0) {
      const possuiTriagem = await triagemRepository.hasAnyActiveForCandidato(
        candidato.id,
      );
      if (!possuiTriagem) {
        await candidatoRepository.marcarBancoTalentos(candidato.id);
      }
      await processamentoIaRepository.finalizar(registro.id, {
        status: "sucesso",
        mensagem: "Nenhuma vaga aberta elegível foi encontrada.",
      });
      return;
    }

    const itensComparacao: ItemAderencia[] = vagasAbertas.map((vaga) => ({
      id: vaga.id,
      resumo: `${vaga.cargo.titulo} (${vaga.cargo.departamento.nome}). Requisitos: ${vaga.cargo.requisitos}. Desejáveis: ${vaga.cargo.requisitosDesejaveis}. Eliminatórios: ${vaga.cargo.criteriosEliminatorios}`,
    }));

    const resultado = await executarClassificadorAderencia(
      { id: candidato.id, resumo: candidato.resumoProfissional },
      itensComparacao,
      "candidato",
      "vaga",
    );

    if (!resultado.ok) {
      await processamentoIaRepository.finalizar(registro.id, {
        status: "falha",
        mensagem:
          "O classificador não conseguiu avaliar as vagas desta execução.",
        itensPendentes: resultado.idsComFalha,
      });
      return;
    }

    const vagasPorId = new Map(vagasAbertas.map((vaga) => [vaga.id, vaga]));
    const aprovados = resultado.scores.filter((score) => {
      const vaga = vagasPorId.get(score.id);
      return vaga ? score.score >= Number(vaga.notaCorte) : false;
    });

    if (resultado.idsComFalha.length > 0) {
      await processamentoIaRepository.finalizar(registro.id, {
        status: "falha",
        mensagem: `A classificação foi parcial: ${resultado.idsComFalha.length} item(ns) aguardam nova tentativa.`,
        itensPendentes: resultado.idsComFalha,
      });
    } else {
      await processamentoIaRepository.finalizar(registro.id, {
        status: "sucesso",
        mensagem: "Classificação de aderência concluída.",
      });
    }

    if (aprovados.length === 0 && resultado.idsComFalha.length === 0) {
      const possuiTriagem = await triagemRepository.hasAnyActiveForCandidato(
        candidato.id,
      );
      if (!possuiTriagem) {
        await candidatoRepository.marcarBancoTalentos(candidato.id);
      }
      return;
    }

    await runWithLimit(aprovados, CONCORRENCIA_FASE2, (item) =>
      processarParAprovado(candidato.id, item.id, "candidato_vagas"),
    );
  } catch (error) {
    await finalizarFalha(registro.id, "classificador", error, idsComparacao);
  }
}

async function executarFluxoVagaCandidatos(
  vagaId: string,
  processamento?: ProcessamentoIa,
): Promise<void> {
  const registro =
    processamento ??
    (await processamentoIaRepository.create({
      fluxo: "vaga_candidatos",
      etapa: "classificador",
      status: "processando",
      vagaId,
    }));
  let idsComparacao: string[] = [];

  try {
    const vaga = await vagaRepository.findByIdWithCargoAndDepartamento(vagaId);
    if (!vaga) throw new Error("Vaga não encontrada para classificação.");

    const nomeCidades = vaga.cidades.map((cidade) => cidade.nome);
    let candidatosAtivos =
      await candidatoRepository.findActiveByCidade(nomeCidades);
    if (processamento && processamento.itensPendentes.length > 0) {
      const pendentes = new Set(processamento.itensPendentes);
      candidatosAtivos = candidatosAtivos.filter((candidato) =>
        pendentes.has(candidato.id),
      );
    }

    idsComparacao = candidatosAtivos.map((candidato) => candidato.id);
    if (candidatosAtivos.length === 0) {
      await processamentoIaRepository.finalizar(registro.id, {
        status: "sucesso",
        mensagem: "Nenhum candidato elegível foi encontrado.",
      });
      return;
    }

    const itensComparacao: ItemAderencia[] = candidatosAtivos.map(
      (candidato) => ({
        id: candidato.id,
        resumo: candidato.resumoProfissional,
      }),
    );
    const resumoVaga = `${vaga.cargo.titulo} (${vaga.cargo.departamento.nome}). Requisitos: ${vaga.cargo.requisitos}. Desejáveis: ${vaga.cargo.requisitosDesejaveis}. Eliminatórios: ${vaga.cargo.criteriosEliminatorios}`;

    const resultado = await executarClassificadorAderencia(
      { id: vaga.id, resumo: resumoVaga },
      itensComparacao,
      "vaga",
      "candidato",
    );

    if (!resultado.ok) {
      await processamentoIaRepository.finalizar(registro.id, {
        status: "falha",
        mensagem:
          "O classificador não conseguiu avaliar os candidatos desta execução.",
        itensPendentes: resultado.idsComFalha,
      });
      return;
    }

    const aprovados = resultado.scores.filter(
      (score) => score.score >= Number(vaga.notaCorte),
    );

    if (resultado.idsComFalha.length > 0) {
      await processamentoIaRepository.finalizar(registro.id, {
        status: "falha",
        mensagem: `A classificação foi parcial: ${resultado.idsComFalha.length} item(ns) aguardam nova tentativa.`,
        itensPendentes: resultado.idsComFalha,
      });
    } else {
      await processamentoIaRepository.finalizar(registro.id, {
        status: "sucesso",
        mensagem: "Classificação de aderência concluída.",
      });
    }

    await runWithLimit(aprovados, CONCORRENCIA_FASE2, (item) =>
      processarParAprovado(item.id, vaga.id, "vaga_candidatos"),
    );
  } catch (error) {
    await finalizarFalha(registro.id, "classificador", error, idsComparacao);
  }
}

export async function orquestrarParaCandidatoNovo(
  candidatoId: string,
): Promise<void> {
  await executarFluxoCandidatoVagas(candidatoId);
}

export async function orquestrarParaVagaNova(vagaId: string): Promise<void> {
  await executarFluxoVagaCandidatos(vagaId);
}

export async function reprocessarProcessamentoIa(
  processamento: ProcessamentoIa,
): Promise<void> {
  if (processamento.fluxo === "ingestao_curriculo") {
    await processamentoIaRepository.finalizar(processamento.id, {
      status: "falha",
      mensagem: "O fluxo informado não pertence ao matching de candidatos.",
    });
    return;
  }

  if (processamento.etapa === "avaliador") {
    if (!processamento.candidatoId || !processamento.vagaId) {
      await finalizarFalha(
        processamento.id,
        "avaliador",
        new Error("Referências da avaliação indisponíveis."),
      );
      return;
    }
    await processarParAprovado(
      processamento.candidatoId,
      processamento.vagaId,
      processamento.fluxo,
      processamento,
    );
    return;
  }

  if (processamento.fluxo === "candidato_vagas") {
    if (!processamento.candidatoId) {
      await finalizarFalha(
        processamento.id,
        "classificador",
        new Error("Candidato do processamento indisponível."),
      );
      return;
    }
    await executarFluxoCandidatoVagas(processamento.candidatoId, processamento);
    return;
  }

  if (!processamento.vagaId) {
    await finalizarFalha(
      processamento.id,
      "classificador",
      new Error("Vaga do processamento indisponível."),
    );
    return;
  }
  await executarFluxoVagaCandidatos(processamento.vagaId, processamento);
}
