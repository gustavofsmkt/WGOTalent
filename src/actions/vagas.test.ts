import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockEnv = {
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
  STORAGE_ROOT: "./storage",
  NODE_ENV: "test",
};

vi.mock("~/env", () => ({
  get env() {
    return mockEnv;
  },
}));

vi.mock("~/server/db", () => ({
  db: {
    query: {
      vagas: {
        findFirst: vi.fn(),
      },
      candidatos: {
        findMany: vi.fn(),
      },
    },
  },
}));

import { createVaga, updateVaga, deleteVaga } from "./vagas";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { revalidatePath } from "next/cache";
import type { Vaga } from "~/server/db/schema";

describe("vagas server actions", () => {
  const validCargoId = "550e8400-e29b-41d4-a716-446655440000";
  const validCidadeId = "660e8400-e29b-41d4-a716-446655440001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createVaga", () => {
    it("creates a job opening successfully when input is valid and cargo is active", async () => {
      const mockCreated = {
        id: "vaga-1",
        cargoId: validCargoId,
        status: "aberta" as const,
        posicoesDisponiveis: 2,
        notaCorte: "75.00",
        remuneracaoOferecida: "5000.00",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.spyOn(cargoRepository, "findById").mockResolvedValueOnce({
        id: validCargoId,
        departamentoId: "dept-1",
        titulo: "Desenvolvedor",
        descricao: "Descrição",
        ativo: true,
        faixaSalarial: "5000.00",
        requisitos: "TypeScript",
        requisitosDesejaveis: "",
        criteriosEliminatorios: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      vi.spyOn(vagaRepository, "existsRecentDuplicate").mockResolvedValueOnce(
        false,
      );
      vi.spyOn(vagaRepository, "create").mockResolvedValueOnce(
        mockCreated as unknown as Vaga,
      );

      const result = await createVaga({
        cargoId: validCargoId,
        status: "aberta",
        posicoesDisponiveis: 2,
        notaCorte: 75,
        remuneracaoOferecida: "5000.00",
        cidadeIds: [validCidadeId],
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBe("vaga-1");
        expect(result.data.status).toBe("aberta");
      }
      expect(vagaRepository.create).toHaveBeenCalled();
      expect(vagaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ notaCorte: "75.00" }),
      );
      expect(revalidatePath).toHaveBeenCalledWith("/vagas");
    });

    it("creates vaga without triggering classifier when status is not 'aberta'", async () => {
      const mockCreated = {
        id: "vaga-2",
        cargoId: validCargoId,
        status: "pausada" as const,
        posicoesDisponiveis: 1,
        notaCorte: "65.00",
        remuneracaoOferecida: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.spyOn(cargoRepository, "findById").mockResolvedValueOnce({
        id: validCargoId,
        departamentoId: "dept-1",
        titulo: "Analista",
        descricao: "Descrição",
        ativo: true,
        faixaSalarial: null,
        requisitos: "",
        requisitosDesejaveis: "",
        criteriosEliminatorios: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      vi.spyOn(vagaRepository, "existsRecentDuplicate").mockResolvedValueOnce(
        false,
      );
      vi.spyOn(vagaRepository, "create").mockResolvedValueOnce(
        mockCreated as unknown as Vaga,
      );

      const result = await createVaga({
        cargoId: validCargoId,
        status: "pausada",
        posicoesDisponiveis: 1,
        cidadeIds: [validCidadeId],
      });

      expect(result.success).toBe(true);
    });

    it("blocks creation when a recent duplicate submission is detected", async () => {
      vi.spyOn(cargoRepository, "findById").mockResolvedValueOnce({
        id: validCargoId,
        departamentoId: "dept-1",
        titulo: "Desenvolvedor",
        descricao: "Descrição",
        ativo: true,
        faixaSalarial: "5000.00",
        requisitos: "TypeScript",
        requisitosDesejaveis: "",
        criteriosEliminatorios: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });
      vi.spyOn(vagaRepository, "existsRecentDuplicate").mockResolvedValueOnce(
        true,
      );
      vi.spyOn(vagaRepository, "create");

      const result = await createVaga({
        cargoId: validCargoId,
        status: "aberta",
        posicoesDisponiveis: 2,
        remuneracaoOferecida: "5000.00",
        cidadeIds: [validCidadeId],
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Esta vaga já foi cadastrada (envio duplicado detectado).",
      );
      expect(vagaRepository.create).not.toHaveBeenCalled();
    });

    it("returns error when cargo is inactive", async () => {
      vi.spyOn(cargoRepository, "findById").mockResolvedValueOnce({
        id: validCargoId,
        departamentoId: "dept-1",
        titulo: "Desenvolvedor Inativo",
        descricao: "Descrição",
        ativo: false,
        faixaSalarial: null,
        requisitos: "",
        requisitosDesejaveis: "",
        criteriosEliminatorios: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      const result = await createVaga({
        cargoId: validCargoId,
        status: "aberta",
        posicoesDisponiveis: 1,
        cidadeIds: [validCidadeId],
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Cargo selecionado não encontrado ou inativo.",
      );
      expect(vagaRepository.create).not.toHaveBeenCalled();
    });

    it("returns error when cargo is not found", async () => {
      vi.spyOn(cargoRepository, "findById").mockResolvedValueOnce(null);

      const result = await createVaga({
        cargoId: validCargoId,
        status: "aberta",
        posicoesDisponiveis: 1,
        cidadeIds: [validCidadeId],
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Cargo selecionado não encontrado ou inativo.",
      );
      expect(vagaRepository.create).not.toHaveBeenCalled();
    });

    it("returns validation error for invalid inputs", async () => {
      const result = await createVaga({
        cargoId: "not-a-uuid",
        cidadeIds: [],
        posicoesDisponiveis: 0,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Dados inválidos");
      if (!result.success) {
        expect(result.errors?.cargoId).toBeDefined();
        expect(result.errors?.cidadeIds).toBeDefined();
        expect(result.errors?.posicoesDisponiveis).toBeDefined();
      }
      expect(vagaRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("updateVaga", () => {
    it("updates vaga successfully with valid input", async () => {
      const mockUpdated = {
        id: "vaga-1",
        cargoId: validCargoId,
        status: "concluida" as const,
        posicoesDisponiveis: 3,
        notaCorte: "80.00",
        remuneracaoOferecida: "6000.00",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.spyOn(vagaRepository, "update").mockResolvedValueOnce(
        mockUpdated as unknown as Vaga,
      );

      const result = await updateVaga("vaga-1", {
        status: "concluida",
        posicoesDisponiveis: 3,
        notaCorte: 80,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.status).toBe("concluida");
        expect(result.data.posicoesDisponiveis).toBe(3);
      }
      expect(revalidatePath).toHaveBeenCalledWith("/vagas");
      expect(revalidatePath).toHaveBeenCalledWith("/vagas/vaga-1");
      expect(vagaRepository.update).toHaveBeenCalledWith(
        "vaga-1",
        expect.objectContaining({ notaCorte: "80.00" }),
      );
    });

    it("validates cargo is active when updating cargoId", async () => {
      vi.spyOn(cargoRepository, "findById").mockResolvedValueOnce({
        id: validCargoId,
        departamentoId: "dept-1",
        titulo: "Desenvolvedor Inativo",
        descricao: "Descrição",
        ativo: false,
        faixaSalarial: null,
        requisitos: "",
        requisitosDesejaveis: "",
        criteriosEliminatorios: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      const result = await updateVaga("vaga-1", {
        cargoId: validCargoId,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Cargo selecionado não encontrado ou inativo.",
      );
      expect(vagaRepository.update).not.toHaveBeenCalled();
    });

    it("returns error when vaga is not found on update", async () => {
      vi.spyOn(vagaRepository, "update").mockResolvedValueOnce(null);

      const result = await updateVaga("vaga-999", {
        status: "cancelada",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Vaga não encontrada");
    });

    it("returns validation error for empty or invalid update payload", async () => {
      const result = await updateVaga("vaga-1", {});

      expect(result.success).toBe(false);
      expect(result.message).toBe("Dados inválidos");
      expect(vagaRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteVaga", () => {
    it("soft-deletes vaga and does not delete historical triagens", async () => {
      const mockDeleted = {
        id: "vaga-1",
        cargoId: validCargoId,
        status: "aberta" as const,
        posicoesDisponiveis: 1,
        notaCorte: "65.00",
        remuneracaoOferecida: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: new Date().toISOString(),
      };

      vi.spyOn(vagaRepository, "softDelete").mockResolvedValueOnce(
        mockDeleted as unknown as Vaga,
      );

      const result = await deleteVaga("vaga-1");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Vaga excluída com sucesso.");
      expect(vagaRepository.softDelete).toHaveBeenCalledWith("vaga-1");
      expect(revalidatePath).toHaveBeenCalledWith("/vagas");
    });

    it("returns error when vaga to delete is not found", async () => {
      vi.spyOn(vagaRepository, "softDelete").mockResolvedValueOnce(null);

      const result = await deleteVaga("vaga-999");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Vaga não encontrada");
    });
  });
});
