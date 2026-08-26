"use server";

import { revalidatePath } from "next/cache";
import postgres from "postgres";
import { cidadeRepository } from "~/server/db/repositories/cidade";
import { createCidadeSchema } from "~/lib/validation/cidade";
import type { Cidade } from "~/server/db/schema";
import type { ActionState } from "~/lib/action-utils";

export async function createCidade(
  data: unknown,
): Promise<ActionState<Cidade>> {
  const parsed = createCidadeSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const cidade = await cidadeRepository.create(parsed.data);
    revalidatePath("/admin");
    revalidatePath("/vagas/novo");
    return { success: true, data: cidade };
  } catch (error) {
    if (
      error instanceof postgres.PostgresError &&
      (error.message.includes("unique") || error.code === "23505")
    ) {
      return { success: false, message: "Esta cidade já está cadastrada." };
    }
    return { success: false, message: "Erro ao criar cidade." };
  }
}

export async function deleteCidade(id: string): Promise<ActionState> {
  try {
    const cidade = await cidadeRepository.softDelete(id);
    if (!cidade) return { success: false, message: "Cidade não encontrada." };
    revalidatePath("/admin");
    revalidatePath("/vagas/novo");
    return { success: true, message: "Cidade excluída com sucesso." };
  } catch {
    return { success: false, message: "Erro ao excluir cidade." };
  }
}
