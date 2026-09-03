import { afterEach, describe, expect, it, vi } from "vitest";

const {
  findByIdMock,
  findOpenByCidadeMock,
  findByIdWithCargoAndDepartamentoMock,
  findActiveByCidadeMock,
  existsForParMock,
  createTriagemMock,
  gravarAvaliacaoIAMock,
  executarClassificadorAderenciaMock,
  executarAvaliadorTriagemMock,
  marcarBancoTalentosMock,
  desmarcarBancoTalentosMock,
} = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
  findOpenByCidadeMock: vi.fn(),
  findByIdWithCargoAndDepartamentoMock: vi.fn(),
  findActiveByCidadeMock: vi.fn(),
  existsForParMock: vi.fn(),
  createTriagemMock: vi.fn(),
  gravarAvaliacaoIAMock: vi.fn(),
  executarClassificadorAderenciaMock: vi.fn(),
  executarAvaliadorTriagemMock: vi.fn(),
  marcarBancoTalentosMock: vi.fn(),
  desmarcarBancoTalentosMock: vi.fn(),
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
    existsForPar: existsForParMock,
    create: createTriagemMock,
    gravarAvaliacaoIA: gravarAvaliacaoIAMock,
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
} from "./orquestracao";

const cargoBase = {
  titulo: "Dev",
  requisitos: "req",
  requisitosDesejaveis: "des",
  criteriosEliminatorios: "elim",
  departamento: { nome: "TI" },
};

describe("orquestrarParaCandidatoNovo", () => {
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
    });

    await orquestrarParaCandidatoNovo("c1");

    expect(createTriagemMock).not.toHaveBeenCalled();
    expect(marcarBancoTalentosMock).not.toHaveBeenCalled();
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
    });
    existsForParMock.mockResolvedValueOnce(false);
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
    );
    expect(executarAvaliadorTriagemMock).toHaveBeenCalledWith("t1");
    expect(gravarAvaliacaoIAMock).toHaveBeenCalledWith({
      triagemId: "t1",
      scoreIa: "80",
    });
    expect(desmarcarBancoTalentosMock).toHaveBeenCalledWith("c1");
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
    });
    existsForParMock.mockResolvedValueOnce(true);

    await orquestrarParaCandidatoNovo("c1");

    expect(createTriagemMock).not.toHaveBeenCalled();
  });
});

describe("orquestrarParaVagaNova", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a triagem for each approved candidato", async () => {
    findByIdWithCargoAndDepartamentoMock.mockResolvedValueOnce({
      id: "v1",
      cidade: "Goiânia",
      notaCorte: "65.00",
      cargo: cargoBase,
    });
    findActiveByCidadeMock.mockResolvedValueOnce([
      { id: "c1", resumoProfissional: "r" },
    ]);
    executarClassificadorAderenciaMock.mockResolvedValueOnce({
      ok: true,
      scores: [{ id: "c1", score: 70 }],
    });
    existsForParMock.mockResolvedValueOnce(false);
    createTriagemMock.mockResolvedValueOnce({ id: "t1" });
    executarAvaliadorTriagemMock.mockResolvedValueOnce({
      triagemId: "t1",
      scoreIa: "70",
    });
    gravarAvaliacaoIAMock.mockResolvedValueOnce({ id: "a1" });

    await orquestrarParaVagaNova("v1");

    expect(createTriagemMock).toHaveBeenCalledWith(
      expect.objectContaining({ candidatoId: "c1", vagaId: "v1" }),
    );
    expect(desmarcarBancoTalentosMock).toHaveBeenCalledWith("c1");
  });

  it("uses the vacancy cutoff score when matching existing candidates", async () => {
    findByIdWithCargoAndDepartamentoMock.mockResolvedValueOnce({
      id: "v1",
      cidade: "Goiânia",
      notaCorte: "75.00",
      cargo: cargoBase,
    });
    findActiveByCidadeMock.mockResolvedValueOnce([
      { id: "c1", resumoProfissional: "r" },
    ]);
    executarClassificadorAderenciaMock.mockResolvedValueOnce({
      ok: true,
      scores: [{ id: "c1", score: 70 }],
    });

    await orquestrarParaVagaNova("v1");

    expect(createTriagemMock).not.toHaveBeenCalled();
  });
});
