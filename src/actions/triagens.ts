"use server";

import { revalidatePath } from "next/cache";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { triagemSchema, updateTriagemSchema } from "~/lib/validation/triagem";
import type { ActionState } from "~/lib/action-utils";
import type { Triagem } from "~/server/db/schema";

const createTriagemSchema = triagemSchema;

export async function createTriagem(
  data: unknown,
): Promise<ActionState<Triagem>> {
  const parsed = createTriagemSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { vagaId, candidatoId, ...rest } = parsed.data;

  try {
    // Valida se candidato existe e está ativo
    const candidato = await candidatoRepository.findById(candidatoId);
    if (!candidato) {
      return { success: false, message: "Candidato não encontrado ou inativo." };
    }

    // Valida se vaga existe e está ativa
    const vaga = await vagaRepository.findById(vagaId);
    if (!vaga) {
      return { success: false, message: "Vaga não encontrada ou inativa." };
    }

    // Verifica restrição de domínio: unique parcial
    const emAndamentoExists = await triagemRepository.checkActiveEmAndamento(
      candidatoId,
      vagaId,
    );

    if (emAndamentoExists && parsed.data.resultado === "em_andamento") {
      return {
        success: false,
        message: "O candidato já possui uma triagem em andamento para esta vaga.",
      };
    }

    const triagem = await triagemRepository.create(parsed.data);
    revalidatePath("/triagens");
    revalidatePath(`/candidatos/${candidatoId}`);
    revalidatePath(`/vagas/${vagaId}`);
    
    return {
      success: true,
      data: triagem,
    };
  } catch (error: any) {
    if (error?.message?.includes("unique") || error?.code === "23505") {
      return {
        success: false,
        message: "O candidato já possui uma triagem em andamento para esta vaga.",
      };
    }
    return {
      success: false,
      message: "Erro ao criar triagem.",
    };
  }
}

export async function updateTriagem(
  id: string,
  data: unknown,
): Promise<ActionState<Triagem>> {
  const parsed = updateTriagemSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // Get existing triagem to check if we are violating the partial unique
    // For update, the schema prevents changing candidatoId and vagaId, but
    // we need to verify if changing to 'em_andamento' violates the constraint
    const existingTriagem = await triagemRepository.findByIdWithJoins(id);
    if (!existingTriagem) {
      return { success: false, message: "Triagem não encontrada." };
    }

    if (
      parsed.data.resultado === "em_andamento" &&
      existingTriagem.resultado !== "em_andamento"
    ) {
      const emAndamentoExists = await triagemRepository.checkActiveEmAndamento(
        existingTriagem.candidato.id,
        existingTriagem.vaga.id,
      );

      if (emAndamentoExists) {
        return {
          success: false,
          message: "O candidato já possui uma triagem em andamento para esta vaga.",
        };
      }
    }

    const triagem = await triagemRepository.update(id, parsed.data);
    revalidatePath("/triagens");
    revalidatePath(`/triagens/${id}`);
    revalidatePath(`/candidatos/${existingTriagem.candidato.id}`);
    revalidatePath(`/vagas/${existingTriagem.vaga.id}`);

    return {
      success: true,
      data: triagem,
    };
  } catch (error: any) {
    if (error?.message?.includes("unique") || error?.code === "23505") {
      return {
        success: false,
        message: "O candidato já possui uma triagem em andamento para esta vaga.",
      };
    }
    return {
      success: false,
      message: "Erro ao atualizar triagem.",
    };
  }
}

export async function deleteTriagem(
  id: string,
): Promise<ActionState> {
  try {
    const existingTriagem = await triagemRepository.findByIdWithJoins(id);
    if (!existingTriagem) {
       return { success: false, message: "Triagem não encontrada." };
    }

    await triagemRepository.softDelete(id);
    
    revalidatePath("/triagens");
    revalidatePath(`/triagens/${id}`);
    revalidatePath(`/candidatos/${existingTriagem.candidato.id}`);
    revalidatePath(`/vagas/${existingTriagem.vaga.id}`);

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Erro ao excluir triagem.",
    };
  }
}
