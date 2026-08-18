import { z } from "zod";
import { ufSchema } from "./common";

/**
 * Status válidos para uma vaga no WGOTalent.
 */
export const STATUS_VAGA_VALUES = [
  "aberta",
  "concluida",
  "cancelada",
  "pausada",
  "incompleta",
] as const;

export type StatusVaga = (typeof STATUS_VAGA_VALUES)[number];

/**
 * Schema para validação do status da vaga.
 */
export const statusVagaSchema = z.enum(STATUS_VAGA_VALUES, {
  required_error: "Status da vaga é obrigatório",
  invalid_type_error: "Status da vaga inválido",
  message:
    "Status da vaga inválido. Opções: aberta, concluida, cancelada, pausada, incompleta",
});

/**
 * Schema para validação e coerção de posições disponíveis (smallint > 0).
 * Aceita número ou string numérica no boundary e garante que o valor seja um inteiro positivo.
 */
export const posicoesDisponiveisSchema = z
  .union([
    z.number({ invalid_type_error: "Posições disponíveis deve ser um número" }),
    z.string({
      invalid_type_error: "Posições disponíveis deve ser um texto ou número",
    }),
  ])
  .transform((val, ctx) => {
    let num: number;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Número de posições disponíveis é obrigatório",
        });
        return z.NEVER;
      }
      num = Number(trimmed);
    } else {
      num = val;
    }

    if (Number.isNaN(num) || !Number.isFinite(num) || !Number.isInteger(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Posições disponíveis deve ser um número inteiro",
      });
      return z.NEVER;
    }

    if (num <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Posições disponíveis deve ser maior que zero",
      });
      return z.NEVER;
    }

    if (num > 32767) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Posições disponíveis excede o limite máximo permitido (32767)",
      });
      return z.NEVER;
    }

    return num;
  });

/**
 * Schema para validação e normalização de remuneração oferecida (numeric 10,2).
 * Aceita números ou strings numéricas, normaliza vírgula para ponto e formata com 2 casas decimais.
 * Valores vazios, nulos ou indefinidos são convertidos para null.
 */
export const remuneracaoOferecidaSchema = z
  .union([
    z.number({ invalid_type_error: "Remuneração deve ser um número" }),
    z.string({ invalid_type_error: "Remuneração deve ser um texto ou número" }),
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
          message: "Remuneração deve ser um número válido",
        });
        return z.NEVER;
      }
      if (num < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Remuneração não pode ser negativa",
        });
        return z.NEVER;
      }
      if (num > 99999999.99) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Remuneração excede o limite máximo permitido",
        });
        return z.NEVER;
      }
      return num.toFixed(2);
    }

    if (Number.isNaN(val) || !Number.isFinite(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Remuneração deve ser um número válido",
      });
      return z.NEVER;
    }
    if (val < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Remuneração não pode ser negativa",
      });
      return z.NEVER;
    }
    if (val > 99999999.99) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Remuneração excede o limite máximo permitido",
      });
      return z.NEVER;
    }
    return val.toFixed(2);
  });

/**
 * Schema base para validação dos campos de Vaga.
 */
export const vagaSchema = z
  .object({
    cargoId: z
      .string({
        required_error: "Cargo é obrigatório",
        invalid_type_error: "Cargo deve ser um texto",
      })
      .trim()
      .min(1, { message: "Cargo é obrigatório" })
      .uuid({ message: "ID do cargo inválido" }),
    status: statusVagaSchema.default("aberta"),
    posicoesDisponiveis: posicoesDisponiveisSchema.default(1),
    remuneracaoOferecida: remuneracaoOferecidaSchema.optional(),
    cidade: z
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

/**
 * Schema para criação de Vaga.
 * Não aceita id, timestamps ou deletedAt do formulário.
 */
export const createVagaSchema = vagaSchema;
export const criarVagaSchema = createVagaSchema;

export type CreateVagaInput = z.infer<typeof createVagaSchema>;

/**
 * Schema para atualização de Vaga.
 * Permite atualização parcial dos campos válidos e não aceita id, timestamps ou deletedAt.
 */
export const updateVagaSchema = vagaSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser informado para atualização",
  });
export const editarVagaSchema = updateVagaSchema;

export type UpdateVagaInput = z.infer<typeof updateVagaSchema>;
