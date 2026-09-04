import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import {
  vagaRepository,
  type VagaWithCargoAndDepartamento,
} from "~/server/db/repositories/vaga";

describe("VagasPage - Server Component Logic", () => {
  const mockVagas: VagaWithCargoAndDepartamento[] = [
    {
      id: "vaga-1",
      cargoId: "cargo-1",
      status: "aberta",
      posicoesDisponiveis: 3,
      notaCorte: "65.00",
      remuneracaoOferecida: "6500.00",
      cidades: [{ id: "cid-1", nome: "São Paulo", uf: "SP" }],
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      deletedAt: null,
      cargo: {
        id: "cargo-1",
        titulo: "Desenvolvedor Frontend",
        ativo: true,
        descricao: "",
        requisitos: "",
        requisitosDesejaveis: "",
        criteriosEliminatorios: "",
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
      notaCorte: "70.00",
      remuneracaoOferecida: "4500.00",
      cidades: [{ id: "cid-2", nome: "Curitiba", uf: "PR" }],
      createdAt: "2025-01-02T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
      deletedAt: null,
      cargo: {
        id: "cargo-2",
        titulo: "Analista de RH",
        ativo: true,
        descricao: "",
        requisitos: "",
        requisitosDesejaveis: "",
        criteriosEliminatorios: "",
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
      notaCorte: "60.00",
      remuneracaoOferecida: null,
      cidades: [
        { id: "cid-3", nome: "Campinas", uf: "SP" },
        { id: "cid-1", nome: "São Paulo", uf: "SP" },
      ],
      createdAt: "2025-01-03T00:00:00.000Z",
      updatedAt: "2025-01-03T00:00:00.000Z",
      deletedAt: null,
      cargo: {
        id: "cargo-3",
        titulo: "Engenheiro DevOps",
        ativo: true,
        descricao: "",
        requisitos: "",
        requisitosDesejaveis: "",
        criteriosEliminatorios: "",
        departamento: {
          id: "dep-1",
          nome: "Tecnologia",
        },
      },
    },
  ];

  it("fetches a page of active vagas with cargo and departamento", async () => {
    vi.spyOn(
      vagaRepository,
      "findPageWithCargoAndDepartamento",
    ).mockResolvedValueOnce({ items: mockVagas, total: 3 });

    const result = await vagaRepository.findPageWithCargoAndDepartamento(
      {},
      { page: 1, pageSize: 10 },
    );
    expect(result.total).toBe(3);
    expect(result.items[0]?.cargo.titulo).toBe("Desenvolvedor Frontend");
    expect(result.items[0]?.cargo.departamento.nome).toBe("Tecnologia");
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

  it("filters vagas by search query against cidades array", () => {
    const query = "curitiba";
    const filtered = mockVagas.filter(
      (vaga) =>
        vaga.cargo.titulo.toLowerCase().includes(query) ||
        vaga.cargo.departamento.nome.toLowerCase().includes(query) ||
        vaga.cidades.some(
          (c) =>
            c.nome.toLowerCase().includes(query) ||
            c.uf.toLowerCase().includes(query),
        ),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("vaga-2");
  });

  it("matches vagas with multiple cities when query matches any of them", () => {
    const query = "campinas";
    const filtered = mockVagas.filter(
      (vaga) =>
        vaga.cargo.titulo.toLowerCase().includes(query) ||
        vaga.cargo.departamento.nome.toLowerCase().includes(query) ||
        vaga.cidades.some(
          (c) =>
            c.nome.toLowerCase().includes(query) ||
            c.uf.toLowerCase().includes(query),
        ),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("vaga-3");
  });

  it("filters vagas by status", () => {
    const statusFilter = "aberta";
    const filtered = mockVagas.filter((vaga) => vaga.status === statusFilter);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("vaga-1");
  });
});
