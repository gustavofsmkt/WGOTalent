import { z } from "zod";
import { nonEmptyString } from "./common";
import {
  isModeloValido,
  isProviderConhecido,
} from "~/lib/agents/provider-catalog";

export const agenteConfigUpdateSchema = z
  .object({
    provider: nonEmptyString("O provedor é obrigatório").max(60),
    model: nonEmptyString("O modelo é obrigatório").max(100),
    systemPrompt: nonEmptyString("O system prompt é obrigatório"),
    userPrompt: nonEmptyString("O user prompt é obrigatório"),
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
