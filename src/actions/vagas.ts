"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "~/server/db";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { cargoRepository } from "~/server/db/repositories/cargo";
import {
  createVagaSchema,
  updateVagaSchema,
} from "~/lib/validation/vaga";
import type { Vaga } from "~/server/db/schema";
import type { ActionState } from "~/lib/action-utils";
import { env } from "~/env";

/**
 * Disparo outbound para o webhook Classificador no n8n.
 * Chamada assíncrona fire-and-forget: falha não reverte a criação da vaga.
 */
export async function triggerOutboundClassifier(vaga: Vaga): Promise<void> {
  try {
    const webhookUrl = env.CLASSIFICADOR_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return;
    }

    const vagaCompleta = await db.query.vagas.findFirst({
      where: (v, { eq }) => eq(v.id, vaga.id),
      with: {
        cargo: {
          with: {
            departamento: true,
          },
        },
      },
    });

    if (!vagaCompleta) {
      return;
    }

    const candidatos = await db.query.candidatos.findMany({
      where: (c, { and, eq, isNull }) =>
        and(isNull(c.deletedAt), eq(c.cidade, vaga.cidade)),
      with: {
        formacoes: {
          where: (f, { isNull }) => isNull(f.deletedAt),
        },
        experiencias: {
          where: (e, { isNull }) => isNull(e.deletedAt),
        },
        certificacoes: {
          where: (ct, { isNull }) => isNull(ct.deletedAt),
        },
      },
      limit: 50,
    });

    if (candidatos.length === 0) {
      return;
    }

    const payload = {
      vaga: vagaCompleta,
      candidatos,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `[triggerOutboundClassifier] Failed to dispatch webhook (${response.status} ${response.statusText})`
      );
    }
  } catch (error) {
    console.error("[triggerOutboundClassifier] Outbound trigger error:", error);
  }
}

export async function createVaga(
  data: unknown,
): Promise<ActionState<Vaga>> {
  const parsed = createVagaSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const cargo = await cargoRepository.findById(parsed.data.cargoId);
    if (!cargo || !cargo.ativo) {
      return {
        success: false,
        message: "Cargo selecionado não encontrado ou inativo.",
      };
    }

    const vaga = await vagaRepository.create(parsed.data);
    revalidatePath("/vagas");

    if (vaga.status === "aberta") {
      try {
        if (typeof after === "function") {
          after(async () => {
            await triggerOutboundClassifier(vaga);
          });
        } else {
          void triggerOutboundClassifier(vaga);
        }
      } catch {
        void triggerOutboundClassifier(vaga).catch((err) => {
          console.error("[createVaga] Background trigger error:", err);
        });
      }
    }

    return {
      success: true,
      data: vaga,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Erro ao criar vaga.",
    };
  }
}

export async function updateVaga(
  id: string,
  data: unknown,
): Promise<ActionState<Vaga>> {
  const parsed = updateVagaSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    if (parsed.data.cargoId) {
      const cargo = await cargoRepository.findById(parsed.data.cargoId);
      if (!cargo || !cargo.ativo) {
        return {
          success: false,
          message: "Cargo selecionado não encontrado ou inativo.",
        };
      }
    }

    const vaga = await vagaRepository.update(id, parsed.data);

    if (!vaga) {
      return { success: false, message: "Vaga não encontrada" };
    }

    revalidatePath("/vagas");
    revalidatePath(`/vagas/${id}`);

    return {
      success: true,
      data: vaga,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Erro ao atualizar vaga.",
    };
  }
}

export async function deleteVaga(
  id: string,
): Promise<ActionState> {
  try {
    const vaga = await vagaRepository.softDelete(id);

    if (!vaga) {
      return { success: false, message: "Vaga não encontrada" };
    }

    revalidatePath("/vagas");
    return {
      success: true,
      message: "Vaga excluída com sucesso.",
    };
  } catch (error) {
    return {
      success: false,
      message: "Erro ao excluir vaga.",
    };
  }
}
