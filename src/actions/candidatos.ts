"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { db } from "~/server/db";
import { type Candidato } from "~/server/db/schema";
import {
  candidatoAgregadoSchema,
  type CandidatoAgregadoInput,
} from "~/lib/validation/candidato";
import { env } from "~/env";

export type ActionState<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message?: string; errors?: Record<string, string[]> };

/**
 * Dispara a classificação para um candidato recém-criado,
 * buscando vagas abertas na mesma cidade e acionando o webhook/agente.
 * Fire-and-forget (não falha a transaction).
 */
async function dispararAgenteClassificador(candidato: Candidato): Promise<void> {
  try {
    const webhookUrl = env.CLASSIFICADOR_N8N_WEBHOOK_URL;
    if (!webhookUrl) return;

    // Buscar vagas abertas na mesma cidade
    const vagasAbertas = await db.query.vagas.findMany({
      where: (v, { and, eq, isNull }) =>
        and(
          isNull(v.deletedAt),
          eq(v.status, "aberta"),
          eq(v.cidade, candidato.cidade)
        ),
      with: {
        cargo: {
          with: { departamento: true },
        },
      },
      limit: 50,
    });

    if (vagasAbertas.length === 0) return;

    // Obter candidato completo para o payload
    const candidatoCompleto = await db.query.candidatos.findFirst({
      where: (c, { eq }) => eq(c.id, candidato.id),
      with: {
        formacoes: { where: (f, { isNull }) => isNull(f.deletedAt) },
        experiencias: { where: (e, { isNull }) => isNull(e.deletedAt) },
        certificacoes: { where: (ct, { isNull }) => isNull(ct.deletedAt) },
      },
    });

    if (!candidatoCompleto) return;

    const payload = {
      candidato: candidatoCompleto,
      vagas: vagasAbertas,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `[dispararAgenteClassificador] Falha no disparo (${response.status} ${response.statusText})`
      );
    }
  } catch (error) {
    console.error("[dispararAgenteClassificador] Erro:", error);
  }
}

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

    // Disparar classificador fire-and-forget se origem='manual'
    if (result.origem === "manual") {
      try {
        if (typeof after === "function") {
          after(async () => {
            await dispararAgenteClassificador(result);
          });
        } else {
          void dispararAgenteClassificador(result);
        }
      } catch (err) {
        void dispararAgenteClassificador(result).catch(
          e => console.error("[createCandidato] Erro no background:", e)
        );
      }
    }

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
  data: CandidatoAgregadoInput,
): Promise<ActionState<Candidato>> {
  // To be implemented in TASK-092
  throw new Error("Not implemented yet");
}
