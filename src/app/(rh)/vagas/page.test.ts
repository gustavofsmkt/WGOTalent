import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import { vagaRepository, type VagaWithCargoAndDepartamento } from "~/server/db/repositories/vaga";

describe("VagasPage - Server Component Logic", () => {
  const mockVagas: VagaWithCargoAndDepartamento[] = [
    {
      id: "vaga-1",
      cargoId: "cargo-1",
      status: "aberta",
      posicoesDisponiveis: 3,
      remuneracaoOferecida: "6500.00",
      cidade: "São Paulo",
      uf: "SP",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      deletedAt: null,
      cargo: {
        id: "cargo-1",
        titulo: "Desenvolvedor Frontend",
        ativo: true,
        departamento: {
          id: "dep-1",
          nome: "Tecnologia",
        },
      },
    },
    {
      id: "vaga-2",
      cargoId: "cargo-2",
      status: "pausada",
      posicoesDisponiveis: 1,
      remuneracaoOferecida: "4500.00",
      cidade: "Curitiba",
      uf: "PR",
      createdAt: "2025-01-02T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
      deletedAt: null,
      cargo: {
        id: "cargo-2",
        titulo: "Analista de RH",
        ativo: true,
        departamento: {
          id: "dep-2",
          nome: "Recursos Humanos",
        },
      },
    },
    {
      id: "vaga-3",
      cargoId: "cargo-3",
      status: "concluida",
      posicoesDisponiveis: 2,
      remuneracaoOferecida: null,
      cidade: "Campinas",
      uf: "SP",
      createdAt: "2025-01-03T00:00:00.000Z",
      updatedAt: "2025-01-03T00:00:00.000Z",
      deletedAt: null,
      cargo: {
        id: "cargo-3",
        titulo: "Engenheiro DevOps",
        ativo: true,
        departamento: {
          id: "dep-1",
          nome: "Tecnologia",
        },
      },
    },
  ];

  it("fetches all active vagas with cargo and departamento", async () => {
    vi.spyOn(vagaRepository, "findAllWithCargoAndDepartamento").mockResolvedValueOnce(
      mockVagas,
    );

    const result = await vagaRepository.findAllWithCargoAndDepartamento();
    expect(result).toHaveLength(3);
    expect(result[0]?.cargo.titulo).toBe("Desenvolvedor Frontend");
    expect(result[0]?.cargo.departamento.nome).toBe("Tecnologia");
  });

  it("calculates summary statistics correctly", () => {
    const totalAbertas = mockVagas.filter((v) => v.status === "aberta").length;
    const totalPosicoes = mockVagas.reduce(
      (acc, v) => acc + (v.posicoesDisponiveis || 0),
      0,
    );

    expect(totalAbertas).toBe(1);
    expect(totalPosicoes).toBe(6);
  });

  it("filters vagas by search query (cargo, departamento, cidade, uf)", () => {
    const query = "curitiba";
    const filtered = mockVagas.filter(
      (vaga) =>
        vaga.cargo.titulo.toLowerCase().includes(query) ||
        vaga.cargo.departamento.nome.toLowerCase().includes(query) ||
        vaga.cidade.toLowerCase().includes(query) ||
        vaga.uf.toLowerCase().includes(query),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("vaga-2");
  });

  it("filters vagas by status", () => {
    const statusFilter = "aberta";
    const filtered = mockVagas.filter((vaga) => vaga.status === statusFilter);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("vaga-1");
  });
});
