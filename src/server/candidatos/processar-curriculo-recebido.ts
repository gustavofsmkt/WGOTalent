import crypto from "crypto";
import path from "path";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { processamentoIaRepository } from "~/server/db/repositories/processamento-ia";
import type { ProcessamentoIa } from "~/server/db/schema";
import { storage } from "~/lib/storage";
import { orquestrarParaCandidatoNovo } from "~/server/agents/orquestracao";
import {
  executarExtracaoCurriculo,
  type ContextoEmail,
} from "~/server/agents/extracao-curriculo";
import { AgenteQuotaExcedidaError } from "~/lib/agents/shared";
import { calcularDadosPendentes } from "~/lib/validation/extracao-curriculo";
import {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from "~/lib/validation/candidato-arquivo";

export interface ProcessarCurriculoRecebidoInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  origem: "manual" | "email";
  /** Assunto do e-mail que trouxe o anexo — só no fluxo `origem: "email"`. */
  emailAssunto?: string | null;
  /** Corpo do e-mail que trouxe o anexo — só no fluxo `origem: "email"`. */
  emailCorpo?: string | null;
}

export type ResultadoProcessamento =
  | { status: "sucesso"; candidatoId: string; mensagem: string }
  | { status: "erro"; mensagem: string; errorType?: "quota" | null };

/**
 * Resultado da extração/dedup/persistência a partir de um arquivo já salvo.
 * `retryable` distingue falhas reprocessáveis (exceções de infraestrutura,
 * cota ou resposta inválida — vale a pena reter o arquivo e tentar de novo)
 * de falhas determinísticas (ex.: currículo sem e-mail nem celular), que
 * repetiriam o mesmo resultado.
 */
type ResultadoExtracao =
  | { status: "sucesso"; candidatoId: string; mensagem: string }
  | {
      status: "erro";
      mensagem: string;
      errorType: "quota" | null;
      retryable: boolean;
    };

function paraPublico(resultado: ResultadoExtracao): ResultadoProcessamento {
  if (resultado.status === "sucesso") {
    return {
      status: "sucesso",
      candidatoId: resultado.candidatoId,
      mensagem: resultado.mensagem,
    };
  }
  return {
    status: "erro",
    mensagem: resultado.mensagem,
    errorType: resultado.errorType,
  };
}

/**
 * Mensagem sanitizada para o histórico de ingestão. A resposta bruta do agente
 * de extração pode conter PII e a transcrição do currículo (ADR-0001), então
 * falhas reprocessáveis viram texto genérico; a única falha determinística
 * ("sem e-mail e sem celular") já tem texto seguro e é preservada.
 */
function mensagemIngestao(resultado: {
  errorType: "quota" | null;
  retryable: boolean;
  mensagem: string;
}): string {
  if (resultado.errorType === "quota") {
    return "O limite temporário do provedor de IA foi atingido.";
  }
  if (!resultado.retryable) {
    return resultado.mensagem;
  }
  return "Não foi possível extrair os dados do currículo.";
}

/**
 * Exclui as triagens do candidato ainda na etapa inicial "Currículo" (em
 * andamento) para que a orquestração, disparada logo em seguida, possa
 * reavaliá-las do zero em cima do perfil atualizado. Etapas mais avançadas
 * (testes, entrevistas, finalizado) não são tocadas.
 */
async function resetTriagensEmCurriculo(candidatoId: string): Promise<void> {
  const ids = await triagemRepository.findEmCurriculoPorCandidato(candidatoId);
  await Promise.all(ids.map((id) => triagemRepository.softDelete(id)));
}

async function salvarArquivoRecebido(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("Arquivo excede o limite de 5MB.");
  }
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      "Tipo de arquivo não suportado. Use PDF, DOCX, PNG ou JPEG.",
    );
  }

  const ext = path.extname(filename) || "";
  const key = `resumes/${crypto.randomUUID()}${ext}`;

  await storage.save(key, buffer, mimeType);

  return key;
}

/**
 * Executa extração, deduplicação e persistência do candidato a partir de um
 * arquivo já salvo no storage — nunca lança e nunca apaga o arquivo (quem chama
 * decide o descarte). Compartilhado pela ingestão inicial e pelo retry.
 */
async function extrairEPersistirCandidato(
  fileKey: string,
  origem: "manual" | "email",
  contextoEmail?: ContextoEmail,
): Promise<ResultadoExtracao> {
  try {
    const extraido = await executarExtracaoCurriculo(fileKey, contextoEmail);

    // Currículo sem e-mail nem celular: sem chave de deduplicação confiável,
    // o candidato não é criado. Reprocessar daria o mesmo resultado, então
    // esta falha não é reprocessável.
    if (!extraido.email && !extraido.celular) {
      return {
        status: "erro",
        mensagem: "Currículo sem e-mail e sem celular — candidato não criado.",
        errorType: null,
        retryable: false,
      };
    }

    const dadosPendentes = calcularDadosPendentes(extraido);
    const dadosCandidato = {
      ...extraido,
      email: extraido.email ?? null,
      celular: extraido.celular ?? null,
      dataNascimento: extraido.dataNascimento ?? null,
      cep: extraido.cep ?? null,
      bairro: extraido.bairro ?? null,
      logradouro: extraido.logradouro ?? null,
      curriculoArquivoKey: fileKey,
      dadosPendentes,
      origem,
    };

    const existing =
      (extraido.email
        ? await candidatoRepository.findByEmailIncludingDeleted(extraido.email)
        : null) ??
      (extraido.celular
        ? await candidatoRepository.findByCelularIncludingDeleted(
            extraido.celular,
          )
        : null);

    let candidato: Awaited<
      ReturnType<typeof candidatoRepository.createAggregate>
    >;
    let mensagem = "Candidato criado com sucesso.";
    if (existing?.deletedAt) {
      candidato = await candidatoRepository.restoreAggregate(
        existing.id,
        dadosCandidato,
      );
      mensagem = "Candidato restaurado com sucesso.";
    } else if (existing) {
      const merged = await candidatoRepository.mergeAggregate(
        existing.id,
        dadosCandidato,
      );
      candidato = merged.candidato;
      if (merged.houveMudanca) {
        await resetTriagensEmCurriculo(existing.id);
      }
      mensagem = "Candidato já cadastrado — informações atualizadas.";
    } else {
      candidato = await candidatoRepository.createAggregate(dadosCandidato);
    }

    if (!candidato) {
      throw new Error("Falha ao criar candidato a partir da extração.");
    }

    orquestrarParaCandidatoNovo(candidato.id).catch((err) =>
      console.error(
        "[processarCurriculoRecebido] Falha na orquestração de matching:",
        err,
      ),
    );

    return { status: "sucesso", candidatoId: candidato.id, mensagem };
  } catch (e) {
    return {
      status: "erro",
      mensagem:
        e instanceof Error
          ? e.message
          : "Erro ao processar extração do currículo.",
      errorType: e instanceof AgenteQuotaExcedidaError ? "quota" : null,
      retryable: true,
    };
  }
}

/** Finaliza o registro de ingestão sem nunca lançar (o registro é auxiliar). */
async function finalizarIngestao(
  processamentoId: string | undefined,
  data: {
    status: "sucesso" | "falha";
    mensagem: string | null;
    arquivoKey?: string | null;
    candidatoId?: string;
  },
): Promise<void> {
  if (!processamentoId) return;
  await processamentoIaRepository.finalizar(processamentoId, data).catch((err) =>
    console.error(
      "[processarCurriculoRecebido] Falha ao finalizar ingestão:",
      err,
    ),
  );
}

/**
 * Aplica o resultado da extração a um registro `ingestao_curriculo`: em falha
 * reprocessável conserva o arquivo (o `arquivo_key` já persistido habilita o
 * retry); em sucesso o arquivo vira o currículo do candidato; em falha
 * determinística descarta o arquivo e limpa a chave.
 */
async function aplicarResultadoIngestao(
  processamentoId: string | undefined,
  fileKey: string,
  resultado: ResultadoExtracao,
): Promise<void> {
  if (resultado.status === "sucesso") {
    await finalizarIngestao(processamentoId, {
      status: "sucesso",
      mensagem: resultado.mensagem,
      candidatoId: resultado.candidatoId,
    });
    return;
  }

  if (resultado.retryable) {
    await finalizarIngestao(processamentoId, {
      status: "falha",
      mensagem: mensagemIngestao(resultado),
    });
    return;
  }

  await storage.delete(fileKey).catch(console.error);
  await finalizarIngestao(processamentoId, {
    status: "falha",
    mensagem: mensagemIngestao(resultado),
    arquivoKey: null,
  });
}

/**
 * Processa um currículo recebido (upload manual em lote ou anexo de
 * e-mail) e persiste o candidato resultante — nunca lança. Roda fora do
 * ciclo de requisição (fire-and-forget do upload em lote, ou o loop de
 * captura de e-mail), então não chama `revalidatePath`: quem chama decide
 * como refletir o resultado (linha de `upload_lote_itens`, log do ciclo de
 * captura, etc.).
 *
 * Só o fluxo de e-mail registra histórico em `processamentos_ia` e conserva o
 * arquivo em falha reprocessável (retry por `/processamentos-ia`). O upload em
 * lote já tem sua própria linha operacional e o RH pode reenviar o arquivo.
 */
export async function processarCurriculoRecebido(
  input: ProcessarCurriculoRecebidoInput,
): Promise<ResultadoProcessamento> {
  let fileKey: string;
  try {
    fileKey = await salvarArquivoRecebido(
      input.buffer,
      input.filename,
      input.mimeType,
    );
  } catch (e) {
    return {
      status: "erro",
      mensagem: e instanceof Error ? e.message : "Erro ao salvar arquivo.",
    };
  }

  if (input.origem !== "email") {
    const resultado = await extrairEPersistirCandidato(fileKey, input.origem);
    if (resultado.status === "erro") {
      await storage.delete(fileKey).catch(console.error);
    }
    return paraPublico(resultado);
  }

  const contextoEmail: ContextoEmail = {
    assunto: input.emailAssunto ?? null,
    corpo: input.emailCorpo ?? null,
  };

  // Registra a ingestão; se o próprio registro falhar (DB fora), ainda processa
  // e retorna para não quebrar o contrato "nunca lança". Assunto e corpo ficam
  // guardados para o retry alimentar a extração com o mesmo contexto.
  const processamento = await processamentoIaRepository
    .create({
      fluxo: "ingestao_curriculo",
      etapa: "extracao",
      status: "processando",
      arquivoKey: fileKey,
      emailAssunto: contextoEmail.assunto,
      emailCorpo: contextoEmail.corpo,
    })
    .catch((err) => {
      console.error(
        "[processarCurriculoRecebido] Falha ao registrar ingestão:",
        err,
      );
      return null;
    });

  const resultado = await extrairEPersistirCandidato(
    fileKey,
    "email",
    contextoEmail,
  );
  await aplicarResultadoIngestao(processamento?.id, fileKey, resultado);
  return paraPublico(resultado);
}

/**
 * Reprocessa uma ingestão de currículo que falhou, a partir do arquivo retido.
 * Retoma exatamente a etapa de extração sem duplicar o candidato (a
 * deduplicação por e-mail/celular trata reexecuções como merge). Nunca lança.
 */
export async function reprocessarIngestaoCurriculo(
  processamento: ProcessamentoIa,
): Promise<void> {
  const fileKey = processamento.arquivoKey;
  if (!fileKey) {
    await finalizarIngestao(processamento.id, {
      status: "falha",
      mensagem:
        "O arquivo do currículo não está mais disponível para reprocessar.",
    });
    return;
  }

  const resultado = await extrairEPersistirCandidato(fileKey, "email", {
    assunto: processamento.emailAssunto,
    corpo: processamento.emailCorpo,
  });
  await aplicarResultadoIngestao(processamento.id, fileKey, resultado);
}
