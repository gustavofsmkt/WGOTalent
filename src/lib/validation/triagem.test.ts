import { describe, it, expect } from "vitest";
import { triagemSchema } from "./triagem";

describe("triagemSchema", () => {
  const validBase = {
    vagaId: "123e4567-e89b-12d3-a456-426614174000",
    candidatoId: "123e4567-e89b-12d3-a456-426614174001",
    etapa: "curriculo",
    parecerRh: "Bom candidato",
  };

  it("should validate when resultado is em_andamento and motivo is null", () => {
    const result = triagemSchema.safeParse({
      ...validBase,
      resultado: "em_andamento",
      motivo: null,
    });
    expect(result.success).toBe(true);
  });

  it("should invalidate when resultado is em_andamento and motivo is provided", () => {
    const result = triagemSchema.safeParse({
      ...validBase,
      resultado: "em_andamento",
      motivo: "curriculo",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Motivo deve ser nulo para este resultado");
    }
  });

  it("should validate when resultado is reprovado and motivo is from reprovacao list", () => {
    const result = triagemSchema.safeParse({
      ...validBase,
      resultado: "reprovado",
      motivo: "fit_cultural",
    });
    expect(result.success).toBe(true);
  });

  it("should invalidate when resultado is reprovado and motivo is missing", () => {
    const result = triagemSchema.safeParse({
      ...validBase,
      resultado: "reprovado",
      motivo: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Motivo é obrigatório quando o candidato é reprovado");
    }
  });

  it("should invalidate when resultado is reprovado and motivo is from desistencia list", () => {
    const result = triagemSchema.safeParse({
      ...validBase,
      resultado: "reprovado",
      motivo: "motivos_pessoais",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Motivo de reprovação inválido");
    }
  });

  it("should validate when resultado is desistente and motivo is from desistencia list", () => {
    const result = triagemSchema.safeParse({
      ...validBase,
      resultado: "desistente",
      motivo: "aceitou_outra_proposta",
    });
    expect(result.success).toBe(true);
  });

  it("should invalidate when resultado is desistente and motivo is from reprovacao list", () => {
    const result = triagemSchema.safeParse({
      ...validBase,
      resultado: "desistente",
      motivo: "rh",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Motivo de desistência inválido");
    }
  });

  it("should invalidate when resultado is desistente and motivo is missing", () => {
    const result = triagemSchema.safeParse({
      ...validBase,
      resultado: "desistente",
      motivo: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Motivo é obrigatório quando o candidato é desistente");
    }
  });

  it("should validate when resultado is aprovado and motivo is null", () => {
    const result = triagemSchema.safeParse({
      ...validBase,
      resultado: "aprovado",
      motivo: null,
    });
    expect(result.success).toBe(true);
  });
  
  it("should validate when resultado is banco_talentos and motivo is null", () => {
    const result = triagemSchema.safeParse({
      ...validBase,
      resultado: "banco_talentos",
      motivo: null,
    });
    expect(result.success).toBe(true);
  });
});