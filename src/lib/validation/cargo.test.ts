import { describe, expect, it } from "vitest";
import {
  cargoSchema,
  createCargoSchema,
  faixaSalarialSchema,
  updateCargoSchema,
} from "~/lib/validation/cargo";

const VALID_DEPARTAMENTO_ID = "550e8400-e29b-41d4-a716-446655440000";

const validCargoPayload = {
  departamentoId: VALID_DEPARTAMENTO_ID,
  titulo: "Desenvolvedor Full Stack",
  descricao: "Responsável pelo desenvolvimento de aplicações web",
  ativo: true,
  faixaSalarial: "12500.00",
  requisitos: "Experiência com TypeScript, React e Node.js",
  requisitosDesejaveis: "Conhecimento em Docker e CI/CD",
  criteriosEliminatorios: "Menos de 2 anos de experiência",
};

describe("cargo validation schemas", () => {
  describe("faixaSalarialSchema", () => {
    it("accepts null, undefined, and empty string converting them to null", () => {
      expect(faixaSalarialSchema.parse(null)).toBeNull();
      expect(faixaSalarialSchema.parse(undefined)).toBeNull();
      expect(faixaSalarialSchema.parse("")).toBeNull();
      expect(faixaSalarialSchema.parse("   ")).toBeNull();
    });

    it("accepts valid numbers and formats with 2 decimal places", () => {
      expect(faixaSalarialSchema.parse(14000)).toBe("14000.00");
      expect(faixaSalarialSchema.parse(14000.5)).toBe("14000.50");
      expect(faixaSalarialSchema.parse(0)).toBe("0.00");
      expect(faixaSalarialSchema.parse(99999999.99)).toBe("99999999.99");
    });

    it("accepts valid numeric strings including comma as decimal separator", () => {
      expect(faixaSalarialSchema.parse("14000")).toBe("14000.00");
      expect(faixaSalarialSchema.parse("  14000.50  ")).toBe("14000.50");
      expect(faixaSalarialSchema.parse("14000,75")).toBe("14000.75");
      expect(faixaSalarialSchema.parse("0")).toBe("0.00");
    });

    it("rejects negative numbers and negative numeric strings", () => {
      const resultNumber = faixaSalarialSchema.safeParse(-500);
      expect(resultNumber.success).toBe(false);
      if (!resultNumber.success) {
        expect(resultNumber.error.errors[0]?.message).toBe(
          "Faixa salarial não pode ser negativa",
        );
      }

      const resultString = faixaSalarialSchema.safeParse("-500.00");
      expect(resultString.success).toBe(false);
      if (!resultString.success) {
        expect(resultString.error.errors[0]?.message).toBe(
          "Faixa salarial não pode ser negativa",
        );
      }
    });

    it("rejects non-numeric strings", () => {
      const result = faixaSalarialSchema.safeParse("invalido");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          "Faixa salarial deve ser um número válido",
        );
      }
    });

    it("rejects values exceeding 99999999.99", () => {
      const resultNumber = faixaSalarialSchema.safeParse(100000000);
      expect(resultNumber.success).toBe(false);
      if (!resultNumber.success) {
        expect(resultNumber.error.errors[0]?.message).toBe(
          "Faixa salarial excede o limite máximo permitido",
        );
      }

      const resultString = faixaSalarialSchema.safeParse("100000000.00");
      expect(resultString.success).toBe(false);
      if (!resultString.success) {
        expect(resultString.error.errors[0]?.message).toBe(
          "Faixa salarial excede o limite máximo permitido",
        );
      }
    });
  });

  describe("createCargoSchema", () => {
    it("accepts valid full payload and trims string fields", () => {
      const payload = {
        departamentoId: `  ${VALID_DEPARTAMENTO_ID}  `,
        titulo: "  Desenvolvedor Full Stack Sênior  ",
        descricao: "  Atuação no desenvolvimento de software  ",
        ativo: true,
        faixaSalarial: "  14000.00  ",
        requisitos: "  TypeScript, React, Node.js  ",
        requisitosDesejaveis: "  Docker, CI/CD  ",
        criteriosEliminatorios: "  Menos de 3 anos de experiência  ",
      };

      const result = createCargoSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          departamentoId: VALID_DEPARTAMENTO_ID,
          titulo: "Desenvolvedor Full Stack Sênior",
          descricao: "Atuação no desenvolvimento de software",
          ativo: true,
          faixaSalarial: "14000.00",
          requisitos: "TypeScript, React, Node.js",
          requisitosDesejaveis: "Docker, CI/CD",
          criteriosEliminatorios: "Menos de 3 anos de experiência",
        });
      }
    });

    it("defaults ativo to true when omitted", () => {
      const { ativo: _, ...payloadWithoutAtivo } = validCargoPayload;
      const result = createCargoSchema.safeParse(payloadWithoutAtivo);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ativo).toBe(true);
      }
    });

    it("accepts ativo as false", () => {
      const payload = { ...validCargoPayload, ativo: false };
      const result = createCargoSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ativo).toBe(false);
      }
    });

    it("accepts payload without faixaSalarial", () => {
      const { faixaSalarial: _, ...payloadWithoutFaixa } = validCargoPayload;
      const result = createCargoSchema.safeParse(payloadWithoutFaixa);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.faixaSalarial).toBeUndefined();
      }
    });

    it("accepts null faixaSalarial", () => {
      const payload = { ...validCargoPayload, faixaSalarial: null };
      const result = createCargoSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.faixaSalarial).toBeNull();
      }
    });

    it("accepts titulo with exactly 150 characters", () => {
      const payload = {
        ...validCargoPayload,
        titulo: "A".repeat(150),
      };

      const result = createCargoSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects titulo exceeding 150 characters", () => {
      const payload = {
        ...validCargoPayload,
        titulo: "A".repeat(151),
      };

      const result = createCargoSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          "Título deve ter no máximo 150 caracteres",
        );
      }
    });

    it("rejects missing or empty departamentoId", () => {
      const { departamentoId: _, ...missingDep } = validCargoPayload;
      const resultMissing = createCargoSchema.safeParse(missingDep);
      expect(resultMissing.success).toBe(false);
      if (!resultMissing.success) {
        expect(resultMissing.error.errors[0]?.message).toBe(
          "Departamento é obrigatório",
        );
      }

      const resultEmpty = createCargoSchema.safeParse({
        ...validCargoPayload,
        departamentoId: "",
      });
      expect(resultEmpty.success).toBe(false);
      if (!resultEmpty.success) {
        expect(resultEmpty.error.errors[0]?.message).toBe(
          "Departamento é obrigatório",
        );
      }
    });

    it("rejects invalid departamentoId UUID", () => {
      const result = createCargoSchema.safeParse({
        ...validCargoPayload,
        departamentoId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          "ID do departamento inválido",
        );
      }
    });

    it("rejects missing, empty or whitespace-only titulo", () => {
      const { titulo: _, ...missingTitulo } = validCargoPayload;
      const resultMissing = createCargoSchema.safeParse(missingTitulo);
      expect(resultMissing.success).toBe(false);
      if (!resultMissing.success) {
        expect(resultMissing.error.errors[0]?.message).toBe(
          "Título é obrigatório",
        );
      }

      const resultWhitespace = createCargoSchema.safeParse({
        ...validCargoPayload,
        titulo: "   ",
      });
      expect(resultWhitespace.success).toBe(false);
      if (!resultWhitespace.success) {
        expect(resultWhitespace.error.errors[0]?.message).toBe(
          "Título é obrigatório",
        );
      }
    });

    it("rejects missing, empty or whitespace-only descricao", () => {
      const { descricao: _, ...missingDesc } = validCargoPayload;
      const resultMissing = createCargoSchema.safeParse(missingDesc);
      expect(resultMissing.success).toBe(false);
      if (!resultMissing.success) {
        expect(resultMissing.error.errors[0]?.message).toBe(
          "Descrição é obrigatória",
        );
      }

      const resultWhitespace = createCargoSchema.safeParse({
        ...validCargoPayload,
        descricao: "   ",
      });
      expect(resultWhitespace.success).toBe(false);
      if (!resultWhitespace.success) {
        expect(resultWhitespace.error.errors[0]?.message).toBe(
          "Descrição é obrigatória",
        );
      }
    });

    it("rejects missing, empty or whitespace-only requisitos", () => {
      const { requisitos: _, ...missingReq } = validCargoPayload;
      const resultMissing = createCargoSchema.safeParse(missingReq);
      expect(resultMissing.success).toBe(false);
      if (!resultMissing.success) {
        expect(resultMissing.error.errors[0]?.message).toBe(
          "Requisitos são obrigatórios",
        );
      }

      const resultWhitespace = createCargoSchema.safeParse({
        ...validCargoPayload,
        requisitos: "   ",
      });
      expect(resultWhitespace.success).toBe(false);
      if (!resultWhitespace.success) {
        expect(resultWhitespace.error.errors[0]?.message).toBe(
          "Requisitos são obrigatórios",
        );
      }
    });

    it("rejects missing, empty or whitespace-only requisitosDesejaveis", () => {
      const { requisitosDesejaveis: _, ...missingReqDes } = validCargoPayload;
      const resultMissing = createCargoSchema.safeParse(missingReqDes);
      expect(resultMissing.success).toBe(false);
      if (!resultMissing.success) {
        expect(resultMissing.error.errors[0]?.message).toBe(
          "Requisitos desejáveis são obrigatórios",
        );
      }

      const resultWhitespace = createCargoSchema.safeParse({
        ...validCargoPayload,
        requisitosDesejaveis: "   ",
      });
      expect(resultWhitespace.success).toBe(false);
      if (!resultWhitespace.success) {
        expect(resultWhitespace.error.errors[0]?.message).toBe(
          "Requisitos desejáveis são obrigatórios",
        );
      }
    });

    it("rejects missing, empty or whitespace-only criteriosEliminatorios", () => {
      const { criteriosEliminatorios: _, ...missingCrit } = validCargoPayload;
      const resultMissing = createCargoSchema.safeParse(missingCrit);
      expect(resultMissing.success).toBe(false);
      if (!resultMissing.success) {
        expect(resultMissing.error.errors[0]?.message).toBe(
          "Critérios eliminatórios são obrigatórios",
        );
      }

      const resultWhitespace = createCargoSchema.safeParse({
        ...validCargoPayload,
        criteriosEliminatorios: "   ",
      });
      expect(resultWhitespace.success).toBe(false);
      if (!resultWhitespace.success) {
        expect(resultWhitespace.error.errors[0]?.message).toBe(
          "Critérios eliminatórios são obrigatórios",
        );
      }
    });

    it("rejects unexpected fields (strict schema)", () => {
      const payloadWithExtra = {
        ...validCargoPayload,
        id: "550e8400-e29b-41d4-a716-446655440001",
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };

      const result = createCargoSchema.safeParse(payloadWithExtra);
      expect(result.success).toBe(false);
    });
  });

  describe("updateCargoSchema", () => {
    it("accepts partial update with a single field", () => {
      const result = updateCargoSchema.safeParse({
        titulo: "Novo Título de Cargo",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          titulo: "Novo Título de Cargo",
        });
      }
    });

    it("accepts partial update with multiple fields", () => {
      const result = updateCargoSchema.safeParse({
        ativo: false,
        faixaSalarial: 15000,
        criteriosEliminatorios: "Novos critérios eliminatórios",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          ativo: false,
          faixaSalarial: "15000.00",
          criteriosEliminatorios: "Novos critérios eliminatórios",
        });
      }
    });

    it("accepts setting faixaSalarial to null", () => {
      const result = updateCargoSchema.safeParse({
        faixaSalarial: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.faixaSalarial).toBeNull();
      }
    });

    it("rejects empty object update", () => {
      const result = updateCargoSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          "Pelo menos um campo deve ser informado para atualização",
        );
      }
    });

    it("rejects unexpected fields in update", () => {
      const result = updateCargoSchema.safeParse({
        titulo: "Título Válido",
        id: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(false);
    });

    it("validates fields provided in partial update", () => {
      const resultInvalidUuid = updateCargoSchema.safeParse({
        departamentoId: "invalid-uuid",
      });
      expect(resultInvalidUuid.success).toBe(false);

      const resultInvalidTitulo = updateCargoSchema.safeParse({
        titulo: "A".repeat(151),
      });
      expect(resultInvalidTitulo.success).toBe(false);

      const resultInvalidFaixa = updateCargoSchema.safeParse({
        faixaSalarial: -100,
      });
      expect(resultInvalidFaixa.success).toBe(false);
    });
  });
});
