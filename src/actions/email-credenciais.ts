"use server";

import { revalidatePath } from "next/cache";
import { emailCredencialRepository } from "~/server/db/repositories/email-credencial";
import { encryptCredential } from "~/lib/agents/crypto";
import { emailCredencialCreateSchema } from "~/lib/validation/email-credencial";
import type { ActionState } from "./credenciais";

export interface EmailCredencialSummary {
  id: string;
  host: string;
  porta: number;
  usuario: string;
  pasta: string;
  ativo: boolean;
  createdAt: string;
}

export async function createEmailCredencial(
  payload: unknown,
): Promise<ActionState<EmailCredencialSummary>> {
  const parsed = emailCredencialCreateSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const created = await emailCredencialRepository.create({
      host: parsed.data.host,
      porta: parsed.data.porta,
      usuario: parsed.data.usuario,
      senhaCifrada: encryptCredential(parsed.data.senha),
      pasta: parsed.data.pasta,
      // ultimoUidProcessado=0 (em vez do default null) faz a primeira
      // captura processar a caixa desde o UID 1 em vez de pular para "a
      // partir de agora" — capturarDesde limita esse backfill a uma janela
      // recente via IMAP SEARCH SINCE, em vez da caixa inteira.
      ...(parsed.data.capturarDesde
        ? { ultimoUidProcessado: 0, capturarDesde: parsed.data.capturarDesde }
        : {}),
    });

    revalidatePath("/admin");

    return {
      success: true,
      message: "Credencial de e-mail salva com sucesso.",
      data: {
        id: created.id,
        host: created.host,
        porta: created.porta,
        usuario: created.usuario,
        pasta: created.pasta,
        ativo: created.ativo,
        createdAt: created.createdAt,
      },
    };
  } catch (error) {
    console.error("[createEmailCredencial] Erro:", error);
    return {
      success: false,
      message: "Ocorreu um erro inesperado ao salvar a credencial de e-mail.",
    };
  }
}

export async function deactivateEmailCredencial(id: string): Promise<ActionState<void>> {
  try {
    await emailCredencialRepository.deactivate(id);
    revalidatePath("/admin");
    return { success: true, data: undefined, message: "Credencial de e-mail desativada." };
  } catch (error) {
    console.error("[deactivateEmailCredencial] Erro:", error);
    return {
      success: false,
      message: "Ocorreu um erro inesperado ao desativar a credencial de e-mail.",
    };
  }
}

export async function deleteEmailCredencial(id: string): Promise<ActionState<void>> {
  try {
    const credencial = await emailCredencialRepository.findById(id);
    if (!credencial) {
      return { success: false, message: "Credencial de e-mail não encontrada." };
    }
    if (credencial.ativo) {
      return {
        success: false,
        message: "Desative a credencial antes de excluí-la.",
      };
    }

    await emailCredencialRepository.softDelete(id);
    revalidatePath("/admin");
    return { success: true, data: undefined, message: "Credencial de e-mail excluída." };
  } catch (error) {
    console.error("[deleteEmailCredencial] Erro:", error);
    return {
      success: false,
      message: "Ocorreu um erro inesperado ao excluir a credencial de e-mail.",
    };
  }
}
