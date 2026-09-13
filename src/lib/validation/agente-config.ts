import { z } from "zod";
import { nonEmptyString } from "./common";
import {
  isModeloValido,
  isProviderConhecido,
} from "~/lib/agents/provider-catalog";

export const agenteConfigUpdateSchema = z
  .object({
    provider: nonEmptyString("O provedor é obrigatório").max(60),
    // O select envia "" quando nenhuma credencial está escolhida — normaliza
    // para null antes de validar como uuid.
    credencialId: z.preprocess(
      (v) => (v === "" || v === undefined ? null : v),
      z.string().uuid("Credencial inválida").nullable(),
    ),
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
    // Um agente só pode ser ativado apontando para uma credencial específica.
    if (val.ativo && !val.credencialId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["credencialId"],
        message: "Selecione uma credencial para ativar este agente.",
      });
    }
  });

export type AgenteConfigUpdateInput = z.input<typeof agenteConfigUpdateSchema>;
export type AgenteConfigUpdateOutput = z.output<
  typeof agenteConfigUpdateSchema
>;
