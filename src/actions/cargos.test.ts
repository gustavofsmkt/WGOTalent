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

import { createCargo, updateCargo, deleteCargo } from "./cargos";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { revalidatePath } from "next/cache";
import type { Cargo } from "~/server/db/schema";

describe("cargos server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCargo", () => {
    it("creates a role successfully when input is valid and department is active", async () => {
      const mockCreated = {
        id: "cargo-1",
        departamentoId: "dept-1",
        titulo: "Desenvolvedor Backend",
        descricao: "Desenvolvimento de APIs e integraÃ§Ãµes.",
        ativo: true,
        faixaSalarial: "8000.00",
        requisitos: "Node.js, PostgreSQL",
        requisitosDesejaveis: "Docker, AWS",
        criteriosEliminatorios: "InglÃªs nÃvel C1 ou superior",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.spyOn(departamentoRepository, "findById").mockResolvedValueOnce({
        id: "dept-1",
        nome: "TI",
        descricao: "Tecnologia",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      vi.spyOn(cargoRepository, "existsRecentDuplicate").mockResolvedValueOnce(
        false,
      );
      vi.spyOn(cargoRepository, "create").mockResolvedValueOnce(
        mockCreated as unknown as Cargo,
      );

      const result = await createCargo({
        departamentoId: "550e8400-e29b-41d4-a716-446655440000",
        titulo: "Desenvolvedor Backend",
        descricao: "Desenvolvimento de APIs e integraÃ§Ãµes.",
        requisitos: "Node.js, PostgreSQL",
        requisitosDesejaveis: "Docker, AWS",
        criteriosEliminatorios: "Inglês nível C1 ou superior",
        ativo: true,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.titulo).toBe("Desenvolvedor Backend");
        expect(result.data.id).toBe("cargo-1");
      }
      expect(cargoRepository.create).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/cargos");
    });

    it("blocks creation when a recent duplicate submission is detected", async () => {
      vi.spyOn(departamentoRepository, "findById").mockResolvedValueOnce({
        id: "dept-1",
        nome: "TI",
        descricao: "Tecnologia",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });
      vi.spyOn(cargoRepository, "existsRecentDuplicate").mockResolvedValueOnce(
        true,
      );
      vi.spyOn(cargoRepository, "create");

      const result = await createCargo({
        departamentoId: "550e8400-e29b-41d4-a716-446655440000",
        titulo: "Desenvolvedor Backend",
        descricao: "Desenvolvimento de APIs e integraÃ§Ãµes.",
        requisitos: "Node.js, PostgreSQL",
        requisitosDesejaveis: "Docker, AWS",
        criteriosEliminatorios: "Inglês nível C1 ou superior",
        ativo: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Este cargo já foi cadastrado (envio duplicado detectado).",
      );
      expect(cargoRepository.create).not.toHaveBeenCalled();
    });

    it("returns error when department is inactive or not found", async () => {
      vi.spyOn(departamentoRepository, "findById").mockResolvedValueOnce(null);

      const result = await createCargo({
        departamentoId: "550e8400-e29b-41d4-a716-446655440000",
        titulo: "Desenvolvedor Backend",
        descricao: "Desenvolvimento de APIs e integraÃ§Ãµes.",
        requisitos: "Node.js, PostgreSQL",
        requisitosDesejaveis: "Docker, AWS",
        criteriosEliminatorios: "Inglês nível C1 ou superior",
        ativo: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Departamento selecionado não encontrado ou inativo.",
      );
      expect(cargoRepository.create).not.toHaveBeenCalled();
    });

    it("returns validation error when required fields are missing", async () => {
      const result = await createCargo({
        titulo: "",
        descricao: "",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Dados inválidos");
      if (!result.success) {
        expect(result.errors?.titulo).toBeDefined();
        expect(result.errors?.departamentoId).toBeDefined();
      }
      expect(cargoRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("updateCargo", () => {
    it("updates role successfully with valid partial input", async () => {
      const mockUpdated = {
        id: "cargo-1",
        departamentoId: "550e8400-e29b-41d4-a716-446655440000",
        titulo: "Desenvolvedor Backend Sênior",
        descricao: "Desenvolvimento de APIs",
        ativo: true,
        faixaSalarial: "10000.00",
        requisitos: "Node.js",
        requisitosDesejaveis: "Docker",
        criteriosEliminatorios: "Inglês",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.spyOn(cargoRepository, "update").mockResolvedValueOnce(
        mockUpdated as unknown as Cargo,
      );

      const result = await updateCargo("cargo-1", {
        titulo: "Desenvolvedor Backend Sênior",
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.titulo).toBe("Desenvolvedor Backend Sênior");
      }
      expect(revalidatePath).toHaveBeenCalledWith("/cargos");
      expect(revalidatePath).toHaveBeenCalledWith("/cargos/cargo-1");
    });

    it("returns error when department provided for update is not found", async () => {
      vi.spyOn(departamentoRepository, "findById").mockResolvedValueOnce(null);

      const result = await updateCargo("cargo-1", {
        departamentoId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Departamento selecionado não encontrado ou inativo.",
      );
    });
  });

  describe("deleteCargo", () => {
    it("blocks delete when role has active vagas", async () => {
      vi.spyOn(cargoRepository, "hasActiveVagas").mockResolvedValueOnce(true);
      vi.spyOn(cargoRepository, "softDelete");

      const result = await deleteCargo("cargo-with-vagas");

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Não é possível excluir um cargo que possui vagas ativas.",
      );
      expect(cargoRepository.hasActiveVagas).toHaveBeenCalledWith(
        "cargo-with-vagas",
      );
      expect(cargoRepository.softDelete).not.toHaveBeenCalled();
    });

    it("allows soft delete when role has no active vagas", async () => {
      vi.spyOn(cargoRepository, "hasActiveVagas").mockResolvedValueOnce(false);
      const mockDeleted = {
        id: "cargo-empty",
        departamentoId: "dept-1",
        titulo: "Role",
        descricao: "Role",
        ativo: true,
        faixaSalarial: "1000",
        requisitos: "Req",
        requisitosDesejaveis: "Des",
        criteriosEliminatorios: "Crit",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: new Date().toISOString(),
      };
      vi.spyOn(cargoRepository, "softDelete").mockResolvedValueOnce(
        mockDeleted as unknown as Cargo,
      );

      const result = await deleteCargo("cargo-empty");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Cargo excluído com sucesso.");
      expect(cargoRepository.hasActiveVagas).toHaveBeenCalledWith(
        "cargo-empty",
      );
      expect(cargoRepository.softDelete).toHaveBeenCalledWith("cargo-empty");
      expect(revalidatePath).toHaveBeenCalledWith("/cargos");
    });
  });
});
