import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("next/server", () => ({
  after: vi.fn((fn: () => any) => {
    fn();
  }),
}));

const mockEnv = {
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
  STORAGE_ROOT: "./storage",
  NODE_ENV: "test",
  CLASSIFICADOR_N8N_WEBHOOK_URL: "http://localhost:5678/webhook/classificador",
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

import {
  createVaga,
  updateVaga,
  deleteVaga,
  triggerOutboundClassifier,
} from "./vagas";
import { vagaRepository } from "~/server/db/repositories/vaga";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { db } from "~/server/db";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

describe("vagas server actions", () => {
  const validCargoId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.CLASSIFICADOR_N8N_WEBHOOK_URL = "http://localhost:5678/webhook/classificador";
  });

  describe("createVaga", () => {
    it("creates a job opening successfully when input is valid and cargo is active", async () => {
      const mockCreated = {
        id: "vaga-1",
        cargoId: validCargoId,
        status: "aberta" as const,
        posicoesDisponiveis: 2,
        remuneracaoOferecida: "5000.00",
        cidade: "São Paulo",
        uf: "SP" as const,
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

      vi.spyOn(vagaRepository, "create").mockResolvedValueOnce(mockCreated as any);

      const result = await createVaga({
        cargoId: validCargoId,
        status: "aberta",
        posicoesDisponiveis: 2,
        remuneracaoOferecida: "5000.00",
        cidade: "São Paulo",
        uf: "SP",
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBe("vaga-1");
        expect(result.data.status).toBe("aberta");
      }
      expect(vagaRepository.create).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/vagas");
      expect(after).toHaveBeenCalled();
    });

    it("creates vaga without triggering classifier when status is not 'aberta'", async () => {
      const mockCreated = {
        id: "vaga-2",
        cargoId: validCargoId,
        status: "pausada" as const,
        posicoesDisponiveis: 1,
        remuneracaoOferecida: null,
        cidade: "Curitiba",
        uf: "PR" as const,
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

      vi.spyOn(vagaRepository, "create").mockResolvedValueOnce(mockCreated as any);

      const result = await createVaga({
        cargoId: validCargoId,
        status: "pausada",
        posicoesDisponiveis: 1,
        cidade: "Curitiba",
        uf: "PR",
      });

      expect(result.success).toBe(true);
      expect(after).not.toHaveBeenCalled();
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
        cidade: "São Paulo",
        uf: "SP",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Cargo selecionado não encontrado ou inativo.");
      expect(vagaRepository.create).not.toHaveBeenCalled();
    });

    it("returns error when cargo is not found", async () => {
      vi.spyOn(cargoRepository, "findById").mockResolvedValueOnce(null);

      const result = await createVaga({
        cargoId: validCargoId,
        status: "aberta",
        posicoesDisponiveis: 1,
        cidade: "São Paulo",
        uf: "SP",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Cargo selecionado não encontrado ou inativo.");
      expect(vagaRepository.create).not.toHaveBeenCalled();
    });

    it("returns validation error for invalid inputs", async () => {
      const result = await createVaga({
        cargoId: "not-a-uuid",
        cidade: "",
        uf: "INVALID",
        posicoesDisponiveis: 0,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Dados inválidos");
      if (!result.success) {
        expect(result.errors?.cargoId).toBeDefined();
        expect(result.errors?.cidade).toBeDefined();
        expect(result.errors?.uf).toBeDefined();
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
        remuneracaoOferecida: "6000.00",
        cidade: "São Paulo",
        uf: "SP" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.spyOn(vagaRepository, "update").mockResolvedValueOnce(mockUpdated as any);

      const result = await updateVaga("vaga-1", {
        status: "concluida",
        posicoesDisponiveis: 3,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.status).toBe("concluida");
        expect(result.data.posicoesDisponiveis).toBe(3);
      }
      expect(revalidatePath).toHaveBeenCalledWith("/vagas");
      expect(revalidatePath).toHaveBeenCalledWith("/vagas/vaga-1");
      expect(after).not.toHaveBeenCalled();
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
      expect(result.message).toBe("Cargo selecionado não encontrado ou inativo.");
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
        remuneracaoOferecida: null,
        cidade: "São Paulo",
        uf: "SP" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: new Date().toISOString(),
      };

      vi.spyOn(vagaRepository, "softDelete").mockResolvedValueOnce(mockDeleted as any);

      const result = await deleteVaga("vaga-1");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Vaga excluída com sucesso.");
      expect(vagaRepository.softDelete).toHaveBeenCalledWith("vaga-1");
      expect(revalidatePath).toHaveBeenCalledWith("/vagas");
      expect(after).not.toHaveBeenCalled();
    });

    it("returns error when vaga to delete is not found", async () => {
      vi.spyOn(vagaRepository, "softDelete").mockResolvedValueOnce(null);

      const result = await deleteVaga("vaga-999");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Vaga não encontrada");
    });
  });

  describe("triggerOutboundClassifier", () => {
    it("dispatches outbound POST to webhook URL with VagaCompleta and CandidatoCompleto list", async () => {
      const mockVagaCompleta = {
        id: "vaga-1",
        cargoId: validCargoId,
        status: "aberta",
        posicoesDisponiveis: 1,
        remuneracaoOferecida: "5000.00",
        cidade: "São Paulo",
        uf: "SP",
        cargo: {
          id: validCargoId,
          titulo: "Desenvolvedor Full Stack",
          departamento: {
            id: "dept-1",
            nome: "Engenharia",
          },
        },
      };

      const mockCandidatos = [
        {
          id: "cand-1",
          nomeCompleto: "João Silva",
          cidade: "São Paulo",
          uf: "SP",
          formacoes: [{ id: "form-1", curso: "Ciência da Computação" }],
          experiencias: [{ id: "exp-1", cargo: "Dev Júnior" }],
          certificacoes: [{ id: "cert-1", nome: "AWS Certified" }],
        },
      ];

      (db.query.vagas.findFirst as any).mockResolvedValueOnce(mockVagaCompleta);
      (db.query.candidatos.findMany as any).mockResolvedValueOnce(mockCandidatos);

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as any);

      await triggerOutboundClassifier({
        id: "vaga-1",
        cargoId: validCargoId,
        status: "aberta",
        posicoesDisponiveis: 1,
        remuneracaoOferecida: "5000.00",
        cidade: "São Paulo",
        uf: "SP",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        "http://localhost:5678/webhook/classificador",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vaga: mockVagaCompleta,
            candidatos: mockCandidatos,
          }),
        }),
      );
    });

    it("skips webhook request when no active candidates are found in same city", async () => {
      const mockVagaCompleta = {
        id: "vaga-1",
        cargoId: validCargoId,
        status: "aberta",
        cidade: "Cidade Sem Candidatos",
        uf: "SP",
        cargo: {
          id: validCargoId,
          titulo: "Desenvolvedor",
          departamento: { id: "dept-1", nome: "TI" },
        },
      };

      (db.query.vagas.findFirst as any).mockResolvedValueOnce(mockVagaCompleta);
      (db.query.candidatos.findMany as any).mockResolvedValueOnce([]);

      const fetchSpy = vi.spyOn(globalThis, "fetch");

      await triggerOutboundClassifier({
        id: "vaga-1",
        cargoId: validCargoId,
        status: "aberta",
        posicoesDisponiveis: 1,
        remuneracaoOferecida: null,
        cidade: "Cidade Sem Candidatos",
        uf: "SP",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("handles webhook failure gracefully without throwing (fire-and-forget)", async () => {
      const mockVagaCompleta = {
        id: "vaga-1",
        cargoId: validCargoId,
        status: "aberta",
        cidade: "São Paulo",
        uf: "SP",
        cargo: {
          id: validCargoId,
          titulo: "Desenvolvedor",
          departamento: { id: "dept-1", nome: "TI" },
        },
      };

      (db.query.vagas.findFirst as any).mockResolvedValueOnce(mockVagaCompleta);
      (db.query.candidatos.findMany as any).mockResolvedValueOnce([{ id: "cand-1" }]);

      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Connection refused"));

      // Should not throw
      await expect(
        triggerOutboundClassifier({
          id: "vaga-1",
          cargoId: validCargoId,
          status: "aberta",
          posicoesDisponiveis: 1,
          remuneracaoOferecida: null,
          cidade: "São Paulo",
          uf: "SP",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        }),
      ).resolves.toBeUndefined();
    });

    it("does nothing if CLASSIFICADOR_N8N_WEBHOOK_URL is not set", async () => {
      mockEnv.CLASSIFICADOR_N8N_WEBHOOK_URL = undefined as any;

      const fetchSpy = vi.spyOn(globalThis, "fetch");

      await triggerOutboundClassifier({
        id: "vaga-1",
        cargoId: validCargoId,
        status: "aberta",
        posicoesDisponiveis: 1,
        remuneracaoOferecida: null,
        cidade: "São Paulo",
        uf: "SP",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
