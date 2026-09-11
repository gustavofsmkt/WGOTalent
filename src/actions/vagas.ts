"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
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

function agendarMatchingVaga(vagaId: string): void {
  after(async () => {
    try {
      await orquestrarParaVagaNova(vagaId);
    } catch (error) {
      console.error("[VagaActions] Falha na orquestração de matching:", error);
    }
  });
}

function mesmasCidades(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const ordenadasA = [...a].sort();
  const ordenadasB = [...b].sort();
  return ordenadasA.every(
    (cidadeId, index) => cidadeId === ordenadasB[index],
  );
}

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

    if (vaga.status === "aberta") {
      agendarMatchingVaga(vaga.id);
    }

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

    const vagaAnterior = await vagaRepository.findById(id);
    if (!vagaAnterior) {
      return { success: false, message: "Vaga não encontrada" };
    }
    const cidadesAnteriores =
      parsed.data.cidadeIds !== undefined
        ? await vagaRepository.findCidadeIdsByVagaId(id)
        : [];

    if (parsed.data.cidadeIds !== undefined) {
      const cidadesRemovidas = cidadesAnteriores.filter(
        (cidadeId) => !parsed.data.cidadeIds?.includes(cidadeId),
      );
      if (cidadesRemovidas.length > 0) {
        return {
          success: false,
          message:
            "Não é permitido remover cidades de uma vaga existente. Apenas novas cidades podem ser adicionadas.",
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

    const deveReprocessar =
      vaga.status === "aberta" &&
      (vagaAnterior.status !== "aberta" ||
        (parsed.data.cargoId !== undefined &&
          parsed.data.cargoId !== vagaAnterior.cargoId) ||
        (parsed.data.notaCorte !== undefined &&
          parsed.data.notaCorte !== vagaAnterior.notaCorte) ||
        (parsed.data.cidadeIds !== undefined &&
          !mesmasCidades(parsed.data.cidadeIds, cidadesAnteriores)));

    if (deveReprocessar) {
      agendarMatchingVaga(vaga.id);
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
