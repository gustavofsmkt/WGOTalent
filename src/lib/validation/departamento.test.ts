import { describe, expect, it } from "vitest";
import {
  createDepartamentoSchema,
  updateDepartamentoSchema,
} from "~/lib/validation/departamento";

describe("departamento validation schemas", () => {
  describe("createDepartamentoSchema", () => {
    it("accepts valid department payload and trims values", () => {
      const payload = {
        nome: "  Tecnologia da Informação  ",
        descricao: "  Responsável pela infraestrutura e desenvolvimento  ",
      };

      const result = createDepartamentoSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          nome: "Tecnologia da Informação",
          descricao: "Responsável pela infraestrutura e desenvolvimento",
        });
      }
    });

    it("accepts nome with exactly 120 characters", () => {
      const payload = {
        nome: "A".repeat(120),
        descricao: "Descrição válida",
      };

      const result = createDepartamentoSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects payload missing nome", () => {
      const payload = {
        descricao: "Descrição do departamento",
      };

      const result = createDepartamentoSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe("Nome é obrigatório");
      }
    });

    it("rejects empty or whitespace-only nome", () => {
      const resultEmpty = createDepartamentoSchema.safeParse({
        nome: "",
        descricao: "Descrição válida",
      });
      expect(resultEmpty.success).toBe(false);
      if (!resultEmpty.success) {
        expect(resultEmpty.error.errors[0]?.message).toBe("Nome é obrigatório");
      }

      const resultWhitespace = createDepartamentoSchema.safeParse({
        nome: "   ",
        descricao: "Descrição válida",
      });
      expect(resultWhitespace.success).toBe(false);
      if (!resultWhitespace.success) {
        expect(resultWhitespace.error.errors[0]?.message).toBe("Nome é obrigatório");
      }
    });

    it("rejects nome exceeding 120 characters", () => {
      const payload = {
        nome: "A".repeat(121),
        descricao: "Descrição válida",
      };

      const result = createDepartamentoSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          "Nome deve ter no máximo 120 caracteres",
        );
      }
    });

    it("rejects payload missing descricao", () => {
      const payload = {
        nome: "Recursos Humanos",
      };

      const result = createDepartamentoSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe("Descrição é obrigatória");
      }
    });

    it("rejects empty or whitespace-only descricao", () => {
      const resultEmpty = createDepartamentoSchema.safeParse({
        nome: "Recursos Humanos",
        descricao: "",
      });
      expect(resultEmpty.success).toBe(false);
      if (!resultEmpty.success) {
        expect(resultEmpty.error.errors[0]?.message).toBe(
          "Descrição é obrigatória",
        );
      }

      const resultWhitespace = createDepartamentoSchema.safeParse({
        nome: "Recursos Humanos",
        descricao: "   ",
      });
      expect(resultWhitespace.success).toBe(false);
      if (!resultWhitespace.success) {
        expect(resultWhitespace.error.errors[0]?.message).toBe(
          "Descrição é obrigatória",
        );
      }
    });

    it("rejects payload containing id, timestamps or deletedAt", () => {
      const payloadWithId = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nome: "Financeiro",
        descricao: "Gestão financeira",
      };
      expect(createDepartamentoSchema.safeParse(payloadWithId).success).toBe(false);

      const payloadWithCreatedAt = {
        nome: "Financeiro",
        descricao: "Gestão financeira",
        createdAt: new Date().toISOString(),
      };
      expect(createDepartamentoSchema.safeParse(payloadWithCreatedAt).success).toBe(
        false,
      );

      const payloadWithUpdatedAt = {
        nome: "Financeiro",
        descricao: "Gestão financeira",
        updated_at: new Date().toISOString(),
      };
      expect(createDepartamentoSchema.safeParse(payloadWithUpdatedAt).success).toBe(
        false,
      );

      const payloadWithDeletedAt = {
        nome: "Financeiro",
        descricao: "Gestão financeira",
        deletedAt: null,
      };
      expect(createDepartamentoSchema.safeParse(payloadWithDeletedAt).success).toBe(
        false,
      );
    });
  });

  describe("updateDepartamentoSchema", () => {
    it("accepts full update payload", () => {
      const payload = {
        nome: "  Novo Nome  ",
        descricao: "  Nova Descrição  ",
      };

      const result = updateDepartamentoSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          nome: "Novo Nome",
          descricao: "Nova Descrição",
        });
      }
    });

    it("accepts partial update with only nome", () => {
      const payload = {
        nome: "Comercial",
      };

      const result = updateDepartamentoSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          nome: "Comercial",
        });
      }
    });

    it("accepts partial update with only descricao", () => {
      const payload = {
        descricao: "Nova descrição do setor",
      };

      const result = updateDepartamentoSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          descricao: "Nova descrição do setor",
        });
      }
    });

    it("rejects empty object update", () => {
      const result = updateDepartamentoSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          "Pelo menos um campo deve ser informado para atualização",
        );
      }
    });

    it("rejects invalid values in partial update", () => {
      expect(updateDepartamentoSchema.safeParse({ nome: "" }).success).toBe(false);
      expect(updateDepartamentoSchema.safeParse({ nome: "   " }).success).toBe(
        false,
      );
      expect(
        updateDepartamentoSchema.safeParse({ nome: "A".repeat(121) }).success,
      ).toBe(false);
      expect(updateDepartamentoSchema.safeParse({ descricao: "" }).success).toBe(
        false,
      );
      expect(
        updateDepartamentoSchema.safeParse({ descricao: "   " }).success,
      ).toBe(false);
    });

    it("rejects update containing id, timestamps or deletedAt", () => {
      const payloadWithId = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nome: "Operações",
      };
      expect(updateDepartamentoSchema.safeParse(payloadWithId).success).toBe(false);

      const payloadWithTimestamps = {
        nome: "Operações",
        deleted_at: null,
      };
      expect(
        updateDepartamentoSchema.safeParse(payloadWithTimestamps).success,
      ).toBe(false);
    });
  });
});
