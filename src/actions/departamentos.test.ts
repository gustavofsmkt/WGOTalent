import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import {
  createDepartamento,
  updateDepartamento,
  deleteDepartamento,
} from "./departamentos";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { revalidatePath } from "next/cache";

describe("departamentos server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDepartamento", () => {
    it("creates a department successfully when input is valid", async () => {
      const mockCreated = {
        id: "dept-1",
        nome: "Financeiro",
        descricao: "Gestão contábil e financeira",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.spyOn(departamentoRepository, "create").mockResolvedValueOnce(
        mockCreated,
      );

      const result = await createDepartamento({
        nome: "Financeiro",
        descricao: "Gestão contábil e financeira",
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.nome).toBe("Financeiro");
        expect(result.data.id).toBe("dept-1");
      }
      expect(departamentoRepository.create).toHaveBeenCalledWith({
        nome: "Financeiro",
        descricao: "Gestão contábil e financeira",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/departamentos");
    });

    it("returns validation error when required fields are missing", async () => {
      const result = await createDepartamento({
        nome: "",
        descricao: "",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Dados inválidos");
      if (!result.success) {
        expect(result.errors?.nome).toBeDefined();
        expect(result.errors?.descricao).toBeDefined();
      }
      expect(departamentoRepository.create).not.toHaveBeenCalled();
    });

    it("handles unique constraint error when department name already exists", async () => {
      vi.spyOn(departamentoRepository, "create").mockRejectedValueOnce({
        code: "23505",
        message: "duplicate key value violates unique constraint",
      });

      const result = await createDepartamento({
        nome: "TI Existente",
        descricao: "Departamento duplicado",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Já existe um departamento com este nome.");
    });
  });

  describe("updateDepartamento", () => {
    it("updates department successfully with valid partial input", async () => {
      const mockUpdated = {
        id: "dept-1",
        nome: "TI e Inovação",
        descricao: "Gestão contábil e financeira",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.spyOn(departamentoRepository, "update").mockResolvedValueOnce(
        mockUpdated,
      );

      const result = await updateDepartamento("dept-1", {
        nome: "TI e Inovação",
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.nome).toBe("TI e Inovação");
      }
      expect(revalidatePath).toHaveBeenCalledWith("/departamentos");
      expect(revalidatePath).toHaveBeenCalledWith("/departamentos/dept-1");
    });

    it("returns error when department to update is not found", async () => {
      vi.spyOn(departamentoRepository, "update").mockResolvedValueOnce(null);

      const result = await updateDepartamento("dept-not-found", {
        nome: "Novo Nome",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Departamento não encontrado");
    });
  });

  describe("deleteDepartamento (Soft Delete with active cargos blocking)", () => {
    it("blocks delete when department has active cargos", async () => {
      vi.spyOn(departamentoRepository, "hasActiveCargos").mockResolvedValueOnce(
        true,
      );
      vi.spyOn(departamentoRepository, "softDelete");

      const result = await deleteDepartamento("dept-with-cargos");

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Não é possível excluir um departamento que possui cargos ativos.",
      );
      expect(departamentoRepository.hasActiveCargos).toHaveBeenCalledWith(
        "dept-with-cargos",
      );
      expect(departamentoRepository.softDelete).not.toHaveBeenCalled();
    });

    it("allows soft delete when department has no active cargos", async () => {
      vi.spyOn(departamentoRepository, "hasActiveCargos").mockResolvedValueOnce(
        false,
      );
      const mockDeleted = {
        id: "dept-empty",
        nome: "Vendas",
        descricao: "Departamento sem cargos",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: new Date().toISOString(),
      };
      vi.spyOn(departamentoRepository, "softDelete").mockResolvedValueOnce(
        mockDeleted,
      );

      const result = await deleteDepartamento("dept-empty");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Departamento excluído com sucesso.");
      expect(departamentoRepository.hasActiveCargos).toHaveBeenCalledWith(
        "dept-empty",
      );
      expect(departamentoRepository.softDelete).toHaveBeenCalledWith(
        "dept-empty",
      );
      expect(revalidatePath).toHaveBeenCalledWith("/departamentos");
    });

    it("returns not found error when softDelete returns null", async () => {
      vi.spyOn(departamentoRepository, "hasActiveCargos").mockResolvedValueOnce(
        false,
      );
      vi.spyOn(departamentoRepository, "softDelete").mockResolvedValueOnce(null);

      const result = await deleteDepartamento("dept-not-found");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Departamento não encontrado");
    });
  });
});
