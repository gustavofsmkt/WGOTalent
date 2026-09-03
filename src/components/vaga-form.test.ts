import { describe, it, expect } from "vitest";
import {
  vagaSchema,
  notaCorteSchema,
  posicoesDisponiveisSchema,
  remuneracaoOferecidaSchema,
  statusVagaSchema,
  STATUS_VAGA_VALUES,
} from "~/lib/validation/vaga";

describe("VagaForm - Validation Integration", () => {
  const validCargoId = "11111111-1111-1111-1111-111111111111";
  const validCidadeId = "22222222-2222-2222-2222-222222222222";

  it("validates valid vaga input according to shared schema", () => {
    const input = {
      cargoId: validCargoId,
      status: "aberta" as const,
      posicoesDisponiveis: 2,
      notaCorte: "75",
      remuneracaoOferecida: "6500.00",
      cidadeIds: [validCidadeId],
    };

    const result = vagaSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cargoId).toBe(validCargoId);
      expect(result.data.status).toBe("aberta");
      expect(result.data.posicoesDisponiveis).toBe(2);
      expect(result.data.notaCorte).toBe("75.00");
      expect(result.data.remuneracaoOferecida).toBe("6500.00");
      expect(result.data.cidadeIds).toEqual([validCidadeId]);
    }
  });

  it("validates onBlur field schema for 'cargoId'", () => {
    const cargoIdSchema = vagaSchema.shape.cargoId;

    const validId = cargoIdSchema.safeParse(validCargoId);
    expect(validId.success).toBe(true);

    const emptyId = cargoIdSchema.safeParse("");
    expect(emptyId.success).toBe(false);

    const invalidUuid = cargoIdSchema.safeParse("not-a-valid-uuid");
    expect(invalidUuid.success).toBe(false);
  });

  it("validates onBlur field schema for 'status'", () => {
    for (const status of STATUS_VAGA_VALUES) {
      const validStatus = statusVagaSchema.safeParse(status);
      expect(validStatus.success).toBe(true);
    }

    const invalidStatus = statusVagaSchema.safeParse("em_analise");
    expect(invalidStatus.success).toBe(false);
  });

  it("validates onBlur field schema for 'posicoesDisponiveis'", () => {
    const validNumber = posicoesDisponiveisSchema.safeParse(3);
    expect(validNumber.success).toBe(true);
    if (validNumber.success) {
      expect(validNumber.data).toBe(3);
    }

    const validString = posicoesDisponiveisSchema.safeParse("5");
    expect(validString.success).toBe(true);
    if (validString.success) {
      expect(validString.data).toBe(5);
    }

    const zero = posicoesDisponiveisSchema.safeParse(0);
    expect(zero.success).toBe(false);

    const negative = posicoesDisponiveisSchema.safeParse(-1);
    expect(negative.success).toBe(false);

    const empty = posicoesDisponiveisSchema.safeParse("");
    expect(empty.success).toBe(false);

    const decimal = posicoesDisponiveisSchema.safeParse(1.5);
    expect(decimal.success).toBe(false);
  });

  it("validates onBlur field schema for 'remuneracaoOferecida'", () => {
    const validNumber = remuneracaoOferecidaSchema.safeParse(5000);
    expect(validNumber.success).toBe(true);
    if (validNumber.success) {
      expect(validNumber.data).toBe("5000.00");
    }

    const validStringWithComma =
      remuneracaoOferecidaSchema.safeParse("4500,50");
    expect(validStringWithComma.success).toBe(true);
    if (validStringWithComma.success) {
      expect(validStringWithComma.data).toBe("4500.50");
    }

    const empty = remuneracaoOferecidaSchema.safeParse("");
    expect(empty.success).toBe(true);
    if (empty.success) {
      expect(empty.data).toBeNull();
    }

    const negative = remuneracaoOferecidaSchema.safeParse("-500");
    expect(negative.success).toBe(false);
  });

  it("validates onBlur field schema for 'notaCorte'", () => {
    expect(notaCorteSchema.parse("65")).toBe("65.00");
    expect(notaCorteSchema.safeParse(-1).success).toBe(false);
    expect(notaCorteSchema.safeParse(101).success).toBe(false);
  });

  it("validates 'cidadeIds' requires at least one UUID", () => {
    const cidadeIdsSchema = vagaSchema.shape.cidadeIds;

    const valid = cidadeIdsSchema.safeParse([validCidadeId]);
    expect(valid.success).toBe(true);

    const empty = cidadeIdsSchema.safeParse([]);
    expect(empty.success).toBe(false);

    const nonUuid = cidadeIdsSchema.safeParse(["not-a-uuid"]);
    expect(nonUuid.success).toBe(false);
  });
});
