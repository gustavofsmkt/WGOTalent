import { z } from "zod";
import { nonEmptyString } from "./common";

export const agenteConfigUpdateSchema = z.object({
  provider: nonEmptyString("O provedor é obrigatório").max(60),
  model: nonEmptyString("O modelo é obrigatório").max(100),
  systemPrompt: nonEmptyString("O system prompt é obrigatório"),
  userPrompt: nonEmptyString("O user prompt é obrigatório"),
  thresholdScore: z
    .number()
    .min(0, "O threshold deve ser entre 0 e 100")
    .max(100, "O threshold deve ser entre 0 e 100")
    .optional()
    .nullable(),
  ativo: z.boolean(),
});

export type AgenteConfigUpdateInput = z.input<typeof agenteConfigUpdateSchema>;
export type AgenteConfigUpdateOutput = z.output<
  typeof agenteConfigUpdateSchema
>;
