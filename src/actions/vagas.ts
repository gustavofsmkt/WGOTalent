"use server";

import { revalidatePath } from "next/cache";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { vagaRepository } from "~/server/db/repositories/vaga";
import type { ActionState } from "~/lib/action-utils";
import {
  createVagaSchema,
  updateVagaSchema,
} from "~/lib/validation/vaga";
import type { Vaga } from "~/server/db/schema";
import { orquestrarParaVagaNova } from "~/server/agents/orquestracao";

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

    // Dispara a fase 1 de matching (vaga -> candidatos ativos na mesma cidade). Fire-and-forget.
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
  } catch {
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
