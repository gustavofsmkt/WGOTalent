import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import {
  candidatoRepository,
  type CandidatoDetailCompleto,
  type CargoOption,
  type DepartamentoOption,
} from "~/server/db/repositories/candidato";

describe("Candidate Create & Edit flows - Server logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches active cargo and departamento options for create flow", async () => {
    const mockCargos: CargoOption[] = [
      {
        id: "cargo-1",
        titulo: "Desenvolvedor Full Stack",
        departamento: { id: "dep-1", nome: "Tecnologia" },
      },
    ];
    const mockDepartamentos: DepartamentoOption[] = [
      { id: "dep-1", nome: "Tecnologia" },
      { id: "dep-2", nome: "Recursos Humanos" },
    ];

    vi.spyOn(
      candidatoRepository,
      "findActiveCargoOptions",
    ).mockResolvedValueOnce(mockCargos);
    vi.spyOn(
      candidatoRepository,
      "findActiveDepartamentoOptions",
    ).mockResolvedValueOnce(mockDepartamentos);

    const [cargos, depts] = await Promise.all([
      candidatoRepository.findActiveCargoOptions(),
      candidatoRepository.findActiveDepartamentoOptions(),
    ]);

    expect(cargos).toHaveLength(1);
    expect(cargos[0]?.titulo).toBe("Desenvolvedor Full Stack");
    expect(depts).toHaveLength(2);
  });

  it("keeps extracted interest text while offering only active catalog options", async () => {
    const mockCandidate: CandidatoDetailCompleto = {
      id: "cand-1",
      nome: "Juliana Silva",
      nomeSocial: null,
      dataNascimento: "1995-03-20",
      nacionalidade: "Brasileira",
      estadoCivil: "solteiro",
      pcd: null,
      cnh: "b",
      possuiVeiculo: false,
      ensinoMedioConcluido: true,
      email: "juliana@example.com",
      celular: "(11) 99999-8888",
      linkedin: null,
      portfolio: null,
      cep: "01310-000",
      logradouro: "Rua Exemplo",
      bairro: "Centro",
      cidade: "São Paulo",
      uf: "SP",
      resumoProfissional: "Resumo profissional de teste.",
      observacoesRh: null,
      cargoInteresse: "Designer Antigo",
      areaInteresse: "Tecnologia",
      disponibilidadeHorarios: null,
      disponivelViagens: false,
      disponivelMudanca: false,
      inicioImediato: true,
      origem: "manual",
      emBancoTalentos: false,
      curriculoArquivoKey: null,
      textoCurriculoExtraido: null,
      dadosPendentes: null,
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
      deletedAt: null,
      formacoes: [],
      experiencias: [],
      certificacoes: [],
      triagens: [],
    };

    const activeCargos: CargoOption[] = [
      {
        id: "cargo-active-2",
        titulo: "Engenheiro de Dados",
        departamento: { id: "dep-1", nome: "Tecnologia" },
      },
    ];

    vi.spyOn(candidatoRepository, "findByIdComplete").mockResolvedValueOnce(
      mockCandidate,
    );
    vi.spyOn(
      candidatoRepository,
      "findActiveCargoOptions",
    ).mockResolvedValueOnce(activeCargos);
    const cand = await candidatoRepository.findByIdComplete("cand-1");
    expect(cand).not.toBeNull();

    const cargoOptions = await candidatoRepository.findActiveCargoOptions();

    expect(cand?.cargoInteresse).toBe("Designer Antigo");
    expect(cargoOptions).toHaveLength(1);
    expect(cargoOptions[0]?.titulo).toBe("Engenheiro de Dados");
  });
});
