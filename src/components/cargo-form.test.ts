import { describe, it, expect } from "vitest";
import {
  cargoSchema,
  createCargoSchema,
  updateCargoSchema,
  faixaSalarialSchema,
  type CreateCargoInput,
} from "~/lib/validation/cargo";

describe("CargoForm - Validation Integration", () => {
  const validDeptId = "11111111-1111-1111-1111-111111111111";

  it("validates valid cargo input according to shared schema", () => {
    const input = {
      departamentoId: validDeptId,
      titulo: "Desenvolvedor Full Stack Sênior",
      descricao: "Desenvolvimento e manutenção de aplicações web.",
      ativo: true,
      faixaSalarial: "9500.00",
      requisitos: "Experiência com TypeScript, React e Node.js.",
      requisitosDesejaveis: "Conhecimento em Docker e AWS.",
      criteriosEliminatorios:
        "Não residir no Brasil ou não ter disponibilidade.",
    };

    const result = cargoSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.titulo).toBe("Desenvolvedor Full Stack Sênior");
      expect(result.data.departamentoId).toBe(validDeptId);
      expect(result.data.ativo).toBe(true);
      expect(result.data.faixaSalarial).toBe("9500.00");
    }
  });

  it("validates onBlur field schema for 'titulo'", () => {
    const tituloSchema = cargoSchema.shape.titulo;

    const validTitulo = tituloSchema.safeParse("Analista de RH");
    expect(validTitulo.success).toBe(true);

    const emptyTitulo = tituloSchema.safeParse("");
    expect(emptyTitulo.success).toBe(false);

    const whitespaceTitulo = tituloSchema.safeParse("   ");
    expect(whitespaceTitulo.success).toBe(false);

    const longTitulo = tituloSchema.safeParse("a".repeat(151));
    expect(longTitulo.success).toBe(false);
  });

  it("validates onBlur field schema for 'departamentoId'", () => {
    const deptIdSchema = cargoSchema.shape.departamentoId;

    const validId = deptIdSchema.safeParse(validDeptId);
    expect(validId.success).toBe(true);

    const emptyId = deptIdSchema.safeParse("");
    expect(emptyId.success).toBe(false);

    const invalidUuid = deptIdSchema.safeParse("not-a-uuid");
    expect(invalidUuid.success).toBe(false);
  });

  it("validates onBlur field schema for 'faixaSalarial'", () => {
    const validFaixaNumber = faixaSalarialSchema.safeParse(5000);
    expect(validFaixaNumber.success).toBe(true);
    if (validFaixaNumber.success) {
      expect(validFaixaNumber.data).toBe("5000.00");
    }

    const validFaixaString = faixaSalarialSchema.safeParse("7.500,50");
    // Normalization should handle comma or dot
    const validFaixaComma = faixaSalarialSchema.safeParse("7500,50");
    expect(validFaixaComma.success).toBe(true);
    if (validFaixaComma.success) {
      expect(validFaixaComma.data).toBe("7500.50");
    }

    const emptyFaixa = faixaSalarialSchema.safeParse("");
    expect(emptyFaixa.success).toBe(true);
    if (emptyFaixa.success) {
      expect(emptyFaixa.data).toBeNull();
    }

    const negativeFaixa = faixaSalarialSchema.safeParse("-100");
    expect(negativeFaixa.success).toBe(false);

    const invalidFaixa = faixaSalarialSchema.safeParse("abc");
    expect(invalidFaixa.success).toBe(false);
  });

  it("validates onBlur field schema for 'descricao'", () => {
    const descSchema = cargoSchema.shape.descricao;

    const validDesc = descSchema.safeParse("Descrição do cargo");
    expect(validDesc.success).toBe(true);

    const emptyDesc = descSchema.safeParse("");
    expect(emptyDesc.success).toBe(false);

    const whitespaceDesc = descSchema.safeParse("   ");
    expect(whitespaceDesc.success).toBe(false);
  });

  it("validates onBlur field schema for 'requisitos'", () => {
    const reqSchema = cargoSchema.shape.requisitos;

    const validReq = reqSchema.safeParse("Ensino superior completo");
    expect(validReq.success).toBe(true);

    const emptyReq = reqSchema.safeParse("");
    expect(emptyReq.success).toBe(false);
  });

  it("validates onBlur field schema for 'requisitosDesejaveis'", () => {
    const reqDesSchema = cargoSchema.shape.requisitosDesejaveis;

    const validReqDes = reqDesSchema.safeParse("Inglês fluente");
    expect(validReqDes.success).toBe(true);

    const emptyReqDes = reqDesSchema.safeParse("");
    expect(emptyReqDes.success).toBe(false);
  });

  it("validates onBlur field schema for 'criteriosEliminatorios'", () => {
    const critElimSchema = cargoSchema.shape.criteriosEliminatorios;

    const validCrit = critElimSchema.safeParse("Não possuir CNH B");
    expect(validCrit.success).toBe(true);

    const emptyCrit = critElimSchema.safeParse("");
    expect(emptyCrit.success).toBe(false);
  });

  it("validates onBlur field schema for 'ativo'", () => {
    const ativoSchema = cargoSchema.shape.ativo;

    const validAtivo = ativoSchema.safeParse(true);
    expect(validAtivo.success).toBe(true);

    const validInativo = ativoSchema.safeParse(false);
    expect(validInativo.success).toBe(true);
  });

  it("ensures createCargoSchema and updateCargoSchema behave consistently", () => {
    expect(createCargoSchema).toBe(cargoSchema);

    const updatePartial = updateCargoSchema.safeParse({
      titulo: "Novo Título",
    });
    expect(updatePartial.success).toBe(true);
  });
});
