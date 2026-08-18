import { z } from "zod";

/**
 * Schema base para validação dos campos de Departamento.
 */
export const departamentoSchema = z
  .object({
    nome: z
      .string({
        required_error: "Nome é obrigatório",
        invalid_type_error: "Nome deve ser um texto",
      })
      .trim()
      .min(1, { message: "Nome é obrigatório" })
      .max(120, { message: "Nome deve ter no máximo 120 caracteres" }),
    descricao: z
      .string({
        required_error: "Descrição é obrigatória",
        invalid_type_error: "Descrição deve ser um texto",
      })
      .trim()
      .min(1, { message: "Descrição é obrigatória" }),
  })
  .strict();

/**
 * Schema para criação de Departamento.
 * Não aceita id, timestamps ou deletedAt do formulário.
 */
export const createDepartamentoSchema = departamentoSchema;

export type CreateDepartamentoInput = z.infer<typeof createDepartamentoSchema>;

/**
 * Schema para atualização de Departamento.
 * Permite atualização parcial dos campos válidos e não aceita id, timestamps ou deletedAt.
 */
export const updateDepartamentoSchema = departamentoSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado para atualização",
  });

export type UpdateDepartamentoInput = z.infer<typeof updateDepartamentoSchema>;
