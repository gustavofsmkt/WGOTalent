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
const VALID_CIDADE_ID = "660e8400-e29b-41d4-a716-446655440001";

const validVagaPayload = {
  cargoId: VALID_CARGO_ID,
  status: "aberta" as const,
  posicoesDisponiveis: 3,
  notaCorte: "72.50",
  remuneracaoOferecida: "4500.00",
  cidadeIds: [VALID_CIDADE_ID],
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
    });
  });

  describe("remuneracaoOferecidaSchema", () => {
    it("accepts valid positive numbers and strings", () => {
      expect(remuneracaoOferecidaSchema.parse(5000)).toBe("5000.00");
      expect(remuneracaoOferecidaSchema.parse("4500,50")).toBe("4500.50");
    });

    it("returns null for empty or nullish values", () => {
      expect(remuneracaoOferecidaSchema.parse("")).toBeNull();
      expect(remuneracaoOferecidaSchema.parse(null)).toBeNull();
      expect(remuneracaoOferecidaSchema.parse(undefined)).toBeNull();
    });

    it("rejects negative values", () => {
      expect(remuneracaoOferecidaSchema.safeParse("-500").success).toBe(false);
    });
  });

  describe("notaCorteSchema", () => {
    it("accepts values between 0 and 100", () => {
      expect(notaCorteSchema.parse("65")).toBe("65.00");
      expect(notaCorteSchema.parse(0)).toBe("0.00");
      expect(notaCorteSchema.parse(100)).toBe("100.00");
    });

    it("rejects out-of-range values", () => {
      expect(notaCorteSchema.safeParse(-1).success).toBe(false);
      expect(notaCorteSchema.safeParse(101).success).toBe(false);
    });
  });

  describe("createVagaSchema", () => {
    it("validates valid vaga input with cidadeIds", () => {
      const result = createVagaSchema.safeParse(validVagaPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cargoId).toBe(VALID_CARGO_ID);
        expect(result.data.status).toBe("aberta");
        expect(result.data.posicoesDisponiveis).toBe(3);
        expect(result.data.notaCorte).toBe("72.50");
        expect(result.data.cidadeIds).toEqual([VALID_CIDADE_ID]);
      }
    });

    it("accepts multiple cidades", () => {
      const SECOND_CIDADE_ID = "770e8400-e29b-41d4-a716-446655440002";
      const result = createVagaSchema.safeParse({
        ...validVagaPayload,
        cidadeIds: [VALID_CIDADE_ID, SECOND_CIDADE_ID],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cidadeIds).toHaveLength(2);
      }
    });

    it("rejects empty cidadeIds array", () => {
      const result = createVagaSchema.safeParse({
        ...validVagaPayload,
        cidadeIds: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.cidadeIds).toBeDefined();
      }
    });

    it("rejects cidadeIds with non-UUID values", () => {
      const result = createVagaSchema.safeParse({
        ...validVagaPayload,
        cidadeIds: ["not-a-uuid"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing cidadeIds", () => {
      const { cidadeIds: _, ...withoutCidades } = validVagaPayload;
      const result = createVagaSchema.safeParse(withoutCidades);
      expect(result.success).toBe(false);
    });
  });

  describe("updateVagaSchema", () => {
    it("allows partial update without cidadeIds", () => {
      const result = updateVagaSchema.safeParse({ status: "concluida" });
      expect(result.success).toBe(true);
    });

    it("accepts cidadeIds in partial update", () => {
      const result = updateVagaSchema.safeParse({
        cidadeIds: [VALID_CIDADE_ID],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cidadeIds).toEqual([VALID_CIDADE_ID]);
      }
    });

    it("rejects empty object", () => {
      const result = updateVagaSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
