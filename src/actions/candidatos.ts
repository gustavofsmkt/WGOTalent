"use server";

import { type Candidato } from "~/server/db/schema";
import { type CandidatoAgregadoInput } from "~/lib/validation/candidato";

export type ActionState<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message?: string; errors?: Record<string, string[]> };

export async function createCandidato(
  data: CandidatoAgregadoInput,
): Promise<ActionState<Candidato>> {
  // To be implemented in TASK-091
  throw new Error("Not implemented yet");
}

export async function updateCandidato(
  id: string,
  data: CandidatoAgregadoInput,
): Promise<ActionState<Candidato>> {
  // To be implemented in TASK-092
  throw new Error("Not implemented yet");
}
