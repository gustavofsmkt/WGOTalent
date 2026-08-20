"use server";

import { revalidatePath } from "next/cache";
import { candidatoRepository, type CandidatoDetailCompleto } from "~/server/db/repositories/candidato";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { uploadLoteItemRepository } from "~/server/db/repositories/upload-lote-item";
import { type Candidato, type UploadLoteItem } from "~/server/db/schema";
import {
  candidatoAgregadoSchema,
  type CandidatoAgregadoInput,
} from "~/lib/validation/candidato";
import { storage } from "~/lib/storage";
import { orquestrarParaCandidatoNovo } from "~/server/agents/orquestracao";
import { executarExtracaoCurriculo } from "~/server/agents/extracao-curriculo";
import { AgenteQuotaExcedidaError } from "~/lib/agents/gemini-client";
import { calcularDadosPendentes } from "~/lib/validation/extracao-curriculo";
import { runWithLimit } from "~/lib/concurrency/run-with-limit";
import crypto from "crypto";
import path from "path";

export type ActionState<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message?: string; errors?: Record<string, string[]> };

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

async function handleFileUpload(file: File): Promise<string | null> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo excede o limite de 5MB.");
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Tipo de arquivo não suportado. Use PDF, DOCX, PNG ou JPEG.");
  }

  const ext = path.extname(file.name) || "";
  const key = `resumes/${crypto.randomUUID()}${ext}`;
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await storage.save(key, buffer, file.type);
  
  return key;
}

function parsePayload(payload: unknown): { data: unknown; file: File | null; error?: string } {
  if (typeof FormData !== "undefined" && payload instanceof FormData) {
    const dataStr = payload.get("data");
    let data: unknown;
    if (typeof dataStr === "string") {
      try {
        data = JSON.parse(dataStr);
      } catch (e) {
        return { data: null, file: null, error: "JSON inválido no campo data" };
      }
    } else {
      return { data: null, file: null, error: "Campo data ausente ou inválido" };
    }
    
    const file = payload.get("file");
    return { 
      data, 
      file: file instanceof File && file.size > 0 ? file : null 
    };
  }
  return { data: payload, file: null };
}

/**
 * Exclui as triagens do candidato ainda na etapa inicial "Currículo" (em
 * andamento) para que a orquestração, disparada logo em seguida pela
 * action, possa reavaliá-las do zero em cima do perfil atualizado. Etapas
 * mais avançadas (testes, entrevistas, finalizado) não são tocadas.
 */
async function resetTriagensEmCurriculo(candidatoId: string): Promise<void> {
  const ids = await triagemRepository.findEmCurriculoPorCandidato(candidatoId);
  await Promise.all(ids.map((id) => triagemRepository.softDelete(id)));
}

export async function createCandidato(
  payload: unknown,
): Promise<ActionState<Candidato>> {
  const { data, file, error } = parsePayload(payload);
  
  if (error) {
    return { success: false, message: error };
  }

  const parsed = candidatoAgregadoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { cargoInteresseId, areaInteresseId, email } = parsed.data;

    // E-mail já cadastrado: em vez de rejeitar, restaura (se excluído) ou
    // mescla dados novos/diferentes (se ativo) — ver ADR 0008.
    const existing = await candidatoRepository.findByEmailIncludingDeleted(email);

    // Validar referências
    if (cargoInteresseId) {
      const cargo = await cargoRepository.findById(cargoInteresseId);
      if (!cargo || !cargo.ativo) {
        return { success: false, message: "O cargo selecionado é inválido ou está inativo." };
      }
    }

    if (areaInteresseId) {
      const depto = await departamentoRepository.findById(areaInteresseId);
      if (!depto) {
        return { success: false, message: "O departamento selecionado é inválido." };
      }
    }

    let fileKey: string | null = null;
    if (file) {
      try {
        fileKey = await handleFileUpload(file);
        parsed.data.curriculoArquivoKey = fileKey;
      } catch (e: any) {
        return { success: false, message: e.message || "Erro ao fazer upload do currículo." };
      }
    }

    let result: Candidato | undefined | null;
    let message: string | undefined;
    try {
      if (existing?.deletedAt) {
        result = await candidatoRepository.restoreAggregate(existing.id, parsed.data);
        message = "Candidato restaurado com sucesso.";
      } else if (existing) {
        const merged = await candidatoRepository.mergeAggregate(existing.id, parsed.data);
        result = merged.candidato;
        if (merged.houveMudanca) {
          await resetTriagensEmCurriculo(existing.id);
        }
        message = "Candidato já cadastrado — informações atualizadas.";
      } else {
        result = await candidatoRepository.createAggregate(parsed.data);
      }
    } catch (dbError) {
      // Cleanup if DB fails
      if (fileKey) {
        await storage.delete(fileKey).catch(console.error);
      }
      throw dbError;
    }

    if (!result) {
      throw new Error("Falha ao retornar o candidato criado.");
    }

    // Dispara a fase 1 de matching (candidato -> vagas abertas na mesma cidade). Fire-and-forget:
    // não bloqueia a resposta desta action, e o próprio orquestrador limita concorrência internamente.
    orquestrarParaCandidatoNovo(result.id).catch((err) =>
      console.error("[createCandidato] Falha na orquestração de matching:", err),
    );

    revalidatePath("/candidatos");

    return {
      success: true,
      data: result,
      message,
    };
  } catch (error: any) {
    console.error("[createCandidato] Error:", error);
    return {
      success: false,
      message: "Erro ao criar candidato. Verifique os dados e tente novamente.",
    };
  }
}

export async function updateCandidato(
  id: string,
  payload: unknown,
): Promise<ActionState<CandidatoDetailCompleto>> {
  const { data, file, error } = parsePayload(payload);

  if (error) {
    return { success: false, message: error };
  }

  const parsed = candidatoAgregadoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { cargoInteresseId, areaInteresseId, email } = parsed.data;

    const existingCandidato = await candidatoRepository.findById(id);
    if (!existingCandidato) {
      return { success: false, message: "Candidato não encontrado." };
    }

    // Validar unicidade de email se foi alterado
    if (email !== existingCandidato.email) {
      const emailExists = await candidatoRepository.findByEmailIncludingDeleted(email);
      if (emailExists) {
        return {
          success: false,
          message: "O e-mail informado já está cadastrado no sistema.",
        };
      }
    }

    // Validar referências
    if (cargoInteresseId) {
      const cargo = await cargoRepository.findById(cargoInteresseId);
      if (!cargo || !cargo.ativo) {
        return { success: false, message: "O cargo selecionado é inválido ou está inativo." };
      }
    }

    if (areaInteresseId) {
      const depto = await departamentoRepository.findById(areaInteresseId);
      if (!depto) {
        return { success: false, message: "O departamento selecionado é inválido." };
      }
    }

    let newFileKey: string | null = null;
    let oldFileKey = existingCandidato.curriculoArquivoKey;

    if (file) {
      try {
        newFileKey = await handleFileUpload(file);
        parsed.data.curriculoArquivoKey = newFileKey;
      } catch (e: any) {
        return { success: false, message: e.message || "Erro ao fazer upload do currículo." };
      }
    } else {
      // Preserve existing key if no new file is uploaded
      parsed.data.curriculoArquivoKey = oldFileKey;
    }

    // Certificar-se que filhos pertencem a esse candidato caso possuam IDs na request
    // A validação de IDs de filhos está sendo tratada no repository (atualizando apenas com and(eq(id), eq(candidatoId)))
    // Evitando duplicações ou modificação de filhos de outro candidato.
    
    let result: CandidatoDetailCompleto | undefined | null;
    try {
      result = await candidatoRepository.updateAggregate(id, parsed.data);
      
      // Cleanup old file only after DB updated successfully
      if (newFileKey && oldFileKey) {
        await storage.delete(oldFileKey).catch(console.error);
      }
    } catch (dbError) {
      // Cleanup new file if DB fails
      if (newFileKey) {
        await storage.delete(newFileKey).catch(console.error);
      }
      throw dbError;
    }

    if (!result) {
      throw new Error("Falha ao retornar o candidato atualizado.");
    }
    
    revalidatePath("/candidatos");
    revalidatePath(`/candidatos/${id}`);

    return {
      success: true,
      message: "Candidato atualizado com sucesso.",
      data: result,
    };
  } catch (error) {
    console.error("[updateCandidato] Erro:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado ao atualizar o candidato.",
    };
  }
}

const MAX_LOTE_ARQUIVOS = 15;
const CONCORRENCIA_LOTE = 3;

/**
 * Processa um item do lote e persiste o resultado na própria linha (nunca
 * lança) — chamada fora do await da action que a dispara, para que o
 * processamento sobreviva a reload/fechamento da aba do cliente (mesmo
 * padrão fire-and-forget de `orquestrarParaCandidatoNovo` acima).
 */
export async function processarItemLote(itemId: string, file: File): Promise<void> {
  await uploadLoteItemRepository.updateStatus(itemId, { status: "processando" });

  let fileKey: string | null = null;
  try {
    fileKey = await handleFileUpload(file);
  } catch (e: any) {
    await uploadLoteItemRepository.updateStatus(itemId, {
      status: "erro",
      mensagem: e.message || "Erro ao salvar arquivo.",
    });
    return;
  }
  if (!fileKey) {
    await uploadLoteItemRepository.updateStatus(itemId, {
      status: "erro",
      mensagem: "Falha ao salvar arquivo.",
    });
    return;
  }

  try {
    const extraido = await executarExtracaoCurriculo(fileKey);

    // Currículo sem e-mail: em vez de deixar o agente inventar um valor (não
    // confiável — pode não ser um e-mail válido, ou colidir com o de outra
    // pessoa e disparar uma mesclagem indevida), geramos um placeholder
    // único aqui. "E-mail" entra em dadosPendentes para o RH completar.
    const dadosPendentes = calcularDadosPendentes(extraido);
    const email = extraido.email ?? `sememail+${crypto.randomUUID()}@wgotalent.local`;
    // O schema de extração aceita chave ausente (undefined) além de null
    // nesses campos — normaliza pra null aqui, que é o que o repositório
    // (CandidatoAgregadoInsercao) espera.
    const dadosCandidato = {
      ...extraido,
      email,
      dataNascimento: extraido.dataNascimento ?? null,
      cep: extraido.cep ?? null,
      bairro: extraido.bairro ?? null,
      logradouro: extraido.logradouro ?? null,
      curriculoArquivoKey: fileKey,
      dadosPendentes,
    };

    // E-mail já cadastrado: em vez de rejeitar, restaura (se excluído) ou
    // mescla dados novos/diferentes (se ativo) — ver ADR 0008. Pulado quando
    // o currículo não tinha e-mail: o placeholder acima é sempre único, então
    // nunca haveria correspondência real.
    const existing = extraido.email
      ? await candidatoRepository.findByEmailIncludingDeleted(extraido.email)
      : null;

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
      console.error("[processarItemLote] Falha na orquestração de matching:", err),
    );

    await uploadLoteItemRepository.updateStatus(itemId, {
      status: "sucesso",
      mensagem,
      candidatoId: candidato.id,
    });
    // Sem revalidatePath aqui: essa chamada só é válida dentro do escopo
    // síncrono de uma Server Action/Route Handler. Como este processamento
    // roda destacado (fire-and-forget, depois que iniciarUploadLote já
    // retornou ao cliente), chamá-la aqui derruba o processamento — e como
    // isso acontecia DEPOIS do candidato já criado, o catch abaixo apagava o
    // arquivo do storage e deixava o registro com uma referência morta. A
    // página /candidatos já é `force-dynamic` (busca dados frescos a cada
    // navegação), então a revalidação nem é necessária neste caminho.
  } catch (e: any) {
    await storage.delete(fileKey).catch(console.error);
    await uploadLoteItemRepository.updateStatus(itemId, {
      status: "erro",
      mensagem: e.message || "Erro ao processar extração do currículo.",
      errorType: e instanceof AgenteQuotaExcedidaError ? "quota" : null,
    });
  }
}

/**
 * Cria os registros do lote e retorna imediatamente — o processamento roda
 * solto no processo Node (sem await), então nem um F5 nem a navegação do
 * usuário para outra tela interrompem os currículos que já entraram na fila.
 */
export async function iniciarUploadLote(
  formData: FormData,
): Promise<ActionState<UploadLoteItem[]>> {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { success: false, message: "Nenhum arquivo enviado." };
  }
  if (files.length > MAX_LOTE_ARQUIVOS) {
    return {
      success: false,
      message: `Lote excede o limite de ${MAX_LOTE_ARQUIVOS} arquivos (enviados: ${files.length}).`,
    };
  }

  const itens = await Promise.all(
    files.map((file) =>
      uploadLoteItemRepository.create({ fileName: file.name, status: "pendente" }),
    ),
  );

  runWithLimit(
    itens.map((item, i) => ({ item, file: files[i]! })),
    CONCORRENCIA_LOTE,
    ({ item, file }) => processarItemLote(item.id, file),
  ).catch((err) =>
    console.error("[iniciarUploadLote] Falha inesperada no processamento do lote:", err),
  );

  return { success: true, data: itens };
}

/** Itens de lote não limpos (inclui em andamento e erros) — usado pelo popup para rehidratar a UI ao montar/reabrir a tela. */
export async function getUploadLoteAtivo(): Promise<UploadLoteItem[]> {
  return uploadLoteItemRepository.findAtivos();
}

export async function limparUploadLoteFinalizados(): Promise<void> {
  await uploadLoteItemRepository.softDeleteFinalizados();
}

export async function deleteCandidato(
  id: string,
): Promise<ActionState<void>> {
  try {
    const existingCandidato = await candidatoRepository.findById(id);
    if (!existingCandidato) {
      return { success: false, message: "Candidato não encontrado." };
    }

    await candidatoRepository.softDelete(id);

    revalidatePath("/candidatos");
    
    return {
      success: true,
      message: "Candidato excluído com sucesso.",
      data: undefined,
    };
  } catch (error) {
    console.error("[deleteCandidato] Erro:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado ao excluir o candidato.",
    };
  }
}
