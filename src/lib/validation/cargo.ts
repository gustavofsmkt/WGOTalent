import { z } from "zod";

/**
 * Schema para validação e normalização de faixa salarial (numeric 10,2).
 * Aceita números ou strings numéricas, normaliza vírgula para ponto e formata com 2 casas decimais.
 * Valores vazios, nulos ou indefinidos são convertidos para null.
 */
export const faixaSalarialSchema = z
  .union([
    z.number({ invalid_type_error: "Faixa salarial deve ser um número" }),
    z.string({
      invalid_type_error: "Faixa salarial deve ser um texto ou número",
    }),
  ])
  .nullish()
  .transform((val, ctx) => {
    if (val === null || val === undefined) return null;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") return null;
      const normalized = trimmed.replace(",", ".");
      const num = Number(normalized);
      if (Number.isNaN(num) || !Number.isFinite(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Faixa salarial deve ser um número válido",
        });
        return z.NEVER;
      }
      if (num < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Faixa salarial não pode ser negativa",
        });
        return z.NEVER;
      }
      if (num > 99999999.99) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Faixa salarial excede o limite máximo permitido",
        });
        return z.NEVER;
      }
      return num.toFixed(2);
    }

    if (Number.isNaN(val) || !Number.isFinite(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Faixa salarial deve ser um número válido",
      });
      return z.NEVER;
    }
    if (val < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Faixa salarial não pode ser negativa",
      });
      return z.NEVER;
    }
    if (val > 99999999.99) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Faixa salarial excede o limite máximo permitido",
      });
      return z.NEVER;
    }
    return val.toFixed(2);
  });

/**
 * Schema base para validação dos campos de Cargo.
 */
export const cargoSchema = z
  .object({
    departamentoId: z
      .string({
        required_error: "Departamento é obrigatório",
        invalid_type_error: "Departamento deve ser um texto",
      })
      .trim()
      .min(1, { message: "Departamento é obrigatório" })
      .uuid({ message: "ID do departamento inválido" }),
    titulo: z
      .string({
        required_error: "Título é obrigatório",
        invalid_type_error: "Título deve ser um texto",
      })
      .trim()
      .min(1, { message: "Título é obrigatório" })
      .max(150, { message: "Título deve ter no máximo 150 caracteres" }),
    descricao: z
      .string({
        required_error: "Descrição é obrigatória",
        invalid_type_error: "Descrição deve ser um texto",
      })
      .trim()
      .min(1, { message: "Descrição é obrigatória" }),
    ativo: z
      .boolean({
        invalid_type_error: "Ativo deve ser um booleano",
      })
      .default(true),
    faixaSalarial: faixaSalarialSchema.optional(),
    requisitos: z
      .string({
        required_error: "Requisitos são obrigatórios",
        invalid_type_error: "Requisitos devem ser um texto",
      })
      .trim()
      .min(1, { message: "Requisitos são obrigatórios" }),
    requisitosDesejaveis: z
      .string({
        required_error: "Requisitos desejáveis são obrigatórios",
        invalid_type_error: "Requisitos desejáveis devem ser um texto",
      })
      .trim()
      .min(1, { message: "Requisitos desejáveis são obrigatórios" }),
    criteriosEliminatorios: z
      .string({
        required_error: "Critérios eliminatórios são obrigatórios",
        invalid_type_error: "Critérios eliminatórios devem ser um texto",
      })
      .trim()
      .min(1, { message: "Critérios eliminatórios são obrigatórios" }),
  })
  .strict();

/**
 * Schema para criação de Cargo.
 * Não aceita id, timestamps ou deletedAt do formulário.
 */
export const createCargoSchema = cargoSchema;

export type CreateCargoInput = z.infer<typeof createCargoSchema>;

/**
 * Schema para atualização de Cargo.
 * Permite atualização parcial dos campos válidos e não aceita id, timestamps ou deletedAt.
 */
export const updateCargoSchema = cargoSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado para atualização",
  });

export type UpdateCargoInput = z.infer<typeof updateCargoSchema>;
