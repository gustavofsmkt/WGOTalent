import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
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

import { processarCurriculoRecebido } from "./processar-curriculo-recebido";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { storage } from "~/lib/storage";
import { executarExtracaoCurriculo } from "~/server/agents/extracao-curriculo";
import { AgenteQuotaExcedidaError } from "~/lib/agents/shared";
import type { CandidatoDetailCompleto } from "~/server/db/repositories/candidato";
import type { ExtracaoCurriculoOutput } from "~/lib/validation/extracao-curriculo";

describe("processarCurriculoRecebido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    textoCurriculoExtraido: "texto",
    formacoes: [],
    experiencias: [],
    certificacoes: [],
  };

  const input = (origem: "manual" | "email") => ({
    buffer: Buffer.from("conteudo"),
    filename: "cv.pdf",
    mimeType: "application/pdf",
    origem,
  });

  it("rejects files that exceed the size limit before touching the repository", async () => {
    const oversized = Buffer.alloc(6 * 1024 * 1024);

    const resultado = await processarCurriculoRecebido({
      buffer: oversized,
      filename: "huge.pdf",
      mimeType: "application/pdf",
      origem: "manual",
    });

    expect(resultado).toEqual({
      status: "erro",
      mensagem: expect.stringMatching(/5MB/i),
    });
    expect(storage.save).not.toHaveBeenCalled();
  });

  it("rejects unsupported mime types", async () => {
    const resultado = await processarCurriculoRecebido({
      buffer: Buffer.from("conteudo"),
      filename: "cv.txt",
      mimeType: "text/plain",
      origem: "manual",
    });

    expect(resultado).toEqual({
      status: "erro",
      mensagem: expect.stringMatching(/não suportado/i),
    });
  });

  it.each([["manual"], ["email"]] as const)(
    "sets origem explicitly to %s on createAggregate — regression for the silent 'manual' default bug",
    async (origem) => {
      vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce(null);
      vi.spyOn(candidatoRepository, "findByCelularIncludingDeleted").mockResolvedValueOnce(null);
      const createAggregateSpy = vi
        .spyOn(candidatoRepository, "createAggregate")
        .mockResolvedValueOnce({ id: "cand-1" } as unknown as CandidatoDetailCompleto);
      vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce(
        extraido as unknown as ExtracaoCurriculoOutput,
      );

      const resultado = await processarCurriculoRecebido(input(origem));

      expect(resultado).toEqual({
        status: "sucesso",
        candidatoId: "cand-1",
        mensagem: expect.any(String),
      });
      expect(createAggregateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ origem }),
      );
    },
  );

  it("sets origem explicitly on mergeAggregate when the candidate already exists", async () => {
    vi.spyOn(candidatoRepository, "findByEmailIncludingDeleted").mockResolvedValueOnce({
      id: "cand-1",
      deletedAt: null,
    } as unknown as CandidatoDetailCompleto);
    const mergeAggregateSpy = vi
      .spyOn(candidatoRepository, "mergeAggregate")
      .mockResolvedValueOnce({
        candidato: { id: "cand-1" } as unknown as CandidatoDetailCompleto,
        houveMudanca: false,
      });
    vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce(
      extraido as unknown as ExtracaoCurriculoOutput,
    );

    await processarCurriculoRecebido(input("email"));

    expect(mergeAggregateSpy).toHaveBeenCalledWith(
      "cand-1",
      expect.objectContaining({ origem: "email" }),
    );
  });

  it("returns errorType 'quota' when the extraction agent hits a quota error", async () => {
    vi.mocked(executarExtracaoCurriculo).mockRejectedValueOnce(
      new AgenteQuotaExcedidaError("cota excedida"),
    );

    const resultado = await processarCurriculoRecebido(input("email"));

    expect(resultado).toEqual({
      status: "erro",
      mensagem: expect.any(String),
      errorType: "quota",
    });
    expect(storage.delete).toHaveBeenCalled();
  });
});
