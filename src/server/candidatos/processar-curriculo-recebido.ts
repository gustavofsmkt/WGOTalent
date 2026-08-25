import crypto from "crypto";
import path from "path";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { storage } from "~/lib/storage";
import { orquestrarParaCandidatoNovo } from "~/server/agents/orquestracao";
import { executarExtracaoCurriculo } from "~/server/agents/extracao-curriculo";
import { AgenteQuotaExcedidaError } from "~/lib/agents/shared";
import { calcularDadosPendentes } from "~/lib/validation/extracao-curriculo";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "~/lib/validation/candidato-arquivo";

export interface ProcessarCurriculoRecebidoInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  origem: "manual" | "email";
}

export type ResultadoProcessamento =
  | { status: "sucesso"; candidatoId: string; mensagem: string }
  | { status: "erro"; mensagem: string; errorType?: "quota" | null };

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
    throw new Error("Tipo de arquivo não suportado. Use PDF, DOCX, PNG ou JPEG.");
  }

  const ext = path.extname(filename) || "";
  const key = `resumes/${crypto.randomUUID()}${ext}`;

  await storage.save(key, buffer, mimeType);

  return key;
}

/**
 * Processa um currículo recebido (upload manual em lote ou anexo de
 * e-mail) e persiste o candidato resultante — nunca lança. Roda fora do
 * ciclo de requisição (fire-and-forget do upload em lote, ou o loop de
 * captura de e-mail), então não chama `revalidatePath`: quem chama decide
 * como refletir o resultado (linha de `upload_lote_itens`, log do ciclo de
 * captura, etc.).
 */
export async function processarCurriculoRecebido(
  input: ProcessarCurriculoRecebidoInput,
): Promise<ResultadoProcessamento> {
  let fileKey: string | null = null;
  try {
    fileKey = await salvarArquivoRecebido(input.buffer, input.filename, input.mimeType);
  } catch (e) {
    return {
      status: "erro",
      mensagem: e instanceof Error ? e.message : "Erro ao salvar arquivo.",
    };
  }

  try {
    const extraido = await executarExtracaoCurriculo(fileKey);

    // Currículo sem e-mail: em vez de deixar o agente inventar um valor (não
    // confiável — pode não ser um e-mail válido, ou colidir com o de outra
    // pessoa e disparar uma mesclagem indevida), geramos um placeholder
    // único aqui. "E-mail" entra em dadosPendentes para o RH completar.
    if (!extraido.email && !extraido.celular) {
      return {
        status: "erro",
        mensagem: "Currículo sem e-mail e sem celular — candidato não criado.",
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
      origem: input.origem,
    };

    const existing =
      (extraido.email ? await candidatoRepository.findByEmailIncludingDeleted(extraido.email) : null) ??
      (extraido.celular ? await candidatoRepository.findByCelularIncludingDeleted(extraido.celular) : null);

    let candidato: Awaited<ReturnType<typeof candidatoRepository.createAggregate>>;
    let mensagem = "Candidato criado com sucesso.";
    if (existing?.deletedAt) {
      candidato = await candidatoRepository.restoreAggregate(existing.id, dadosCandidato);
      mensagem = "Candidato restaurado com sucesso.";
    } else if (existing) {
      const merged = await candidatoRepository.mergeAggregate(existing.id, dadosCandidato);
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
      console.error("[processarCurriculoRecebido] Falha na orquestração de matching:", err),
    );

    return { status: "sucesso", candidatoId: candidato.id, mensagem };
  } catch (e) {
    await storage.delete(fileKey).catch(console.error);
    return {
      status: "erro",
      mensagem: e instanceof Error ? e.message : "Erro ao processar extração do currículo.",
      errorType: e instanceof AgenteQuotaExcedidaError ? "quota" : null,
    };
  }
}
