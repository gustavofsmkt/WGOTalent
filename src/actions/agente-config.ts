"use server";

import { revalidatePath } from "next/cache";
import { agenteConfigRepository } from "~/server/db/repositories/agente-config";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";
import { type AgenteConfig } from "~/server/db/schema";
import { agenteConfigUpdateSchema } from "~/lib/validation/agente-config";

export type ActionState<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message?: string; errors?: Record<string, string[]> };

export async function updateAgenteConfig(
  slot: AgenteConfig["slot"],
  payload: unknown,
): Promise<ActionState<AgenteConfig>> {
  const parsed = agenteConfigUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { thresholdScore, ...rest } = parsed.data;

    // Só bloqueia se o agente for ficar ativo — permite salvar um rascunho
    // inativo apontando para um provedor ainda sem credencial.
    if (rest.ativo) {
      const credencial = await llmCredencialRepository.findActiveByProvider(
        rest.provider,
      );
      if (!credencial) {
        return {
          success: false,
          message: `Nenhuma credencial ativa para o provedor "${rest.provider}". Cadastre a chave em Administração › Credenciais antes de ativar este agente.`,
        };
      }
    }

    const updated = await agenteConfigRepository.update(slot, {
      ...rest,
      thresholdScore:
        thresholdScore === null || thresholdScore === undefined
          ? null
          : thresholdScore.toString(),
    });
    if (!updated) {
      return {
        success: false,
        message: "Configuração de agente não encontrada.",
      };
    }

    revalidatePath("/admin");
    revalidatePath(`/admin/agentes/${slot}`);

    return {
      success: true,
      data: updated,
      message: "Configuração atualizada com sucesso.",
    };
  } catch (error) {
    console.error("[updateAgenteConfig] Erro:", error);
    return {
      success: false,
      message:
        "Ocorreu um erro inesperado ao atualizar a configuração do agente.",
    };
  }
}
