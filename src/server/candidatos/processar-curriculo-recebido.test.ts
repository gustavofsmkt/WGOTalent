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
  storage: {
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("~/server/agents/extracao-curriculo", () => ({
  executarExtracaoCurriculo: vi.fn(),
}));
vi.mock("~/server/agents/orquestracao", () => ({
  orquestrarParaCandidatoNovo: vi.fn().mockResolvedValue(undefined),
  orquestrarParaVagaNova: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("~/server/db/repositories/processamento-ia", () => ({
  processamentoIaRepository: {
    create: vi.fn(),
    finalizar: vi.fn(),
  },
}));

import {
  processarCurriculoRecebido,
  reprocessarIngestaoCurriculo,
} from "./processar-curriculo-recebido";
import { candidatoRepository } from "~/server/db/repositories/candidato";
import { storage } from "~/lib/storage";
import { executarExtracaoCurriculo } from "~/server/agents/extracao-curriculo";
import { processamentoIaRepository } from "~/server/db/repositories/processamento-ia";
import { AgenteQuotaExcedidaError } from "~/lib/agents/shared";
import type { CandidatoDetailCompleto } from "~/server/db/repositories/candidato";
import type { ExtracaoCurriculoOutput } from "~/lib/validation/extracao-curriculo";
import type { ProcessamentoIa } from "~/server/db/schema";

describe("processarCurriculoRecebido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(processamentoIaRepository.create).mockResolvedValue({
      id: "proc-1",
    } as ProcessamentoIa);
    vi.mocked(processamentoIaRepository.finalizar).mockResolvedValue(null);
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

  function mockCriacaoNova() {
    vi.spyOn(
      candidatoRepository,
      "findByEmailIncludingDeleted",
    ).mockResolvedValueOnce(null);
    vi.spyOn(
      candidatoRepository,
      "findByCelularIncludingDeleted",
    ).mockResolvedValueOnce(null);
    return vi
      .spyOn(candidatoRepository, "createAggregate")
      .mockResolvedValueOnce({
        id: "cand-1",
      } as unknown as CandidatoDetailCompleto);
  }

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
      const createAggregateSpy = mockCriacaoNova();
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
    vi.spyOn(
      candidatoRepository,
      "findByEmailIncludingDeleted",
    ).mockResolvedValueOnce({
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

  it("records a successful email ingestion and links the candidate", async () => {
    mockCriacaoNova();
    vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce(
      extraido as unknown as ExtracaoCurriculoOutput,
    );

    await processarCurriculoRecebido(input("email"));

    expect(processamentoIaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fluxo: "ingestao_curriculo",
        etapa: "extracao",
        status: "processando",
        arquivoKey: expect.stringMatching(/^resumes\//),
      }),
    );
    expect(processamentoIaRepository.finalizar).toHaveBeenCalledWith(
      "proc-1",
      expect.objectContaining({ status: "sucesso", candidatoId: "cand-1" }),
    );
    // Sucesso: o arquivo vira o currículo do candidato, não é apagado.
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it("keeps the file for retry on a retryable email failure (quota)", async () => {
    vi.mocked(executarExtracaoCurriculo).mockRejectedValueOnce(
      new AgenteQuotaExcedidaError("cota excedida"),
    );

    const resultado = await processarCurriculoRecebido(input("email"));

    expect(resultado).toEqual({
      status: "erro",
      mensagem: expect.any(String),
      errorType: "quota",
    });
    // Reprocessável: arquivo conservado, arquivo_key permanece no registro.
    expect(storage.delete).not.toHaveBeenCalled();
    expect(processamentoIaRepository.finalizar).toHaveBeenCalledWith(
      "proc-1",
      expect.objectContaining({ status: "falha" }),
    );
    const finalizarArg = vi.mocked(processamentoIaRepository.finalizar).mock
      .calls[0]![1];
    expect(finalizarArg).not.toHaveProperty("arquivoKey");
  });

  it("discards the file on a non-retryable email failure (no email/phone)", async () => {
    vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce({
      ...extraido,
      email: null,
      celular: null,
    } as unknown as ExtracaoCurriculoOutput);

    await processarCurriculoRecebido(input("email"));

    expect(storage.delete).toHaveBeenCalledTimes(1);
    expect(processamentoIaRepository.finalizar).toHaveBeenCalledWith(
      "proc-1",
      expect.objectContaining({ status: "falha", arquivoKey: null }),
    );
  });

  it("does NOT record in processamentos_ia for manual uploads and still deletes on error", async () => {
    vi.mocked(executarExtracaoCurriculo).mockRejectedValueOnce(
      new AgenteQuotaExcedidaError("cota excedida"),
    );

    const resultado = await processarCurriculoRecebido(input("manual"));

    expect(resultado).toEqual({
      status: "erro",
      mensagem: expect.any(String),
      errorType: "quota",
    });
    expect(processamentoIaRepository.create).not.toHaveBeenCalled();
    expect(storage.delete).toHaveBeenCalledTimes(1);
  });
});

describe("reprocessarIngestaoCurriculo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(processamentoIaRepository.finalizar).mockResolvedValue(null);
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

  it("re-runs extraction from the retained file and finalizes success", async () => {
    vi.spyOn(
      candidatoRepository,
      "findByEmailIncludingDeleted",
    ).mockResolvedValueOnce(null);
    vi.spyOn(
      candidatoRepository,
      "findByCelularIncludingDeleted",
    ).mockResolvedValueOnce(null);
    vi.spyOn(candidatoRepository, "createAggregate").mockResolvedValueOnce({
      id: "cand-2",
    } as unknown as CandidatoDetailCompleto);
    vi.mocked(executarExtracaoCurriculo).mockResolvedValueOnce(
      extraido as unknown as ExtracaoCurriculoOutput,
    );

    await reprocessarIngestaoCurriculo({
      id: "proc-9",
      arquivoKey: "resumes/abc.pdf",
      emailAssunto: "Candidatura",
      emailCorpo: "Segue currículo em anexo.",
    } as unknown as ProcessamentoIa);

    // O retry reexecuta a extração com o mesmo contexto de e-mail persistido,
    // para não divergir do resultado da ingestão original.
    expect(executarExtracaoCurriculo).toHaveBeenCalledWith("resumes/abc.pdf", {
      assunto: "Candidatura",
      corpo: "Segue currículo em anexo.",
    });
    expect(processamentoIaRepository.finalizar).toHaveBeenCalledWith(
      "proc-9",
      expect.objectContaining({ status: "sucesso", candidatoId: "cand-2" }),
    );
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it("finalizes as failure without extraction when the file is gone", async () => {
    await reprocessarIngestaoCurriculo({
      id: "proc-9",
      arquivoKey: null,
    } as unknown as ProcessamentoIa);

    expect(executarExtracaoCurriculo).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
    expect(processamentoIaRepository.finalizar).toHaveBeenCalledWith(
      "proc-9",
      expect.objectContaining({ status: "falha" }),
    );
  });
});
