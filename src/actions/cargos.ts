"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAuthenticatedUser } from "~/lib/auth/dal";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { createCargoSchema, updateCargoSchema } from "~/lib/validation/cargo";
import type { Cargo } from "~/server/db/schema";
import type { ActionState } from "~/lib/action-utils";
import { orquestrarParaVagaNova } from "~/server/agents/orquestracao";

function agendarMatchingVagasDoCargo(cargoId: string): void {
  after(async () => {
    try {
      const vagaIds = await cargoRepository.findOpenVagaIdsByCargoId(cargoId);
      const resultados = await Promise.allSettled(
        vagaIds.map((vagaId) => orquestrarParaVagaNova(vagaId)),
      );

      resultados.forEach((resultado, index) => {
        if (resultado.status === "rejected") {
          console.error(
            `[updateCargo] Falha no matching da vaga ${vagaIds[index] ?? "desconhecida"}:`,
            resultado.reason,
          );
        }
      });
    } catch (error) {
      console.error(
        `[updateCargo] Falha ao buscar vagas abertas do cargo ${cargoId}:`,
        error,
      );
    }
  });
}

export async function createCargo(data: unknown): Promise<ActionState<Cargo>> {
  await requireAuthenticatedUser();
  const parsed = createCargoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const departamento = await departamentoRepository.findById(
      parsed.data.departamentoId,
    );
    if (!departamento) {
      return {
        success: false,
        message: "Departamento selecionado não encontrado ou inativo.",
      };
    }

    const isDuplicate = await cargoRepository.existsRecentDuplicate({
      departamentoId: parsed.data.departamentoId,
      titulo: parsed.data.titulo,
    });
    if (isDuplicate) {
      return {
        success: false,
        message: "Este cargo já foi cadastrado (envio duplicado detectado).",
      };
    }

    const cargo = await cargoRepository.create(parsed.data);
    revalidatePath("/cargos");
    return {
      success: true,
      data: cargo,
    };
  } catch {
    return {
      success: false,
      message: "Erro ao criar cargo.",
    };
  }
}

export async function updateCargo(
  id: string,
  data: unknown,
): Promise<ActionState<Cargo>> {
  await requireAuthenticatedUser();
  const parsed = updateCargoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    if (parsed.data.departamentoId) {
      const departamento = await departamentoRepository.findById(
        parsed.data.departamentoId,
      );
      if (!departamento) {
        return {
          success: false,
          message: "Departamento selecionado não encontrado ou inativo.",
        };
      }
    }

    const cargoAnterior = await cargoRepository.findById(id);
    if (!cargoAnterior) {
      return { success: false, message: "Cargo não encontrado" };
    }

    const cargo = await cargoRepository.update(id, parsed.data);

    if (!cargo) {
      return { success: false, message: "Cargo não encontrado" };
    }

    revalidatePath("/cargos");
    revalidatePath(`/cargos/${id}`);

    const alteraResumoMatching =
      (parsed.data.titulo !== undefined &&
        parsed.data.titulo !== cargoAnterior.titulo) ||
      (parsed.data.descricao !== undefined &&
        parsed.data.descricao !== cargoAnterior.descricao) ||
      (parsed.data.requisitos !== undefined &&
        parsed.data.requisitos !== cargoAnterior.requisitos) ||
      (parsed.data.requisitosDesejaveis !== undefined &&
        parsed.data.requisitosDesejaveis !==
          cargoAnterior.requisitosDesejaveis) ||
      (parsed.data.criteriosEliminatorios !== undefined &&
        parsed.data.criteriosEliminatorios !==
          cargoAnterior.criteriosEliminatorios) ||
      (parsed.data.departamentoId !== undefined &&
        parsed.data.departamentoId !== cargoAnterior.departamentoId);

    if (alteraResumoMatching) {
      agendarMatchingVagasDoCargo(id);
    }

    return {
      success: true,
      data: cargo,
    };
  } catch {
    return {
      success: false,
      message: "Erro ao atualizar cargo.",
    };
  }
}

export async function deleteCargo(id: string): Promise<ActionState> {
  await requireAuthenticatedUser();
  try {
    const hasActiveVagas = await cargoRepository.hasActiveVagas(id);

    if (hasActiveVagas) {
      return {
        success: false,
        message: "Não é possível excluir um cargo que possui vagas ativas.",
      };
    }

    const cargo = await cargoRepository.softDelete(id);

    if (!cargo) {
      return { success: false, message: "Cargo não encontrado" };
    }

    revalidatePath("/cargos");
    return {
      success: true,
      message: "Cargo excluído com sucesso.",
    };
  } catch {
    return {
      success: false,
      message: "Erro ao excluir cargo.",
    };
  }
}
