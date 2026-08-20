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
vi.mock("~/lib/storage", () => ({
  storage: { save: vi.fn().mockResolvedValue(undefined), delete: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("~/server/agents/extracao-curriculo", () => ({
  executarExtracaoCurriculo: vi.fn(),
}));
vi.mock("~/server/agents/orquestracao", () => ({
  orquestrarParaCandidatoNovo: vi.fn().mockResolvedValue(undefined),
  orquestrarParaVagaNova: vi.fn().mockResolvedValue(undefined),
}));

import { createCandidato, updateCandidato, deleteCandidato, uploadCurriculosEmLote } from "./candidatos";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { revalidatePath } from "next/cache";
import { storage } from "~/lib/storage";
import { executarExtracaoCurriculo } from "~/server/agents/extracao-curriculo";

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

  describe("uploadCurriculosEmLote", () => {
    function fakeFile(name: string) {
      return new File(["conteudo"], name, { type: "application/pdf" });
    }

    function formDataWithFiles(files: File[]) {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      return fd;
    }

    const extraido = {
      nome: "Maria Silva",
      email: "maria@example.com",
      celular: "62999999999",
      cidade: "Goiânia",
      uf: "GO",
      dataNascimento: null,
      cep: null,
      bairro: null,
      logradouro: null,
      resumoProfissional: "resumo",
      nacionalidade: "brasileira",
      estadoCivil: "nao_informado",
      possuiVeiculo: false,
      ensinoMedioConcluido: false,
      disponivelViagens: false,
      disponivelMudanca: false,
      inicioImediato: false,
      origem: "manual",
      textoCurriculoExtraido: "texto",
      formacoes: [],
      experiencias: [],
      certificacoes: [],
    };

    it("rejects when no files are sent", async () => {
      const result = await uploadCurriculosEmLote(formDataWithFiles([]));
      expect(result.success).toBe(false);
    });

    it("rejects the whole batch when it exceeds the file limit", async () => {
      const files = Array.from({ length: 16 }, (_, i) => fakeFile(`cv${i}.pdf`));
      const result = await uploadCurriculosEmLote(formDataWithFiles(files));
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/15/);
      expect(executarExtracaoCurriculo).not.toHaveBeenCalled();
    });

    it("creates a candidato from a successfully extracted file", async () => {
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce(null);
      vi.spyOn(candidatoRepository, "createAggregate").mockResolvedValueOnce({ id: "cand-1" } as any);
      vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce(extraido as any);

      const result = await uploadCurriculosEmLote(formDataWithFiles([fakeFile("cv1.pdf")]));

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]).toMatchObject({ fileName: "cv1.pdf", success: true, candidatoId: "cand-1" });
      }
    });

    it("isolates a failing file without blocking the others in the same batch", async () => {
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce(null);
      vi.spyOn(candidatoRepository, "createAggregate").mockResolvedValueOnce({ id: "cand-2" } as any);
      vi.mocked(executarExtracaoCurriculo)
        .mockRejectedValueOnce(new Error("falha no provider"))
        .mockResolvedValueOnce({ ...extraido, email: "outra@example.com" } as any);

      const result = await uploadCurriculosEmLote(
        formDataWithFiles([fakeFile("ruim.pdf"), fakeFile("bom.pdf")]),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const ruim = result.data.find((r) => r.fileName === "ruim.pdf");
        const bom = result.data.find((r) => r.fileName === "bom.pdf");
        expect(ruim).toMatchObject({ success: false });
        expect(bom).toMatchObject({ success: true, candidatoId: "cand-2" });
      }
      expect(storage.delete).toHaveBeenCalled();
    });

    it("reports a duplicate email as a failure without creating a candidato", async () => {
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce({
        id: "existing",
      } as any);
      const createAggregateSpy = vi.spyOn(candidatoRepository, "createAggregate");
      vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce(extraido as any);

      const result = await uploadCurriculosEmLote(formDataWithFiles([fakeFile("cv1.pdf")]));

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]).toMatchObject({ success: false });
        expect(result.data[0]?.message).toMatch(/já cadastrado/);
      }
      expect(createAggregateSpy).not.toHaveBeenCalled();
    });
  });
});
