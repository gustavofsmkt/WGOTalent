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
import { cargoRepository } from "~/server/db/repositories/cargo";
import { departamentoRepository } from "~/server/db/repositories/departamento";

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

    vi.spyOn(candidatoRepository, "findActiveCargoOptions").mockResolvedValueOnce(mockCargos);
    vi.spyOn(candidatoRepository, "findActiveDepartamentoOptions").mockResolvedValueOnce(mockDepartamentos);

    const [cargos, depts] = await Promise.all([
      candidatoRepository.findActiveCargoOptions(),
      candidatoRepository.findActiveDepartamentoOptions(),
    ]);

    expect(cargos).toHaveLength(1);
    expect(cargos[0]?.titulo).toBe("Desenvolvedor Full Stack");
    expect(depts).toHaveLength(2);
  });

  it("handles inactive cargo when editing a candidate", async () => {
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
      cargoInteresseId: "cargo-inativo-1",
      areaInteresseId: "dep-1",
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
      cargoInteresse: null,
      areaInteresse: null,
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

    vi.spyOn(candidatoRepository, "findByIdComplete").mockResolvedValueOnce(mockCandidate);
    vi.spyOn(candidatoRepository, "findActiveCargoOptions").mockResolvedValueOnce(activeCargos);
    vi.spyOn(candidatoRepository, "findActiveDepartamentoOptions").mockResolvedValueOnce([
      { id: "dep-1", nome: "Tecnologia" },
    ]);

    vi.spyOn(cargoRepository, "findByIdWithDepartamento").mockResolvedValueOnce({
      id: "cargo-inativo-1",
      departamentoId: "dep-1",
      titulo: "Designer Antigo",
      descricao: "Desc",
      ativo: false,
      faixaSalarial: "5000",
      requisitos: "Req",
      requisitosDesejaveis: "",
      criteriosEliminatorios: "",
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
      deletedAt: null,
      departamento: {
        id: "dep-1",
        nome: "Tecnologia",
      },
    });

    const cand = await candidatoRepository.findByIdComplete("cand-1");
    expect(cand).not.toBeNull();

    const activeCargoOptions = await candidatoRepository.findActiveCargoOptions();
    let cargoOptions = activeCargoOptions;

    if (
      cand?.cargoInteresseId &&
      !activeCargoOptions.some((c) => c.id === cand.cargoInteresseId)
    ) {
      const currentCargo = await cargoRepository.findByIdWithDepartamento(
        cand.cargoInteresseId,
      );
      if (currentCargo) {
        cargoOptions = [
          {
            id: currentCargo.id,
            titulo: `${currentCargo.titulo} (Inativo)`,
            departamento: {
              id: currentCargo.departamento.id,
              nome: currentCargo.departamento.nome,
            },
          },
          ...activeCargoOptions,
        ];
      }
    }

    expect(cargoOptions).toHaveLength(2);
    expect(cargoOptions[0]?.titulo).toBe("Designer Antigo (Inativo)");
    expect(cargoOptions[1]?.titulo).toBe("Engenheiro de Dados");
  });
});
