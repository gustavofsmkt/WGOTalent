import { describe, expect, it } from "vitest";
import {
  createVagaSchema,
  notaCorteSchema,
  posicoesDisponiveisSchema,
  remuneracaoOferecidaSchema,
  statusVagaSchema,
  updateVagaSchema,
} from "~/lib/validation/vaga";

const VALID_CARGO_ID = "550e8400-e29b-41d4-a716-446655440000";

const validVagaPayload = {
  cargoId: VALID_CARGO_ID,
  status: "aberta" as const,
  posicoesDisponiveis: 3,
  notaCorte: "72.50",
  remuneracaoOferecida: "4500.00",
  cidade: "São Paulo",
  uf: "SP",
};

describe("vaga validation schemas", () => {
  describe("statusVagaSchema", () => {
    it("accepts all valid vaga status values", () => {
      const validStatuses = [
        "aberta",
        "concluida",
        "cancelada",
        "pausada",
        "incompleta",
      ] as const;

      validStatuses.forEach((status) => {
        expect(statusVagaSchema.parse(status)).toBe(status);
      });
    });

    it("rejects invalid status values", () => {
      expect(statusVagaSchema.safeParse("fechada").success).toBe(false);
      expect(statusVagaSchema.safeParse("em_andamento").success).toBe(false);
      expect(statusVagaSchema.safeParse("").success).toBe(false);
      expect(statusVagaSchema.safeParse(null).success).toBe(false);
      expect(statusVagaSchema.safeParse(123).success).toBe(false);
    });
  });

  describe("posicoesDisponiveisSchema", () => {
    it("accepts valid positive integers", () => {
      expect(posicoesDisponiveisSchema.parse(1)).toBe(1);
      expect(posicoesDisponiveisSchema.parse(10)).toBe(10);
      expect(posicoesDisponiveisSchema.parse(32767)).toBe(32767);
    });

    it("coerces and accepts valid numeric strings", () => {
      expect(posicoesDisponiveisSchema.parse("1")).toBe(1);
      expect(posicoesDisponiveisSchema.parse("  5  ")).toBe(5);
      expect(posicoesDisponiveisSchema.parse("100")).toBe(100);
    });

    it("rejects zero and negative numbers or strings", () => {
      const resZero = posicoesDisponiveisSchema.safeParse(0);
      expect(resZero.success).toBe(false);
      if (!resZero.success) {
        expect(resZero.error.errors[0]?.message).toBe(
          "Posições disponíveis deve ser maior que zero",
        );
      }

      const resNeg = posicoesDisponiveisSchema.safeParse(-2);
      expect(resNeg.success).toBe(false);
      if (!resNeg.success) {
        expect(resNeg.error.errors[0]?.message).toBe(
          "Posições disponíveis deve ser maior que zero",
        );
      }

      const resNegStr = posicoesDisponiveisSchema.safeParse("-5");
      expect(resNegStr.success).toBe(false);
      if (!resNegStr.success) {
        expect(resNegStr.error.errors[0]?.message).toBe(
          "Posições disponíveis deve ser maior que zero",
        );
      }
    });

    it("rejects floating point numbers and non-integer strings", () => {
      const resFloat = posicoesDisponiveisSchema.safeParse(1.5);
      expect(resFloat.success).toBe(false);
      if (!resFloat.success) {
        expect(resFloat.error.errors[0]?.message).toBe(
          "Posições disponíveis deve ser um número inteiro",
        );
      }

      const resFloatStr = posicoesDisponiveisSchema.safeParse("2.7");
      expect(resFloatStr.success).toBe(false);
      if (!resFloatStr.success) {
        expect(resFloatStr.error.errors[0]?.message).toBe(
          "Posições disponíveis deve ser um número inteiro",
        );
      }
    });

    it("rejects empty or non-numeric strings", () => {
      const resEmpty = posicoesDisponiveisSchema.safeParse("");
      expect(resEmpty.success).toBe(false);
      if (!resEmpty.success) {
        expect(resEmpty.error.errors[0]?.message).toBe(
          "Número de posições disponíveis é obrigatório",
        );
      }

      const resText = posicoesDisponiveisSchema.safeParse("abc");
      expect(resText.success).toBe(false);
      if (!resText.success) {
        expect(resText.error.errors[0]?.message).toBe(
          "Posições disponíveis deve ser um número inteiro",
        );
      }
    });

    it("rejects values exceeding smallint limit (32767)", () => {
      const resExceeded = posicoesDisponiveisSchema.safeParse(32768);
      expect(resExceeded.success).toBe(false);
      if (!resExceeded.success) {
        expect(resExceeded.error.errors[0]?.message).toBe(
          "Posições disponíveis excede o limite máximo permitido (32767)",
        );
      }
    });
  });

  describe("remuneracaoOferecidaSchema", () => {
    it("accepts null, undefined, and empty string converting them to null", () => {
      expect(remuneracaoOferecidaSchema.parse(null)).toBeNull();
      expect(remuneracaoOferecidaSchema.parse(undefined)).toBeNull();
      expect(remuneracaoOferecidaSchema.parse("")).toBeNull();
      expect(remuneracaoOferecidaSchema.parse("   ")).toBeNull();
    });

    it("accepts valid numbers and formats with 2 decimal places", () => {
      expect(remuneracaoOferecidaSchema.parse(4500)).toBe("4500.00");
      expect(remuneracaoOferecidaSchema.parse(4500.5)).toBe("4500.50");
      expect(remuneracaoOferecidaSchema.parse(0)).toBe("0.00");
      expect(remuneracaoOferecidaSchema.parse(99999999.99)).toBe("99999999.99");
    });

    it("accepts valid numeric strings including comma as decimal separator", () => {
      expect(remuneracaoOferecidaSchema.parse("4500")).toBe("4500.00");
      expect(remuneracaoOferecidaSchema.parse("  4500.50  ")).toBe("4500.50");
      expect(remuneracaoOferecidaSchema.parse("4500,75")).toBe("4500.75");
      expect(remuneracaoOferecidaSchema.parse("0")).toBe("0.00");
    });

    it("rejects negative numbers and negative numeric strings", () => {
      const resultNumber = remuneracaoOferecidaSchema.safeParse(-500);
      expect(resultNumber.success).toBe(false);
      if (!resultNumber.success) {
        expect(resultNumber.error.errors[0]?.message).toBe(
          "Remuneração não pode ser negativa",
        );
      }

      const resultString = remuneracaoOferecidaSchema.safeParse("-500.00");
      expect(resultString.success).toBe(false);
      if (!resultString.success) {
        expect(resultString.error.errors[0]?.message).toBe(
          "Remuneração não pode ser negativa",
        );
      }
    });

    it("rejects non-numeric strings and invalid formats", () => {
      const result = remuneracaoOferecidaSchema.safeParse("R$ 4.500,00");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          "Remuneração deve ser um número válido",
        );
      }
    });

    it("rejects values exceeding max allowed for numeric(10,2)", () => {
      const result = remuneracaoOferecidaSchema.safeParse(100000000);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          "Remuneração excede o limite máximo permitido",
        );
      }
    });
  });

  describe("notaCorteSchema", () => {
    it("accepts scores between 0 and 100 and normalizes two decimals", () => {
      expect(notaCorteSchema.parse(0)).toBe("0.00");
      expect(notaCorteSchema.parse("65")).toBe("65.00");
      expect(notaCorteSchema.parse("72,5")).toBe("72.50");
      expect(notaCorteSchema.parse(100)).toBe("100.00");
    });

    it("rejects empty, non-numeric and out-of-range scores", () => {
      expect(notaCorteSchema.safeParse("").success).toBe(false);
      expect(notaCorteSchema.safeParse("abc").success).toBe(false);
      expect(notaCorteSchema.safeParse(-0.01).success).toBe(false);
      expect(notaCorteSchema.safeParse(100.01).success).toBe(false);
    });
  });

  describe("vagaSchema and createVagaSchema", () => {
    it("validates and parses a full valid vaga payload", () => {
      const parsed = createVagaSchema.parse(validVagaPayload);
      expect(parsed).toEqual({
        cargoId: VALID_CARGO_ID,
        status: "aberta",
        posicoesDisponiveis: 3,
        notaCorte: "72.50",
        remuneracaoOferecida: "4500.00",
        cidade: "São Paulo",
        uf: "SP",
      });
    });

    it("applies defaults for status, positions and cutoff score", () => {
      const minimalPayload = {
        cargoId: VALID_CARGO_ID,
        cidade: "Rio de Janeiro",
        uf: "RJ",
      };

      const parsed = createVagaSchema.parse(minimalPayload);
      expect(parsed).toEqual({
        cargoId: VALID_CARGO_ID,
        status: "aberta",
        posicoesDisponiveis: 1,
        notaCorte: "65.00",
        remuneracaoOferecida: undefined,
        cidade: "Rio de Janeiro",
        uf: "RJ",
      });
    });

    it("normalizes UF to uppercase and trims strings", () => {
      const payload = {
        ...validVagaPayload,
        cidade: "  Curitiba  ",
        uf: "pr",
      };

      const parsed = createVagaSchema.parse(payload);
      expect(parsed.cidade).toBe("Curitiba");
      expect(parsed.uf).toBe("PR");
    });

    it("rejects invalid cargoId", () => {
      const resultInvalidUuid = createVagaSchema.safeParse({
        ...validVagaPayload,
        cargoId: "invalid-uuid",
      });
      expect(resultInvalidUuid.success).toBe(false);
      if (!resultInvalidUuid.success) {
        expect(resultInvalidUuid.error.errors[0]?.message).toBe(
          "ID do cargo inválido",
        );
      }

      const resultEmpty = createVagaSchema.safeParse({
        ...validVagaPayload,
        cargoId: "",
      });
      expect(resultEmpty.success).toBe(false);
    });

    it("rejects missing mandatory fields", () => {
      const withoutCargo = { ...validVagaPayload, cargoId: undefined };
      const withoutCidade = { ...validVagaPayload, cidade: undefined };
      const withoutUf = { ...validVagaPayload, uf: undefined };

      expect(createVagaSchema.safeParse(withoutCargo).success).toBe(false);
      expect(createVagaSchema.safeParse(withoutCidade).success).toBe(false);
      expect(createVagaSchema.safeParse(withoutUf).success).toBe(false);
    });

    it("rejects invalid UF", () => {
      const result = createVagaSchema.safeParse({
        ...validVagaPayload,
        uf: "XX",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("UF inválida");
      }
    });

    it("rejects cidade exceeding 100 characters", () => {
      const result = createVagaSchema.safeParse({
        ...validVagaPayload,
        cidade: "A".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          "Cidade deve ter no máximo 100 caracteres",
        );
      }
    });

    it("rejects unknown fields to prevent injecting id, timestamps, or deletedAt", () => {
      const payloadWithInjectedFields = {
        ...validVagaPayload,
        id: "550e8400-e29b-41d4-a716-446655440099",
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };

      const result = createVagaSchema.safeParse(payloadWithInjectedFields);
      expect(result.success).toBe(false);
    });
  });

  describe("updateVagaSchema", () => {
    it("allows updating a single valid field", () => {
      const updateStatus = { status: "pausada" as const };
      const parsedStatus = updateVagaSchema.parse(updateStatus);
      expect(parsedStatus).toEqual({ status: "pausada" });

      const updatePosicoes = { posicoesDisponiveis: 5 };
      const parsedPosicoes = updateVagaSchema.parse(updatePosicoes);
      expect(parsedPosicoes).toEqual({ posicoesDisponiveis: 5 });

      const updateRemuneracao = { remuneracaoOferecida: "6000.00" };
      const parsedRemuneracao = updateVagaSchema.parse(updateRemuneracao);
      expect(parsedRemuneracao).toEqual({ remuneracaoOferecida: "6000.00" });

      const parsedNotaCorte = updateVagaSchema.parse({ notaCorte: "80" });
      expect(parsedNotaCorte).toEqual({ notaCorte: "80.00" });
    });

    it("allows updating multiple fields partially", () => {
      const partialUpdate = {
        cidade: "Belo Horizonte",
        uf: "mg",
        status: "concluida" as const,
      };

      const parsed = updateVagaSchema.parse(partialUpdate);
      expect(parsed).toEqual({
        cidade: "Belo Horizonte",
        uf: "MG",
        status: "concluida",
      });
    });

    it("rejects an empty update object", () => {
      const result = updateVagaSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          "Pelo menos um campo deve ser informado para atualização",
        );
      }
    });

    it("rejects unknown fields in update", () => {
      const result = updateVagaSchema.safeParse({
        status: "pausada",
        unrecognizedField: "foo",
      });
      expect(result.success).toBe(false);
    });
  });
});
