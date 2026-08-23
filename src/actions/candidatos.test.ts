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

import {
  createCandidato,
  updateCandidato,
  deleteCandidato,
  processarItemLote,
  iniciarUploadLote,
  getUploadLoteAtivo,
  limparUploadLoteFinalizados,
} from "./candidatos";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";
import { triagemRepository } from "~/server/db/repositories/triagem";
import { uploadLoteItemRepository } from "~/server/db/repositories/upload-lote-item";
import { revalidatePath } from "next/cache";
import { storage } from "~/lib/storage";
import { executarExtracaoCurriculo } from "~/server/agents/extracao-curriculo";
import { AgenteQuotaExcedidaError } from "~/lib/agents/gemini-client";
import type { Candidato, UploadLoteItem } from "~/server/db/schema";
import type { CandidatoDetailCompleto } from "~/server/db/repositories/candidato";
import type { ExtracaoCurriculoOutput } from "~/lib/validation/extracao-curriculo";

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
      vi.spyOn(candidatoRepository, "findByCelularIncludingDeleted").mockResolvedValueOnce(null);
      vi.spyOn(candidatoRepository, "createAggregate").mockResolvedValueOnce(mockCandidato as unknown as CandidatoDetailCompleto);

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

    it("merges data into the existing candidato when the email matches an active one without new info", async () => {
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce({
        id: "cand-2",
        nome: "Maria Sousa",
        email: "joao.silva@example.com",
        deletedAt: null,
      } as unknown as Candidato);
      const mergeAggregateSpy = vi
        .spyOn(candidatoRepository, "mergeAggregate")
        .mockResolvedValueOnce({ candidato: { id: "cand-2" } as unknown as CandidatoDetailCompleto, houveMudanca: false });
      const findEmCurriculoSpy = vi.spyOn(triagemRepository, "findEmCurriculoPorCandidato");

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

      expect(result.success).toBe(true);
      expect(result.message).toBe("Candidato já cadastrado — informações atualizadas.");
      expect(mergeAggregateSpy).toHaveBeenCalledWith("cand-2", expect.anything());
      expect(candidatoRepository.createAggregate).not.toHaveBeenCalled();
      expect(findEmCurriculoSpy).not.toHaveBeenCalled();
    });

    it("resets triagens still in the Currículo stage when the merge brings new info", async () => {
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce({
        id: "cand-2",
        nome: "Maria Sousa",
        email: "joao.silva@example.com",
        deletedAt: null,
      } as unknown as Candidato);
      vi.spyOn(candidatoRepository, "mergeAggregate").mockResolvedValueOnce({
        candidato: { id: "cand-2" } as unknown as CandidatoDetailCompleto,
        houveMudanca: true,
      });
      vi.spyOn(triagemRepository, "findEmCurriculoPorCandidato").mockResolvedValueOnce(["triagem-1"]);
      const softDeleteSpy = vi.spyOn(triagemRepository, "softDelete").mockResolvedValueOnce(undefined);

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

      expect(result.success).toBe(true);
      expect(softDeleteSpy).toHaveBeenCalledWith("triagem-1");
    });

    it("restores the candidato when the email matches a soft-deleted one", async () => {
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce({
        id: "cand-3",
        nome: "Maria Sousa",
        email: "joao.silva@example.com",
        deletedAt: new Date().toISOString(),
      } as unknown as Candidato);
      const restoreAggregateSpy = vi
        .spyOn(candidatoRepository, "restoreAggregate")
        .mockResolvedValueOnce({ id: "cand-3" } as unknown as CandidatoDetailCompleto);

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

      expect(result.success).toBe(true);
      expect(result.message).toBe("Candidato restaurado com sucesso.");
      expect(restoreAggregateSpy).toHaveBeenCalledWith("cand-3", expect.anything());
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

      vi.spyOn(candidatoRepository, "findById").mockResolvedValueOnce(mockCandidato as unknown as Candidato);
      vi.spyOn(candidatoRepository, "updateAggregate").mockResolvedValueOnce({ ...mockCandidato, nome: "João Pedro Silva" } as unknown as CandidatoDetailCompleto);

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

      vi.spyOn(candidatoRepository, "findById").mockResolvedValueOnce(mockCandidato as unknown as Candidato);
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce({
        id: "cand-2",
        nome: "Maria",
        email: "maria@example.com",
      } as unknown as Candidato);

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

      vi.spyOn(candidatoRepository, "findById").mockResolvedValueOnce(mockCandidato as unknown as Candidato);
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

      vi.spyOn(candidatoRepository, "findById").mockResolvedValueOnce(mockCandidato as unknown as Candidato);
      vi.spyOn(candidatoRepository, "softDelete").mockRejectedValueOnce(new Error("DB Error"));

      const result = await deleteCandidato("cand-1");

      expect(result.success).toBe(false);
      expect(result.message).toBe("DB Error");
    });
  });

  describe("processarItemLote", () => {
    function fakeFile(name: string, type = "application/pdf") {
      return new File(["conteudo"], name, { type });
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

    it("marks the item as 'processando' before starting, then 'erro' when the upload fails", async () => {
      const updateStatusSpy = vi
        .spyOn(uploadLoteItemRepository, "updateStatus")
        .mockResolvedValue(null);
      const oversizedFile = new File([new Uint8Array(6 * 1024 * 1024)], "huge.pdf", {
        type: "application/pdf",
      });

      await processarItemLote("item-1", oversizedFile);

      expect(updateStatusSpy).toHaveBeenNthCalledWith(1, "item-1", { status: "processando" });
      expect(updateStatusSpy).toHaveBeenNthCalledWith(2, "item-1", {
        status: "erro",
        mensagem: expect.stringMatching(/5MB/i),
      });
    });

    it("marks the item as 'erro' when the file type is not supported", async () => {
      const updateStatusSpy = vi
        .spyOn(uploadLoteItemRepository, "updateStatus")
        .mockResolvedValue(null);
      const invalidFile = new File(["conteudo"], "cv.txt", { type: "text/plain" });

      await processarItemLote("item-1", invalidFile);

      expect(updateStatusSpy).toHaveBeenLastCalledWith("item-1", {
        status: "erro",
        mensagem: expect.stringMatching(/não suportado/i),
      });
    });

    it("marks the item as 'sucesso' with the candidatoId from a successfully extracted file", async () => {
      const updateStatusSpy = vi
        .spyOn(uploadLoteItemRepository, "updateStatus")
        .mockResolvedValue(null);
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce(null);
      vi.spyOn(candidatoRepository, "findByCelularIncludingDeleted").mockResolvedValueOnce(null);
      vi.spyOn(candidatoRepository, "createAggregate").mockResolvedValueOnce({ id: "cand-1" } as unknown as CandidatoDetailCompleto);
      vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce(extraido as unknown as ExtracaoCurriculoOutput);

      await processarItemLote("item-1", fakeFile("cv1.pdf"));

      expect(updateStatusSpy).toHaveBeenLastCalledWith("item-1", {
        status: "sucesso",
        mensagem: expect.any(String),
        candidatoId: "cand-1",
      });
      // revalidatePath NÃO pode ser chamado aqui: este processamento roda
      // fire-and-forget, fora do escopo síncrono da Server Action que o
      // disparou, e o Next.js rejeita revalidatePath nesse contexto — o que
      // já derrubou uploads reais em produção local (candidato criado, mas
      // o item ficava marcado como 'erro' e o arquivo era apagado do storage
      // pelo catch). /candidatos já é `force-dynamic`, então não precisa.
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("marks the item as 'erro' and deletes the uploaded file from storage when extraction fails", async () => {
      const updateStatusSpy = vi
        .spyOn(uploadLoteItemRepository, "updateStatus")
        .mockResolvedValue(null);
      vi.mocked(executarExtracaoCurriculo).mockRejectedValueOnce(new Error("falha no provider"));

      await processarItemLote("item-1", fakeFile("ruim.pdf"));

      expect(updateStatusSpy).toHaveBeenLastCalledWith("item-1", {
        status: "erro",
        mensagem: "falha no provider",
        errorType: null,
      });
      expect(storage.delete).toHaveBeenCalled();
    });

    it("tags the failure with errorType 'quota' when the provider quota is exhausted", async () => {
      const updateStatusSpy = vi
        .spyOn(uploadLoteItemRepository, "updateStatus")
        .mockResolvedValue(null);
      vi.mocked(executarExtracaoCurriculo).mockRejectedValueOnce(
        new AgenteQuotaExcedidaError(new Error("429")),
      );

      await processarItemLote("item-1", fakeFile("cv1.pdf"));

      expect(updateStatusSpy).toHaveBeenLastCalledWith(
        "item-1",
        expect.objectContaining({ status: "erro", errorType: "quota" }),
      );
    });

    it("merges into the existing active candidato instead of creating a duplicate", async () => {
      const updateStatusSpy = vi
        .spyOn(uploadLoteItemRepository, "updateStatus")
        .mockResolvedValue(null);
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce({
        id: "existing",
        deletedAt: null,
      } as unknown as Candidato);
      const createAggregateSpy = vi.spyOn(candidatoRepository, "createAggregate");
      const mergeAggregateSpy = vi
        .spyOn(candidatoRepository, "mergeAggregate")
        .mockResolvedValueOnce({ candidato: { id: "existing" } as unknown as CandidatoDetailCompleto, houveMudanca: false });
      vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce(extraido as unknown as ExtracaoCurriculoOutput);

      await processarItemLote("item-1", fakeFile("cv1.pdf"));

      expect(updateStatusSpy).toHaveBeenLastCalledWith(
        "item-1",
        expect.objectContaining({ status: "sucesso", candidatoId: "existing" }),
      );
      expect(mergeAggregateSpy).toHaveBeenCalledWith("existing", expect.anything());
      expect(createAggregateSpy).not.toHaveBeenCalled();
    });

    it("restores a soft-deleted candidato instead of creating a duplicate", async () => {
      const updateStatusSpy = vi
        .spyOn(uploadLoteItemRepository, "updateStatus")
        .mockResolvedValue(null);
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce({
        id: "existing-deleted",
        deletedAt: new Date().toISOString(),
      } as unknown as Candidato);
      const createAggregateSpy = vi.spyOn(candidatoRepository, "createAggregate");
      const restoreAggregateSpy = vi
        .spyOn(candidatoRepository, "restoreAggregate")
        .mockResolvedValueOnce({ id: "existing-deleted" } as unknown as CandidatoDetailCompleto);
      vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce(extraido as unknown as ExtracaoCurriculoOutput);

      await processarItemLote("item-1", fakeFile("cv1.pdf"));

      expect(updateStatusSpy).toHaveBeenLastCalledWith(
        "item-1",
        expect.objectContaining({ status: "sucesso", candidatoId: "existing-deleted" }),
      );
      expect(restoreAggregateSpy).toHaveBeenCalledWith("existing-deleted", expect.anything());
      expect(createAggregateSpy).not.toHaveBeenCalled();
    });

    it("creates the candidate with null email when only celular is present", async () => {
      const updateStatusSpy = vi
        .spyOn(uploadLoteItemRepository, "updateStatus")
        .mockResolvedValue(null);
      vi.spyOn(candidatoRepository, "findByCelularIncludingDeleted").mockResolvedValueOnce(null);
      const createAggregateSpy = vi
        .spyOn(candidatoRepository, "createAggregate")
        .mockResolvedValueOnce({ id: "cand-sem-email" } as unknown as CandidatoDetailCompleto);
      vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce({
        ...extraido,
        email: null,
      } as unknown as ExtracaoCurriculoOutput);

      await processarItemLote("item-1", fakeFile("cv1.pdf"));

      const dadosCandidato = createAggregateSpy.mock.calls[0]?.[0];
      expect(dadosCandidato?.email).toBeNull();
      expect(dadosCandidato?.dadosPendentes).toContain("E-mail");
      expect(updateStatusSpy).toHaveBeenLastCalledWith(
        "item-1",
        expect.objectContaining({ status: "sucesso", candidatoId: "cand-sem-email" }),
      );
    });

    it("marks the item as 'erro' when the curriculum has neither email nor celular", async () => {
      const updateStatusSpy = vi
        .spyOn(uploadLoteItemRepository, "updateStatus")
        .mockResolvedValue(null);
      vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce({
        ...extraido,
        email: null,
        celular: null,
      } as unknown as ExtracaoCurriculoOutput);

      await processarItemLote("item-1", fakeFile("cv-sem-contato.pdf"));

      expect(updateStatusSpy).toHaveBeenLastCalledWith("item-1", {
        status: "erro",
        mensagem: expect.stringMatching(/sem e-mail e sem celular/i),
      });
      expect(candidatoRepository.createAggregate).not.toHaveBeenCalled();
    });

    it("normalizes an omitted (undefined) nullish field to null before hitting the repository", async () => {
      vi.spyOn(uploadLoteItemRepository, "updateStatus").mockResolvedValue(null);
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce(null);
      vi.spyOn(candidatoRepository, "findByCelularIncludingDeleted").mockResolvedValueOnce(null);
      const createAggregateSpy = vi
        .spyOn(candidatoRepository, "createAggregate")
        .mockResolvedValueOnce({ id: "cand-sem-nascimento" } as unknown as CandidatoDetailCompleto);
      // Reprodução do caso real: o agente omite a chave em vez de mandar null.
      const { dataNascimento: _dn, ...extraidoSemNascimento } = extraido;
      vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce(extraidoSemNascimento as unknown as ExtracaoCurriculoOutput);

      await processarItemLote("item-1", fakeFile("cv1.pdf"));

      const dadosCandidato = createAggregateSpy.mock.calls[0]?.[0];
      expect(dadosCandidato?.dataNascimento).toBeNull();
    });
  });

  describe("iniciarUploadLote", () => {
    function fakeFile(name: string, type = "application/pdf") {
      return new File(["conteudo"], name, { type });
    }

    function formDataWithFiles(files: File[]) {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      return fd;
    }

    it("rejects when no file is sent", async () => {
      const result = await iniciarUploadLote(formDataWithFiles([]));
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/nenhum arquivo/i);
    });

    it("rejects a batch that exceeds the 15-file limit", async () => {
      const files = Array.from({ length: 16 }, (_, i) => fakeFile(`cv${i}.pdf`));
      const result = await iniciarUploadLote(formDataWithFiles(files));
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/excede o limite/i);
    });

    it("creates one 'pending' row per file and returns immediately without waiting for processing", async () => {
      const createSpy = vi
        .spyOn(uploadLoteItemRepository, "create")
        .mockImplementation(async (data) => ({ id: `id-${data.fileName}`, ...data }) as unknown as UploadLoteItem);
      // Processing itself would hang forever if awaited — proves the action doesn't await it.
      vi.mocked(executarExtracaoCurriculo).mockImplementation(() => new Promise(() => {}));

      const result = await iniciarUploadLote(formDataWithFiles([fakeFile("cv1.pdf"), fakeFile("cv2.pdf")]));

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data.map((i) => i.fileName)).toEqual(["cv1.pdf", "cv2.pdf"]);
      }
      expect(createSpy).toHaveBeenCalledWith({ fileName: "cv1.pdf", status: "pendente" });
      expect(createSpy).toHaveBeenCalledWith({ fileName: "cv2.pdf", status: "pendente" });
    });
  });

  describe("getUploadLoteAtivo", () => {
    it("delegates to uploadLoteItemRepository.findAtivos", async () => {
      const itens = [{ id: "1", fileName: "cv1.pdf", status: "sucesso" }] as unknown as UploadLoteItem[];
      vi.spyOn(uploadLoteItemRepository, "findAtivos").mockResolvedValueOnce(itens);

      const result = await getUploadLoteAtivo();

      expect(result).toEqual(itens);
    });
  });

  describe("limparUploadLoteFinalizados", () => {
    it("delegates to uploadLoteItemRepository.softDeleteFinalizados", async () => {
      const softDeleteSpy = vi
        .spyOn(uploadLoteItemRepository, "softDeleteFinalizados")
        .mockResolvedValueOnce(undefined);

      await limparUploadLoteFinalizados();

      expect(softDeleteSpy).toHaveBeenCalled();
    });
  });
});
