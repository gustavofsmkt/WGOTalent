import { candidatoRepository } from "~/server/db/repositories/candidato";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { agenteConfigRepository } from "~/server/db/repositories/agente-config";
import { runWithLimit } from "~/lib/concurrency/run-with-limit";
import { executarClassificadorAderencia, type ItemAderencia } from "./classificador-aderencia";
import { executarAvaliadorTriagem } from "./avaliador-triagem";

const CONCORRENCIA_FASE2 = 3;

async function getThreshold(): Promise<number> {
  const config = await agenteConfigRepository.findBySlot("classificador_aderencia");
  return config?.thresholdScore ? Number(config.thresholdScore) : 65;
}

/** Cria a triagem (se ainda não existir para o par) e roda a fase 2, gravando avaliacao_ia. */
async function processarParAprovado(candidatoId: string, vagaId: string): Promise<void> {
  const jaExiste = await triagemRepository.existsForPar(candidatoId, vagaId);
  if (jaExiste) return;

  const triagem = await triagemRepository.create({
    candidatoId,
    vagaId,
    etapa: "curriculo",
    resultado: "em_andamento",
  });

  const avaliacao = await executarAvaliadorTriagem(triagem.id);
  await triagemRepository.gravarAvaliacaoIA(avaliacao);
}

export async function orquestrarParaCandidatoNovo(candidatoId: string): Promise<void> {
  const candidato = await candidatoRepository.findById(candidatoId);
  if (!candidato) return;

  const vagasAbertas = await vagaRepository.findOpenByCidade(candidato.cidade);
  if (vagasAbertas.length === 0) return;

  const itensComparacao: ItemAderencia[] = vagasAbertas.map((v) => ({
    id: v.id,
    resumo: `${v.cargo.titulo} (${v.cargo.departamento.nome}). Requisitos: ${v.cargo.requisitos}. Desejáveis: ${v.cargo.requisitosDesejaveis}. Eliminatórios: ${v.cargo.criteriosEliminatorios}`,
  }));

  const threshold = await getThreshold();
  const scores = await executarClassificadorAderencia(
    { id: candidato.id, resumo: candidato.resumoProfissional },
    itensComparacao,
    "candidato",
    "vaga",
  );

  const aprovados = scores.filter((s) => s.score >= threshold);

  await runWithLimit(aprovados, CONCORRENCIA_FASE2, (item) =>
    processarParAprovado(candidato.id, item.id),
  );
}

export async function orquestrarParaVagaNova(vagaId: string): Promise<void> {
  const vaga = await vagaRepository.findByIdWithCargoAndDepartamento(vagaId);
  if (!vaga) return;

  const candidatosAtivos = await candidatoRepository.findActiveByCidade(vaga.cidade);
  if (candidatosAtivos.length === 0) return;

  const itensComparacao: ItemAderencia[] = candidatosAtivos.map((c) => ({
    id: c.id,
    resumo: c.resumoProfissional,
  }));

  const resumoVaga = `${vaga.cargo.titulo} (${vaga.cargo.departamento.nome}). Requisitos: ${vaga.cargo.requisitos}. Desejáveis: ${vaga.cargo.requisitosDesejaveis}. Eliminatórios: ${vaga.cargo.criteriosEliminatorios}`;

  const threshold = await getThreshold();
  const scores = await executarClassificadorAderencia(
    { id: vaga.id, resumo: resumoVaga },
    itensComparacao,
    "vaga",
    "candidato",
  );

  const aprovados = scores.filter((s) => s.score >= threshold);

  await runWithLimit(aprovados, CONCORRENCIA_FASE2, (item) =>
    processarParAprovado(item.id, vaga.id),
  );
}
