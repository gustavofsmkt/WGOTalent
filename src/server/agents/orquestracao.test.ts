import { afterEach, describe, expect, it, vi } from "vitest";

const {
  findByIdMock,
  findOpenByCidadeMock,
  findByIdWithCargoAndDepartamentoMock,
  findActiveByCidadeMock,
  findBySlotMock,
  existsForParMock,
  createTriagemMock,
  gravarAvaliacaoIAMock,
  executarClassificadorAderenciaMock,
  executarAvaliadorTriagemMock,
} = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
  findOpenByCidadeMock: vi.fn(),
  findByIdWithCargoAndDepartamentoMock: vi.fn(),
  findActiveByCidadeMock: vi.fn(),
  findBySlotMock: vi.fn(),
  existsForParMock: vi.fn(),
  createTriagemMock: vi.fn(),
  gravarAvaliacaoIAMock: vi.fn(),
  executarClassificadorAderenciaMock: vi.fn(),
  executarAvaliadorTriagemMock: vi.fn(),
}));

vi.mock("~/server/db/repositories/candidato", () => ({
  candidatoRepository: { findById: findByIdMock, findActiveByCidade: findActiveByCidadeMock },
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
vi.mock("~/server/db/repositories/agente-config", () => ({
  agenteConfigRepository: { findBySlot: findBySlotMock },
}));
vi.mock("./classificador-aderencia", () => ({
  executarClassificadorAderencia: executarClassificadorAderenciaMock,
}));
vi.mock("./avaliador-triagem", () => ({
  executarAvaliadorTriagem: executarAvaliadorTriagemMock,
}));

import { orquestrarParaCandidatoNovo, orquestrarParaVagaNova } from "./orquestracao";

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

  it("does nothing when there are no open vagas in the same city", async () => {
    findByIdMock.mockResolvedValueOnce({ id: "c1", cidade: "Goiânia", resumoProfissional: "r" });
    findOpenByCidadeMock.mockResolvedValueOnce([]);

    await orquestrarParaCandidatoNovo("c1");

    expect(executarClassificadorAderenciaMock).not.toHaveBeenCalled();
  });

  it("creates a triagem and runs phase 2 only for scores at or above the threshold", async () => {
    findByIdMock.mockResolvedValueOnce({ id: "c1", cidade: "Goiânia", resumoProfissional: "r" });
    findOpenByCidadeMock.mockResolvedValueOnce([
      { id: "v1", cargo: cargoBase },
      { id: "v2", cargo: cargoBase },
    ]);
    findBySlotMock.mockResolvedValueOnce({ thresholdScore: "65" });
    executarClassificadorAderenciaMock.mockResolvedValueOnce([
      { id: "v1", score: 80 },
      { id: "v2", score: 40 },
    ]);
    existsForParMock.mockResolvedValueOnce(false);
    createTriagemMock.mockResolvedValueOnce({ id: "t1" });
    executarAvaliadorTriagemMock.mockResolvedValueOnce({ triagemId: "t1", scoreIa: "80" });
    gravarAvaliacaoIAMock.mockResolvedValueOnce({ id: "a1" });

    await orquestrarParaCandidatoNovo("c1");

    expect(createTriagemMock).toHaveBeenCalledTimes(1);
    expect(createTriagemMock).toHaveBeenCalledWith(
      expect.objectContaining({ candidatoId: "c1", vagaId: "v1", etapa: "curriculo", resultado: "em_andamento" }),
    );
    expect(executarAvaliadorTriagemMock).toHaveBeenCalledWith("t1");
    expect(gravarAvaliacaoIAMock).toHaveBeenCalledWith({ triagemId: "t1", scoreIa: "80" });
  });

  it("skips creating a triagem when one already exists for the pair", async () => {
    findByIdMock.mockResolvedValueOnce({ id: "c1", cidade: "Goiânia", resumoProfissional: "r" });
    findOpenByCidadeMock.mockResolvedValueOnce([{ id: "v1", cargo: cargoBase }]);
    findBySlotMock.mockResolvedValueOnce({ thresholdScore: "65" });
    executarClassificadorAderenciaMock.mockResolvedValueOnce([{ id: "v1", score: 90 }]);
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
      cargo: cargoBase,
    });
    findActiveByCidadeMock.mockResolvedValueOnce([{ id: "c1", resumoProfissional: "r" }]);
    findBySlotMock.mockResolvedValueOnce({ thresholdScore: "65" });
    executarClassificadorAderenciaMock.mockResolvedValueOnce([{ id: "c1", score: 70 }]);
    existsForParMock.mockResolvedValueOnce(false);
    createTriagemMock.mockResolvedValueOnce({ id: "t1" });
    executarAvaliadorTriagemMock.mockResolvedValueOnce({ triagemId: "t1", scoreIa: "70" });
    gravarAvaliacaoIAMock.mockResolvedValueOnce({ id: "a1" });

    await orquestrarParaVagaNova("v1");

    expect(createTriagemMock).toHaveBeenCalledWith(
      expect.objectContaining({ candidatoId: "c1", vagaId: "v1" }),
    );
  });
});
