"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "~/lib/auth/dal";
import { db } from "~/server/db";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { vagaRepository } from "~/server/db/repositories/vaga";
import type { ActionState } from "~/lib/action-utils";
import { createVagaSchema, updateVagaSchema } from "~/lib/validation/vaga";
import type { Vaga } from "~/server/db/schema";
import { orquestrarParaVagaNova } from "~/server/agents/orquestracao";

export async function createVaga(data: unknown): Promise<ActionState<Vaga>> {
  await requireAuthenticatedUser();
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

    const isDuplicate = await vagaRepository.existsRecentDuplicate({
      cargoId: parsed.data.cargoId,
      status: parsed.data.status,
      posicoesDisponiveis: parsed.data.posicoesDisponiveis,
      notaCorte: parsed.data.notaCorte,
      remuneracaoOferecida: parsed.data.remuneracaoOferecida ?? null,
    });
    if (isDuplicate) {
      return {
        success: false,
        message: "Esta vaga já foi cadastrada (envio duplicado detectado).",
      };
    }

    const vaga = await vagaRepository.create({
      cargoId: parsed.data.cargoId,
      status: parsed.data.status,
      posicoesDisponiveis: parsed.data.posicoesDisponiveis,
      notaCorte: parsed.data.notaCorte,
      remuneracaoOferecida: parsed.data.remuneracaoOferecida ?? null,
      cidadeIds: parsed.data.cidadeIds,
    });

    // Dispara a fase 1 de matching (vaga -> candidatos ativos nas cidades). Fire-and-forget.
    orquestrarParaVagaNova(vaga.id).catch((err) =>
      console.error("[createVaga] Falha na orquestração de matching:", err),
    );

    revalidatePath("/vagas");

    return {
      success: true,
      data: vaga,
    };
  } catch {
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
  await requireAuthenticatedUser();
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

    const updateData = {
      ...parsed.data,
      cidadeIds: parsed.data.cidadeIds,
    };
    const encerraTriagens =
      parsed.data.status === "concluida" ||
      parsed.data.status === "cancelada";

    const vaga = encerraTriagens
      ? await db.transaction(async (tx) => {
          const updated = await vagaRepository.update(id, updateData, tx);
          if (!updated) return null;

          const candidatoIds =
            await triagemRepository.finalizarEmAndamentoComoBancoTalentosPorVaga(
              id,
              tx,
            );
          await candidatoRepository.marcarBancoTalentosPorIds(
            candidatoIds,
            tx,
          );
          return updated;
        })
      : await vagaRepository.update(id, updateData);

    if (!vaga) {
      return { success: false, message: "Vaga não encontrada" };
    }

    revalidatePath("/vagas");
    revalidatePath(`/vagas/${id}`);
    if (encerraTriagens) {
      revalidatePath("/triagens");
      revalidatePath("/candidatos");
      revalidatePath("/dashboard");
    }

    return {
      success: true,
      data: vaga,
    };
  } catch {
    return {
      success: false,
      message: "Erro ao atualizar vaga.",
    };
  }
}

export async function deleteVaga(id: string): Promise<ActionState> {
  await requireAuthenticatedUser();
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
  } catch {
    return {
      success: false,
      message: "Erro ao excluir vaga.",
    };
  }
}
