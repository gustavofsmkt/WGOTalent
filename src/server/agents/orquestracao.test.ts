import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  findByIdMock,
  findOpenByCidadeMock,
  findByIdWithCargoAndDepartamentoMock,
  findActiveByCidadeMock,
  findForParComAvaliacaoMock,
  isAtivaMock,
  hasAnyActiveForCandidatoMock,
  findAvaliacaoAtivaPorTriagemIdMock,
  createTriagemMock,
  gravarAvaliacaoIAMock,
  executarClassificadorAderenciaMock,
  executarAvaliadorTriagemMock,
  marcarBancoTalentosMock,
  desmarcarBancoTalentosMock,
  createProcessamentoMock,
  finalizarProcessamentoMock,
  vincularTriagemMock,
} = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
  findOpenByCidadeMock: vi.fn(),
  findByIdWithCargoAndDepartamentoMock: vi.fn(),
  findActiveByCidadeMock: vi.fn(),
  findForParComAvaliacaoMock: vi.fn(),
  isAtivaMock: vi.fn(),
  hasAnyActiveForCandidatoMock: vi.fn(),
  findAvaliacaoAtivaPorTriagemIdMock: vi.fn(),
  createTriagemMock: vi.fn(),
  gravarAvaliacaoIAMock: vi.fn(),
  executarClassificadorAderenciaMock: vi.fn(),
  executarAvaliadorTriagemMock: vi.fn(),
  marcarBancoTalentosMock: vi.fn(),
  desmarcarBancoTalentosMock: vi.fn(),
  createProcessamentoMock: vi.fn(),
  finalizarProcessamentoMock: vi.fn(),
  vincularTriagemMock: vi.fn(),
}));

vi.mock("~/server/db/repositories/candidato", () => ({
  candidatoRepository: {
    findById: findByIdMock,
    findActiveByCidade: findActiveByCidadeMock,
    marcarBancoTalentos: marcarBancoTalentosMock,
    desmarcarBancoTalentos: desmarcarBancoTalentosMock,
  },
}));
vi.mock("~/server/db/repositories/vaga", () => ({
  vagaRepository: {
    findOpenByCidade: findOpenByCidadeMock,
    findByIdWithCargoAndDepartamento: findByIdWithCargoAndDepartamentoMock,
  },
}));
vi.mock("~/server/db/repositories/triagem", () => ({
  triagemRepository: {
    findForParComAvaliacao: findForParComAvaliacaoMock,
    isAtiva: isAtivaMock,
    hasAnyActiveForCandidato: hasAnyActiveForCandidatoMock,
    findAvaliacaoAtivaPorTriagemId: findAvaliacaoAtivaPorTriagemIdMock,
    create: createTriagemMock,
    gravarAvaliacaoIA: gravarAvaliacaoIAMock,
  },
}));
vi.mock("~/server/db", () => ({
  db: {
    transaction: async (fn: (tx: unknown) => unknown) => fn({}),
  },
}));
vi.mock("~/server/db/repositories/processamento-ia", () => ({
  processamentoIaRepository: {
    create: createProcessamentoMock,
    finalizar: finalizarProcessamentoMock,
    vincularTriagem: vincularTriagemMock,
  },
}));
vi.mock("./classificador-aderencia", () => ({
  executarClassificadorAderencia: executarClassificadorAderenciaMock,
}));
vi.mock("./avaliador-triagem", () => ({
  executarAvaliadorTriagem: executarAvaliadorTriagemMock,
}));

import {
  orquestrarParaCandidatoNovo,
  orquestrarParaVagaNova,
  reprocessarProcessamentoIa,
} from "./orquestracao";
import type { ProcessamentoIa } from "~/server/db/schema";

const cargoBase = {
  titulo: "Dev",
  requisitos: "req",
  requisitosDesejaveis: "des",
  criteriosEliminatorios: "elim",
  departamento: { nome: "TI" },
};

describe("orquestrarParaCandidatoNovo", () => {
  beforeEach(() => {
    createProcessamentoMock.mockResolvedValue({ id: "p1" });
    hasAnyActiveForCandidatoMock.mockResolvedValue(false);
    findAvaliacaoAtivaPorTriagemIdMock.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("marks candidato as banco de talentos when there are no open vagas in the same city", async () => {
    findByIdMock.mockResolvedValueOnce({
      id: "c1",
      cidade: "Goiânia",
      resumoProfissional: "r",
    });
    findOpenByCidadeMock.mockResolvedValueOnce([]);

    await orquestrarParaCandidatoNovo("c1");

    expect(executarClassificadorAderenciaMock).not.toHaveBeenCalled();
    expect(marcarBancoTalentosMock).toHaveBeenCalledWith("c1");
  });

  it("marks candidato as banco de talentos when no vaga passes the threshold", async () => {
    findByIdMock.mockResolvedValueOnce({
      id: "c1",
      cidade: "Goiânia",
      resumoProfissional: "r",
    });
    findOpenByCidadeMock.mockResolvedValueOnce([
      { id: "v1", notaCorte: "65.00", cargo: cargoBase },
    ]);
    executarClassificadorAderenciaMock.mockResolvedValueOnce({
      ok: true,
      scores: [{ id: "v1", score: 40 }],
      idsComFalha: [],
    });

    await orquestrarParaCandidatoNovo("c1");

    expect(createTriagemMock).not.toHaveBeenCalled();
    expect(marcarBancoTalentosMock).toHaveBeenCalledWith("c1");
  });

  it("does NOT mark banco de talentos when the classificador fails at the provider", async () => {
    findByIdMock.mockResolvedValueOnce({
      id: "c1",
      cidade: "Goiânia",
      resumoProfissional: "r",
    });
    findOpenByCidadeMock.mockResolvedValueOnce([
      { id: "v1", notaCorte: "65.00", cargo: cargoBase },
    ]);
    executarClassificadorAderenciaMock.mockResolvedValueOnce({
      ok: false,
      motivo: "falha_provedor",
      idsComFalha: ["v1"],
    });

    await orquestrarParaCandidatoNovo("c1");

    expect(createTriagemMock).not.toHaveBeenCalled();
    expect(marcarBancoTalentosMock).not.toHaveBeenCalled();
  });

  it("does NOT mark banco de talentos while a classifier chunk is pending", async () => {
    findByIdMock.mockResolvedValueOnce({
      id: "c1",
      cidade: "Goiânia",
      resumoProfissional: "r",
    });
    findOpenByCidadeMock.mockResolvedValueOnce([
      { id: "v1", notaCorte: "65.00", cargo: cargoBase },
      { id: "v2", notaCorte: "65.00", cargo: cargoBase },
    ]);
    executarClassificadorAderenciaMock.mockResolvedValueOnce({
      ok: true,
      scores: [{ id: "v1", score: 40 }],
      idsComFalha: ["v2"],
    });

    await orquestrarParaCandidatoNovo("c1");

    expect(marcarBancoTalentosMock).not.toHaveBeenCalled();
    expect(finalizarProcessamentoMock).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        status: "falha",
        itensPendentes: ["v2"],
      }),
    );
  });

  it("creates a triagem and runs phase 2 only for scores at or above the threshold", async () => {
    findByIdMock.mockResolvedValueOnce({
      id: "c1",
      cidade: "Goiânia",
      resumoProfissional: "r",
    });
    findOpenByCidadeMock.mockResolvedValueOnce([
      { id: "v1", notaCorte: "80.00", cargo: cargoBase },
      { id: "v2", notaCorte: "50.00", cargo: cargoBase },
    ]);
    executarClassificadorAderenciaMock.mockResolvedValueOnce({
      ok: true,
      scores: [
        { id: "v1", score: 80 },
        { id: "v2", score: 40 },
      ],
      idsComFalha: [],
    });
    findForParComAvaliacaoMock.mockResolvedValueOnce(null);
    createTriagemMock.mockResolvedValueOnce({ id: "t1" });
    executarAvaliadorTriagemMock.mockResolvedValueOnce({
      triagemId: "t1",
      scoreIa: "80",
    });
    gravarAvaliacaoIAMock.mockResolvedValueOnce({ id: "a1" });

    await orquestrarParaCandidatoNovo("c1");

    expect(createTriagemMock).toHaveBeenCalledTimes(1);
    expect(createTriagemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        candidatoId: "c1",
        vagaId: "v1",
        etapa: "curriculo",
        resultado: "em_andamento",
      }),
      expect.anything(),
    );
    expect(executarAvaliadorTriagemMock).toHaveBeenCalledWith("t1");
    expect(gravarAvaliacaoIAMock).toHaveBeenCalledWith({
      triagemId: "t1",
      scoreIa: "80",
    });
    expect(desmarcarBancoTalentosMock).toHaveBeenCalledWith(
      "c1",
      expect.anything(),
    );
  });

  it("skips creating a triagem when one already exists for the pair", async () => {
    findByIdMock.mockResolvedValueOnce({
      id: "c1",
      cidade: "Goiânia",
      resumoProfissional: "r",
    });
    findOpenByCidadeMock.mockResolvedValueOnce([
      { id: "v1", notaCorte: "65.00", cargo: cargoBase },
    ]);
    executarClassificadorAderenciaMock.mockResolvedValueOnce({
      ok: true,
      scores: [{ id: "v1", score: 90 }],
      idsComFalha: [],
    });
    findForParComAvaliacaoMock.mockResolvedValueOnce({
      triagemId: "t1",
      avaliacaoId: "a1",
    });

    await orquestrarParaCandidatoNovo("c1");

    expect(createTriagemMock).not.toHaveBeenCalled();
  });
});

describe("reprocessarProcessamentoIa", () => {
  beforeEach(() => {
    createProcessamentoMock.mockResolvedValue({ id: "p1" });
    hasAnyActiveForCandidatoMock.mockResolvedValue(false);
    findAvaliacaoAtivaPorTriagemIdMock.mockResolvedValue(null);
    isAtivaMock.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("retries only the evaluator when the triagem already exists without an evaluation", async () => {
    executarAvaliadorTriagemMock.mockResolvedValueOnce({
      triagemId: "t1",
      scoreIa: "82",
    });

    await reprocessarProcessamentoIa({
      id: "p1",
      fluxo: "candidato_vagas",
      etapa: "avaliador",
      status: "processando",
      candidatoId: "c1",
      vagaId: "v1",
      triagemId: "t1",
      itensPendentes: [],
    } as unknown as ProcessamentoIa);

    expect(executarClassificadorAderenciaMock).not.toHaveBeenCalled();
    expect(createTriagemMock).not.toHaveBeenCalled();
    expect(executarAvaliadorTriagemMock).toHaveBeenCalledWith("t1");
    expect(gravarAvaliacaoIAMock).toHaveBeenCalledTimes(1);
  });

  it("retries only pending classifier items", async () => {
    findByIdMock.mockResolvedValueOnce({
      id: "c1",
      cidade: "Goiânia",
      resumoProfissional: "r",
    });
    findOpenByCidadeMock.mockResolvedValueOnce([
      { id: "v1", notaCorte: "65.00", cargo: cargoBase },
      { id: "v2", notaCorte: "65.00", cargo: cargoBase },
    ]);
    executarClassificadorAderenciaMock.mockResolvedValueOnce({
      ok: true,
      scores: [{ id: "v2", score: 30 }],
      idsComFalha: [],
    });

    await reprocessarProcessamentoIa({
      id: "p1",
      fluxo: "candidato_vagas",
      etapa: "classificador",
      status: "processando",
      candidatoId: "c1",
      vagaId: null,
      triagemId: null,
      itensPendentes: ["v2"],
    } as unknown as ProcessamentoIa);

    expect(executarClassificadorAderenciaMock).toHaveBeenCalledWith(
      expect.anything(),
      [expect.objectContaining({ id: "v2" })],
      "candidato",
      "vaga",
    );
  });
});

describe("orquestrarParaVagaNova", () => {
  beforeEach(() => {
    createProcessamentoMock.mockResolvedValue({ id: "p1" });
    findAvaliacaoAtivaPorTriagemIdMock.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a triagem for each approved candidato", async () => {
    findByIdWithCargoAndDepartamentoMock.mockResolvedValueOnce({
      id: "v1",
      cidades: [{ id: "cid1", nome: "Goiânia", uf: "GO" }],
      notaCorte: "65.00",
      cargo: cargoBase,
    });
    findActiveByCidadeMock.mockResolvedValueOnce([
      { id: "c1", resumoProfissional: "r" },
    ]);
    executarClassificadorAderenciaMock.mockResolvedValueOnce({
      ok: true,
      scores: [{ id: "c1", score: 70 }],
      idsComFalha: [],
    });
    findForParComAvaliacaoMock.mockResolvedValueOnce(null);
    createTriagemMock.mockResolvedValueOnce({ id: "t1" });
    executarAvaliadorTriagemMock.mockResolvedValueOnce({
      triagemId: "t1",
      scoreIa: "70",
    });
    gravarAvaliacaoIAMock.mockResolvedValueOnce({ id: "a1" });

    await orquestrarParaVagaNova("v1");

    expect(createTriagemMock).toHaveBeenCalledWith(
      expect.objectContaining({ candidatoId: "c1", vagaId: "v1" }),
      expect.anything(),
    );
    expect(desmarcarBancoTalentosMock).toHaveBeenCalledWith(
      "c1",
      expect.anything(),
    );
  });

  it("uses the vacancy cutoff score when matching existing candidates", async () => {
    findByIdWithCargoAndDepartamentoMock.mockResolvedValueOnce({
      id: "v1",
      cidades: [{ id: "cid1", nome: "Goiânia", uf: "GO" }],
      notaCorte: "75.00",
      cargo: cargoBase,
    });
    findActiveByCidadeMock.mockResolvedValueOnce([
      { id: "c1", resumoProfissional: "r" },
    ]);
    executarClassificadorAderenciaMock.mockResolvedValueOnce({
      ok: true,
      scores: [{ id: "c1", score: 70 }],
      idsComFalha: [],
    });

    await orquestrarParaVagaNova("v1");

    expect(createTriagemMock).not.toHaveBeenCalled();
  });
});
