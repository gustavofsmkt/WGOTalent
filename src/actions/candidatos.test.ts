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

import { createCandidato, updateCandidato, deleteCandidato } from "./candidatos";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { revalidatePath } from "next/cache";

describe("candidatos server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCandidato", () => {
    it("creates a candidate successfully when input is valid and email is unique", async () => {
      const mockCandidato = {
        id: "cand-1",
        nome: "João Silva",
        email: "joao.silva@example.com",
        celular: "11999999999",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01000-000",
        bairro: "Centro",
        logradouro: "Rua Direita",
        resumoProfissional: "Desenvolvedor Backend com 5 anos de experiência.",
        origem: "manual" as const,
        ensinoMedioConcluido: true,
        disponivelViagens: false,
        disponivelMudanca: false,
        inicioImediato: false,
        possuiVeiculo: false,
        nacionalidade: "brasileira",
        estadoCivil: "solteiro" as const,
        dataNascimento: "1990-01-01",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce(null);
      vi.spyOn(candidatoRepository, "createAggregate").mockResolvedValueOnce(mockCandidato as any);

      const result = await createCandidato({
        nome: "João Silva",
        email: "joao.silva@example.com",
        celular: "11999999999",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01000-000",
        bairro: "Centro",
        logradouro: "Rua Direita",
        resumoProfissional: "Desenvolvedor Backend com 5 anos de experiência.",
        origem: "manual",
        dataNascimento: "1990-01-01",
        estadoCivil: "solteiro",
        nacionalidade: "brasileira",
        formacoes: [],
        experiencias: [],
        certificacoes: [],
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBe("cand-1");
        expect(result.data.email).toBe("joao.silva@example.com");
      }
      expect(candidatoRepository.createAggregate).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/candidatos");
    });

    it("returns error when email is already registered", async () => {
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce({
        id: "cand-2",
        nome: "Maria Sousa",
        email: "joao.silva@example.com",
      } as any);

      const result = await createCandidato({
        nome: "João Silva",
        email: "joao.silva@example.com",
        celular: "11999999999",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01000-000",
        bairro: "Centro",
        logradouro: "Rua Direita",
        resumoProfissional: "Desenvolvedor",
        origem: "manual",
        dataNascimento: "1990-01-01",
        formacoes: [],
        experiencias: [],
        certificacoes: [],
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("O e-mail informado já está cadastrado no sistema.");
      expect(candidatoRepository.createAggregate).not.toHaveBeenCalled();
    });
  });

  describe("updateCandidato", () => {
    it("updates a candidate successfully", async () => {
      const mockCandidato = {
        id: "cand-1",
        nome: "João Silva",
        email: "joao.silva@example.com",
        celular: "11999999999",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01000-000",
        bairro: "Centro",
        logradouro: "Rua Direita",
        resumoProfissional: "Desenvolvedor Backend com 5 anos de experiência.",
        origem: "manual" as const,
        ensinoMedioConcluido: true,
        disponivelViagens: false,
        disponivelMudanca: false,
        inicioImediato: false,
        possuiVeiculo: false,
        nacionalidade: "brasileira",
        estadoCivil: "solteiro" as const,
        dataNascimento: "1990-01-01",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.spyOn(candidatoRepository, "findById").mockResolvedValueOnce(mockCandidato as any);
      vi.spyOn(candidatoRepository, "updateAggregate").mockResolvedValueOnce({ ...mockCandidato, nome: "João Pedro Silva" } as any);

      const result = await updateCandidato("cand-1", {
        nome: "João Pedro Silva",
        email: "joao.silva@example.com",
        celular: "11999999999",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01000-000",
        bairro: "Centro",
        logradouro: "Rua Direita",
        resumoProfissional: "Desenvolvedor Backend com 5 anos de experiência.",
        origem: "manual",
        dataNascimento: "1990-01-01",
        estadoCivil: "solteiro",
        nacionalidade: "brasileira",
        formacoes: [],
        experiencias: [],
        certificacoes: [],
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.nome).toBe("João Pedro Silva");
      }
      expect(candidatoRepository.updateAggregate).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/candidatos");
      expect(revalidatePath).toHaveBeenCalledWith("/candidatos/cand-1");
    });

    it("returns error when email is changed to an existing one", async () => {
      const mockCandidato = {
        id: "cand-1",
        nome: "João Silva",
        email: "joao.silva@example.com",
      };

      vi.spyOn(candidatoRepository, "findById").mockResolvedValueOnce(mockCandidato as any);
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce({
        id: "cand-2",
        nome: "Maria",
        email: "maria@example.com",
      } as any);

      const result = await updateCandidato("cand-1", {
        nome: "João Silva",
        email: "maria@example.com",
        celular: "11999999999",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01000-000",
        bairro: "Centro",
        logradouro: "Rua Direita",
        resumoProfissional: "Desenvolvedor",
        origem: "manual",
        dataNascimento: "1990-01-01",
        formacoes: [],
        experiencias: [],
        certificacoes: [],
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("O e-mail informado já está cadastrado no sistema.");
      expect(candidatoRepository.updateAggregate).not.toHaveBeenCalled();
    });
  });

  describe("deleteCandidato", () => {
    it("successfully soft deletes a candidate", async () => {
      const mockCandidato = {
        id: "cand-1",
        nome: "João Silva",
      };

      vi.spyOn(candidatoRepository, "findById").mockResolvedValueOnce(mockCandidato as any);
      vi.spyOn(candidatoRepository, "softDelete").mockResolvedValueOnce(undefined);

      const result = await deleteCandidato("cand-1");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Candidato excluído com sucesso.");
      expect(candidatoRepository.softDelete).toHaveBeenCalledWith("cand-1");
      expect(revalidatePath).toHaveBeenCalledWith("/candidatos");
    });

    it("returns error if candidate is not found", async () => {
      vi.spyOn(candidatoRepository, "findById").mockResolvedValueOnce(null);

      const result = await deleteCandidato("cand-1");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Candidato não encontrado.");
      expect(candidatoRepository.softDelete).not.toHaveBeenCalled();
    });

    it("handles error during soft delete", async () => {
      const mockCandidato = {
        id: "cand-1",
        nome: "João Silva",
      };

      vi.spyOn(candidatoRepository, "findById").mockResolvedValueOnce(mockCandidato as any);
      vi.spyOn(candidatoRepository, "softDelete").mockRejectedValueOnce(new Error("DB Error"));

      const result = await deleteCandidato("cand-1");

      expect(result.success).toBe(false);
      expect(result.message).toBe("DB Error");
    });
  });
});
