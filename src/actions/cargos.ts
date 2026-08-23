"use server";

import { revalidatePath } from "next/cache";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import {
  createCargoSchema,
  updateCargoSchema,
} from "~/lib/validation/cargo";
import type { Cargo } from "~/server/db/schema";
import type { ActionState } from "~/lib/action-utils";

export async function createCargo(
  data: unknown,
): Promise<ActionState<Cargo>> {
  const parsed = createCargoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const departamento = await departamentoRepository.findById(parsed.data.departamentoId);
    if (!departamento) {
      return {
        success: false,
        message: "Departamento selecionado não encontrado ou inativo.",
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
      const departamento = await departamentoRepository.findById(parsed.data.departamentoId);
      if (!departamento) {
        return {
          success: false,
          message: "Departamento selecionado não encontrado ou inativo.",
        };
      }
    }

    const cargo = await cargoRepository.update(id, parsed.data);
    
    if (!cargo) {
      return { success: false, message: "Cargo não encontrado" };
    }

    revalidatePath("/cargos");
    revalidatePath(`/cargos/${id}`);
    
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

export async function deleteCargo(
  id: string,
): Promise<ActionState> {
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
  } catch (error) {
    return {
      success: false,
      message: "Erro ao excluir cargo.",
    };
  }
}
