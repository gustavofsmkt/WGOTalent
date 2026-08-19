"use server";

import { revalidatePath } from "next/cache";
import { candidatoRepository, type CandidatoDetailCompleto } from "~/server/db/repositories/candidato";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { type Candidato } from "~/server/db/schema";
import {
  candidatoAgregadoSchema,
  type CandidatoAgregadoInput,
} from "~/lib/validation/candidato";

export type ActionState<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message?: string; errors?: Record<string, string[]> };

// TODO: Motor de agentes nativo (classificador_aderencia) ainda não implementado — ver ADR-0007. Fluxo alvo: comparar resumo x resumo em lote (batch de até 25), aplicar threshold configurável, e só então criar a triagem para avaliação completa.

export async function createCandidato(
  data: unknown,
): Promise<ActionState<Candidato>> {
  const parsed = candidatoAgregadoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { cargoInteresseId, areaInteresseId, email } = parsed.data;

    // Validar unicidade de email
    const emailExists = await candidatoRepository.findByEmailIncludingDeleted(email);
    if (emailExists) {
      return {
        success: false,
        message: "O e-mail informado já está cadastrado no sistema.",
      };
    }

    // Validar referências
    if (cargoInteresseId) {
      const cargo = await cargoRepository.findById(cargoInteresseId);
      if (!cargo || !cargo.ativo) {
        return { success: false, message: "O cargo selecionado é inválido ou está inativo." };
      }
    }

    if (areaInteresseId) {
      const depto = await departamentoRepository.findById(areaInteresseId);
      if (!depto) {
        return { success: false, message: "O departamento selecionado é inválido." };
      }
    }

    const result = await candidatoRepository.createAggregate(parsed.data);

    if (!result) {
      throw new Error("Falha ao retornar o candidato criado.");
    }

    revalidatePath("/candidatos");

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("[createCandidato] Error:", error);
    return {
      success: false,
      message: "Erro ao criar candidato. Verifique os dados e tente novamente.",
    };
  }
}

export async function updateCandidato(
  id: string,
  data: unknown,
): Promise<ActionState<CandidatoDetailCompleto>> {
  const parsed = candidatoAgregadoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { cargoInteresseId, areaInteresseId, email } = parsed.data;

    const existingCandidato = await candidatoRepository.findById(id);
    if (!existingCandidato) {
      return { success: false, message: "Candidato não encontrado." };
    }

    // Validar unicidade de email se foi alterado
    if (email !== existingCandidato.email) {
      const emailExists = await candidatoRepository.findByEmailIncludingDeleted(email);
      if (emailExists) {
        return {
          success: false,
          message: "O e-mail informado já está cadastrado no sistema.",
        };
      }
    }

    // Validar referências
    if (cargoInteresseId) {
      const cargo = await cargoRepository.findById(cargoInteresseId);
      if (!cargo || !cargo.ativo) {
        return { success: false, message: "O cargo selecionado é inválido ou está inativo." };
      }
    }

    if (areaInteresseId) {
      const depto = await departamentoRepository.findById(areaInteresseId);
      if (!depto) {
        return { success: false, message: "O departamento selecionado é inválido." };
      }
    }

    // Certificar-se que filhos pertencem a esse candidato caso possuam IDs na request
    // A validação de IDs de filhos está sendo tratada no repository (atualizando apenas com and(eq(id), eq(candidatoId)))
    // Evitando duplicações ou modificação de filhos de outro candidato.
    
    const result = await candidatoRepository.updateAggregate(id, parsed.data);

    if (!result) {
      throw new Error("Falha ao retornar o candidato atualizado.");
    }

    revalidatePath("/candidatos");
    revalidatePath(`/candidatos/${id}`);

    return {
      success: true,
      message: "Candidato atualizado com sucesso.",
      data: result,
    };
  } catch (error) {
    console.error("[updateCandidato] Erro:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado ao atualizar o candidato.",
    };
  }
}
