"use server";

import { revalidatePath } from "next/cache";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";
import { encryptCredential } from "~/lib/agents/crypto";
import { credencialCreateSchema } from "~/lib/validation/credencial";

export type ActionState<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message?: string; errors?: Record<string, string[]> };

export interface CredencialSummary {
  id: string;
  provider: string;
  ativo: boolean;
  createdAt: string;
}

export async function createCredencial(
  payload: unknown,
): Promise<ActionState<CredencialSummary>> {
  const parsed = credencialCreateSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const isDuplicate = await llmCredencialRepository.existsRecentDuplicate({
      provider: parsed.data.provider,
    });
    if (isDuplicate) {
      return {
        success: false,
        message: "Esta credencial já foi cadastrada (envio duplicado detectado).",
      };
    }

    const created = await llmCredencialRepository.create({
      provider: parsed.data.provider,
      apiKeyCifrada: encryptCredential(parsed.data.apiKey),
    });

    revalidatePath("/admin");

    return {
      success: true,
      message: "Credencial salva com sucesso.",
      data: {
        id: created.id,
        provider: created.provider,
        ativo: created.ativo,
        createdAt: created.createdAt,
      },
    };
  } catch (error) {
    console.error("[createCredencial] Erro:", error);
    return {
      success: false,
      message: "Ocorreu um erro inesperado ao salvar a credencial.",
    };
  }
}

export async function deactivateCredencial(id: string): Promise<ActionState<void>> {
  try {
    await llmCredencialRepository.deactivate(id);
    revalidatePath("/admin");
    return { success: true, data: undefined, message: "Credencial desativada." };
  } catch (error) {
    console.error("[deactivateCredencial] Erro:", error);
    return {
      success: false,
      message: "Ocorreu um erro inesperado ao desativar a credencial.",
    };
  }
}

export async function deleteCredencial(id: string): Promise<ActionState<void>> {
  try {
    const credencial = await llmCredencialRepository.findById(id);
    if (!credencial) {
      return { success: false, message: "Credencial não encontrada." };
    }
    if (credencial.ativo) {
      return {
        success: false,
        message: "Desative a credencial antes de excluí-la.",
      };
    }

    await llmCredencialRepository.softDelete(id);
    revalidatePath("/admin");
    return { success: true, data: undefined, message: "Credencial excluída." };
  } catch (error) {
    console.error("[deleteCredencial] Erro:", error);
    return {
      success: false,
      message: "Ocorreu um erro inesperado ao excluir a credencial.",
    };
  }
}
