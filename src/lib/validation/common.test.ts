import { describe, expect, it } from "vitest";
import {
  BRAZILIAN_UFS,
  coerceBoolean,
  coerceInt,
  coerceNonNegativeInt,
  coerceNonNegativeNumber,
  coerceNumber,
  coercePositiveInt,
  coercePositiveNumber,
  dateStringSchema,
  emailSchema,
  nonEmptyString,
  trimmedString,
  ufSchema,
  urlSchema,
  uuidSchema,
} from "~/lib/validation/common";

describe("common validation schemas", () => {
  describe("uuidSchema", () => {
    it("accepts a valid UUID", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      const result = uuidSchema.safeParse(validUuid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validUuid);
      }
    });

    it("rejects an invalid UUID with pt-BR error message", () => {
      const result = uuidSchema.safeParse("not-a-uuid");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe("UUID inválido");
      }
    });

    it("handles explicit nullability when chained", () => {
      const nullableUuid = uuidSchema.nullable();
      expect(nullableUuid.safeParse(null).success).toBe(true);
      expect(nullableUuid.safeParse(undefined).success).toBe(false);

      const optionalUuid = uuidSchema.optional();
      expect(optionalUuid.safeParse(undefined).success).toBe(true);
      expect(optionalUuid.safeParse(null).success).toBe(false);
    });
  });

  describe("trimmedString", () => {
    it("trims surrounding whitespace", () => {
      const result = trimmedString.safeParse("   valor com espaços   ");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("valor com espaços");
      }
    });
  });

  describe("nonEmptyString", () => {
    it("accepts valid non-empty string after trim", () => {
      const schema = nonEmptyString("Nome é obrigatório");
      const result = schema.safeParse("  João Silva  ");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("João Silva");
      }
    });

    it("rejects empty or whitespace-only string with custom message", () => {
      const schema = nonEmptyString("Título é obrigatório");
      const resultEmpty = schema.safeParse("");
      expect(resultEmpty.success).toBe(false);
      if (!resultEmpty.success) {
        expect(resultEmpty.error.errors[0]?.message).toBe(
          "Título é obrigatório",
        );
      }

      const resultWhitespace = schema.safeParse("    ");
      expect(resultWhitespace.success).toBe(false);
      if (!resultWhitespace.success) {
        expect(resultWhitespace.error.errors[0]?.message).toBe(
          "Título é obrigatório",
        );
      }
    });
  });

  describe("emailSchema", () => {
    it("normalizes email to lowercase and trims whitespace", () => {
      const result = emailSchema.safeParse("  USER@Dominio.COM.br ");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("user@dominio.com.br");
      }
    });

    it("rejects invalid email format with pt-BR message", () => {
      const result = emailSchema.safeParse("invalido@");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe("E-mail inválido");
      }
    });
  });

  describe("urlSchema", () => {
    it("accepts valid URL", () => {
      const result = urlSchema.safeParse("https://linkedin.com/in/usuario");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("https://linkedin.com/in/usuario");
      }
    });

    it("rejects invalid URL with pt-BR message", () => {
      const result = urlSchema.safeParse("not-a-url");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe("URL inválida");
      }
    });
  });

  describe("ufSchema", () => {
    it("contains exactly 27 Brazilian UFs", () => {
      expect(BRAZILIAN_UFS).toHaveLength(27);
      expect(BRAZILIAN_UFS).toContain("SP");
      expect(BRAZILIAN_UFS).toContain("DF");
      expect(BRAZILIAN_UFS).toContain("GO");
    });

    it("accepts valid uppercase and lowercase UFs and normalizes to uppercase", () => {
      const resultUpper = ufSchema.safeParse("SP");
      expect(resultUpper.success).toBe(true);
      if (resultUpper.success) {
        expect(resultUpper.data).toBe("SP");
      }

      const resultLower = ufSchema.safeParse("  mg  ");
      expect(resultLower.success).toBe(true);
      if (resultLower.success) {
        expect(resultLower.data).toBe("MG");
      }
    });

    it("rejects invalid state abbreviations with pt-BR message", () => {
      const result = ufSchema.safeParse("XX");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("UF inválida");
      }
    });
  });

  describe("dateStringSchema", () => {
    it("accepts valid ISO calendar date", () => {
      const result = dateStringSchema.safeParse("1995-08-25");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("1995-08-25");
      }
    });

    it("accepts valid leap year date (2024-02-29)", () => {
      const result = dateStringSchema.safeParse("2024-02-29");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("2024-02-29");
      }
    });

    it("rejects non-leap year 29th of February (2023-02-29)", () => {
      const result = dateStringSchema.safeParse("2023-02-29");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("Data inválida");
      }
    });

    it("rejects invalid month 13 or invalid day 32", () => {
      expect(dateStringSchema.safeParse("2024-13-01").success).toBe(false);
      expect(dateStringSchema.safeParse("2024-04-31").success).toBe(false);
    });

    it("rejects Brazilian format DD/MM/YYYY expecting ISO YYYY-MM-DD", () => {
      const result = dateStringSchema.safeParse("25/08/1995");
      expect(result.success).toBe(false);
    });
  });

  describe("coercions", () => {
    describe("coerceInt", () => {
      it("coerces string numbers to integer", () => {
        expect(coerceInt.parse("42")).toBe(42);
        expect(coerceInt.parse("-10")).toBe(-10);
      });

      it("rejects non-integers with pt-BR message", () => {
        const result = coerceInt.safeParse("42.5");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0]?.message).toBe(
            "Valor deve ser um número inteiro",
          );
        }
      });
    });

    describe("coercePositiveInt", () => {
      it("accepts positive integer", () => {
        expect(coercePositiveInt.parse("5")).toBe(5);
      });

      it("rejects zero and negative integers", () => {
        const resultZero = coercePositiveInt.safeParse("0");
        expect(resultZero.success).toBe(false);

        const resultNeg = coercePositiveInt.safeParse("-3");
        expect(resultNeg.success).toBe(false);
      });
    });

    describe("coerceNonNegativeInt", () => {
      it("accepts zero and positive integers", () => {
        expect(coerceNonNegativeInt.parse("0")).toBe(0);
        expect(coerceNonNegativeInt.parse("10")).toBe(10);
      });

      it("rejects negative integers", () => {
        expect(coerceNonNegativeInt.safeParse("-1").success).toBe(false);
      });
    });

    describe("coerceNumber and variants", () => {
      it("coerces decimal strings to numbers", () => {
        expect(coerceNumber.parse("1500.50")).toBe(1500.5);
      });

      it("rejects non-numeric string", () => {
        expect(coerceNumber.safeParse("abc").success).toBe(false);
      });

      it("validates positive and non-negative numbers", () => {
        expect(coercePositiveNumber.parse("0.01")).toBe(0.01);
        expect(coercePositiveNumber.safeParse("0").success).toBe(false);

        expect(coerceNonNegativeNumber.parse("0")).toBe(0);
        expect(coerceNonNegativeNumber.safeParse("-0.01").success).toBe(false);
      });
    });

    describe("coerceBoolean", () => {
      it("coerces boolean values", () => {
        expect(coerceBoolean.parse(true)).toBe(true);
        expect(coerceBoolean.parse(false)).toBe(false);
      });
    });
  });
});
