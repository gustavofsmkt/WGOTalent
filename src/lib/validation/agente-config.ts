import { z } from "zod";
import { nonEmptyString } from "./common";
import {
  isModeloValido,
  isProviderConhecido,
} from "~/lib/agents/provider-catalog";

/**
 * Parâmetros de geração por slot, persistidos em `agente_config.params`
 * (jsonb). Nomes canônicos — cada adapter de provedor mapeia para os da sua
 * API (ver src/lib/agents/shared.ts `LlmParams`).
 */
export const llmParamsSchema = z
  .object({
    temperature: z
      .number()
      .min(0, "temperature deve ser entre 0 e 2")
      .max(2, "temperature deve ser entre 0 e 2")
      .optional(),
    maxOutputTokens: z
      .number()
      .int("maxOutputTokens deve ser inteiro")
      .positive("maxOutputTokens deve ser positivo")
      .max(32000, "maxOutputTokens deve ser no máximo 32000")
      .optional(),
    topP: z
      .number()
      .min(0, "topP deve ser entre 0 e 1")
      .max(1, "topP deve ser entre 0 e 1")
      .optional(),
  })
  .strict();

export type LlmParamsInput = z.infer<typeof llmParamsSchema>;

/** Lê `agente_config.params` (jsonb, tipo `unknown`) com tolerância — valor inválido vira `undefined` em vez de derrubar o agente. */
export function parseLlmParams(raw: unknown): LlmParamsInput | undefined {
  if (raw === null || raw === undefined) return undefined;
  const parsed = llmParamsSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export const agenteConfigUpdateSchema = z
  .object({
    provider: nonEmptyString("O provedor é obrigatório").max(60),
    model: nonEmptyString("O modelo é obrigatório").max(100),
    systemPrompt: nonEmptyString("O system prompt é obrigatório"),
    userPrompt: nonEmptyString("O user prompt é obrigatório"),
    params: llmParamsSchema.nullish(),
    thresholdScore: z
      .number()
      .min(0, "O threshold deve ser entre 0 e 100")
      .max(100, "O threshold deve ser entre 0 e 100")
      .optional()
      .nullable(),
    ativo: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (!isProviderConhecido(val.provider)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["provider"],
        message: "Provedor não suportado pelo motor de agentes.",
      });
      return;
    }
    if (!isModeloValido(val.provider, val.model)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["model"],
        message: "Modelo indisponível para o provedor selecionado.",
      });
    }
  });

export type AgenteConfigUpdateInput = z.input<typeof agenteConfigUpdateSchema>;
export type AgenteConfigUpdateOutput = z.output<
  typeof agenteConfigUpdateSchema
>;
