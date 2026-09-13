"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "~/lib/auth/dal";
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
  await requireAuthenticatedUser();
  const parsed = agenteConfigUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const config = parsed.data;

    // Só valida a credencial se o agente for ficar ativo — permite salvar um
    // rascunho inativo sem credencial selecionada.
    if (config.ativo) {
      // O schema já garante credencialId presente quando ativo.
      const credencial = config.credencialId
        ? await llmCredencialRepository.findById(config.credencialId)
        : null;
      if (!credencial || !credencial.ativo) {
        return {
          success: false,
          message:
            "A credencial selecionada não existe ou está inativa. Escolha uma credencial ativa em Administração › Credenciais.",
        };
      }
      if (credencial.provider !== config.provider) {
        return {
          success: false,
          message: "A credencial selecionada não pertence ao provedor escolhido.",
        };
      }
    }

    const updated = await agenteConfigRepository.update(slot, {
      provider: config.provider,
      credencialId: config.credencialId ?? null,
      model: config.model,
      systemPrompt: config.systemPrompt,
      userPrompt: config.userPrompt,
      ativo: config.ativo,
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
