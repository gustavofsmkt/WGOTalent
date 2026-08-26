import { z } from "zod";
import { ufSchema } from "./common";

export const cidadeSchema = z
  .object({
    nome: z
      .string({
        required_error: "Cidade é obrigatória",
        invalid_type_error: "Cidade deve ser um texto",
      })
      .trim()
      .min(1, { message: "Cidade é obrigatória" })
      .max(100, { message: "Cidade deve ter no máximo 100 caracteres" }),
    uf: ufSchema,
  })
  .strict();

export const createCidadeSchema = cidadeSchema;

export type CreateCidadeInput = z.infer<typeof createCidadeSchema>;
