"use server";

import { revalidatePath } from "next/cache";
import { candidatoRepository, type CandidatoDetailCompleto } from "~/server/db/repositories/candidato";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { type Candidato } from "~/server/db/schema";
import {
  candidatoAgregadoSchema,
  type CandidatoAgregadoInput,
} from "~/lib/validation/candidato";
import { storage } from "~/lib/storage";
import { orquestrarParaCandidatoNovo } from "~/server/agents/orquestracao";
import { executarExtracaoCurriculo } from "~/server/agents/extracao-curriculo";
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

    // Validar unicidade de email
    const emailExists = await candidatoRepository.findByEmailIncludingDeleted(email);
    if (emailExists) {
      return {
        success: false,
        message: "O e-mail informado já está cadastrado no sistema.",
      };
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
    try {
      result = await candidatoRepository.createAggregate(parsed.data);
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

export interface UploadLoteResultado {
  fileName: string;
  success: boolean;
  message?: string;
  candidatoId?: string;
}

async function processarArquivoLote(file: File): Promise<UploadLoteResultado> {
  let fileKey: string | null = null;
  try {
    fileKey = await handleFileUpload(file);
  } catch (e: any) {
    return { fileName: file.name, success: false, message: e.message || "Erro ao salvar arquivo." };
  }
  if (!fileKey) {
    return { fileName: file.name, success: false, message: "Falha ao salvar arquivo." };
  }

  try {
    const extraido = await executarExtracaoCurriculo(fileKey);

    const emailExists = await candidatoRepository.findByEmailIncludingDeleted(extraido.email);
    if (emailExists) {
      await storage.delete(fileKey).catch(console.error);
      return {
        fileName: file.name,
        success: false,
        message: `E-mail ${extraido.email} já cadastrado no sistema.`,
      };
    }

    const dadosPendentes = calcularDadosPendentes(extraido);
    const candidato = await candidatoRepository.createAggregate({
      ...extraido,
      curriculoArquivoKey: fileKey,
      dadosPendentes,
    });

    if (!candidato) {
      throw new Error("Falha ao criar candidato a partir da extração.");
    }

    orquestrarParaCandidatoNovo(candidato.id).catch((err) =>
      console.error("[uploadCurriculosEmLote] Falha na orquestração de matching:", err),
    );

    return { fileName: file.name, success: true, candidatoId: candidato.id };
  } catch (e: any) {
    await storage.delete(fileKey).catch(console.error);
    return {
      fileName: file.name,
      success: false,
      message: e.message || "Erro ao processar extração do currículo.",
    };
  }
}

export async function uploadCurriculosEmLote(
  payload: FormData,
): Promise<ActionState<UploadLoteResultado[]>> {
  const files = payload.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { success: false, message: "Nenhum arquivo enviado." };
  }
  if (files.length > MAX_LOTE_ARQUIVOS) {
    return {
      success: false,
      message: `Lote excede o limite de ${MAX_LOTE_ARQUIVOS} arquivos (enviados: ${files.length}).`,
    };
  }

  const resultados = await runWithLimit(files, CONCORRENCIA_LOTE, processarArquivoLote);

  const data = resultados.map((r) =>
    r.ok ? r.value : { fileName: "desconhecido", success: false, message: "Erro inesperado no processamento." },
  );

  if (data.some((r) => r.success)) {
    revalidatePath("/candidatos");
  }

  return { success: true, data };
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
