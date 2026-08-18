import { z } from "zod";

/**
 * Siglas das 27 Unidades Federativas do Brasil.
 */
export const BRAZILIAN_UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export type BrazilianUF = (typeof BRAZILIAN_UFS)[number];

/**
 * Validação de UUID v4 ou padrão.
 */
export const uuidSchema = z
  .string({
    required_error: "ID é obrigatório",
    invalid_type_error: "ID deve ser um texto",
  })
  .uuid({ message: "UUID inválido" });

/**
 * String básica com trim automático de espaços.
 */
export const trimmedString = z
  .string({
    required_error: "Campo obrigatório",
    invalid_type_error: "Campo deve ser um texto",
  })
  .trim();

/**
 * Helper para strings obrigatórias não vazias após trim.
 */
export const nonEmptyString = (message = "Campo obrigatório") =>
  z
    .string({
      required_error: message,
      invalid_type_error: "Campo deve ser um texto",
    })
    .trim()
    .min(1, { message });

/**
 * Validação e normalização de e-mail.
 */
export const emailSchema = z
  .string({
    required_error: "E-mail é obrigatório",
    invalid_type_error: "E-mail deve ser um texto",
  })
  .trim()
  .toLowerCase()
  .email({ message: "E-mail inválido" });

/**
 * Validação de URLs (ex: LinkedIn, Portfólio).
 */
export const urlSchema = z
  .string({
    required_error: "URL é obrigatória",
    invalid_type_error: "URL deve ser um texto",
  })
  .trim()
  .url({ message: "URL inválida" });

/**
 * Validação de UF brasileira com normalização automática para maiúsculas.
 */
export const ufSchema = z
  .string({
    required_error: "UF é obrigatória",
    invalid_type_error: "UF deve ser um texto",
  })
  .trim()
  .transform((val) => val.toUpperCase())
  .refine(
    (val): val is BrazilianUF => BRAZILIAN_UFS.includes(val as BrazilianUF),
    {
      message:
        "UF inválida. Use uma sigla válida de estado brasileiro (ex: SP, RJ, MG)",
    },
  );

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validação de data no formato ISO YYYY-MM-DD verificando existência no calendário.
 */
export const dateStringSchema = z
  .string({
    required_error: "Data é obrigatória",
    invalid_type_error: "Data deve ser um texto",
  })
  .trim()
  .refine(
    (val) => {
      if (!ISO_DATE_REGEX.test(val)) return false;
      const [yearStr, monthStr, dayStr] = val.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);

      if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
        return false;
      }

      const parsedDate = new Date(year, month - 1, day);
      return (
        parsedDate.getFullYear() === year &&
        parsedDate.getMonth() === month - 1 &&
        parsedDate.getDate() === day
      );
    },
    { message: "Data inválida. Use o formato AAAA-MM-DD" },
  );

/**
 * Coerção para número inteiro.
 */
export const coerceInt = z.coerce
  .number({
    required_error: "Valor é obrigatório",
    invalid_type_error: "Valor deve ser um número",
  })
  .int({ message: "Valor deve ser um número inteiro" });

/**
 * Coerção para número inteiro positivo (> 0).
 */
export const coercePositiveInt = coerceInt.positive({
  message: "Valor deve ser um número inteiro positivo",
});

/**
 * Coerção para número inteiro não negativo (>= 0).
 */
export const coerceNonNegativeInt = coerceInt.min(0, {
  message: "Valor não pode ser negativo",
});

/**
 * Coerção para número real / decimal.
 */
export const coerceNumber = z.coerce
  .number({
    required_error: "Valor é obrigatório",
    invalid_type_error: "Valor deve ser um número válido",
  })
  .finite({ message: "Valor deve ser um número finito" });

/**
 * Coerção para número real positivo (> 0).
 */
export const coercePositiveNumber = coerceNumber.positive({
  message: "Valor deve ser maior que zero",
});

/**
 * Coerção para número real não negativo (>= 0).
 */
export const coerceNonNegativeNumber = coerceNumber.min(0, {
  message: "Valor não pode ser negativo",
});

/**
 * Coerção para booleano.
 */
export const coerceBoolean = z.coerce.boolean();
