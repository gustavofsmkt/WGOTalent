"use server";

import { revalidatePath } from "next/cache";
import postgres from "postgres";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import {
  createDepartamentoSchema,
  updateDepartamentoSchema,
} from "~/lib/validation/departamento";
import type { Departamento } from "~/server/db/schema";
import type { ActionState } from "~/lib/action-utils";

export async function createDepartamento(
  data: unknown,
): Promise<ActionState<Departamento>> {
  const parsed = createDepartamentoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const departamento = await departamentoRepository.create(parsed.data);
    revalidatePath("/departamentos");
    return {
      success: true,
      data: departamento,
    };
  } catch (error) {
    // Tratamento basico para unique constraint (pode ser refinado depois)
    if (
      error instanceof postgres.PostgresError &&
      (error.message.includes("unique") || error.code === "23505")
    ) {
      return {
        success: false,
        message: "Já existe um departamento com este nome.",
      };
    }
    return {
      success: false,
      message: "Erro ao criar departamento.",
    };
  }
}

export async function updateDepartamento(
  id: string,
  data: unknown,
): Promise<ActionState<Departamento>> {
  const parsed = updateDepartamentoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const departamento = await departamentoRepository.update(id, parsed.data);

    if (!departamento) {
      return { success: false, message: "Departamento não encontrado" };
    }

    revalidatePath("/departamentos");
    revalidatePath(`/departamentos/${id}`);

    return {
      success: true,
      data: departamento,
    };
  } catch (error) {
    if (
      error instanceof postgres.PostgresError &&
      (error.message.includes("unique") || error.code === "23505")
    ) {
      return {
        success: false,
        message: "Já existe um departamento com este nome.",
      };
    }
    return {
      success: false,
      message: "Erro ao atualizar departamento.",
    };
  }
}

export async function deleteDepartamento(id: string): Promise<ActionState> {
  try {
    const hasActiveCargos = await departamentoRepository.hasActiveCargos(id);

    if (hasActiveCargos) {
      return {
        success: false,
        message:
          "Não é possível excluir um departamento que possui cargos ativos.",
      };
    }

    const departamento = await departamentoRepository.softDelete(id);

    if (!departamento) {
      return { success: false, message: "Departamento não encontrado" };
    }

    revalidatePath("/departamentos");
    return {
      success: true,
      message: "Departamento excluído com sucesso.",
    };
  } catch (error) {
    return {
      success: false,
      message: "Erro ao excluir departamento.",
    };
  }
}
