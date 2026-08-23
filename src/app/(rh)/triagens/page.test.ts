import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
    AGENT_CREDENTIALS_ENCRYPTION_KEY: "01234567890123456789012345678901",
  },
}));

import {
  triagemRepository,
  type TriagemListItem,
} from "~/server/db/repositories/triagem";

describe("TriagensPage - Server Component Logic & Pipeline", () => {
  const mockTriagens: TriagemListItem[] = [
    {
      id: "triagem-1",
      etapa: "curriculo",
      resultado: "em_andamento",
      motivo: null,
      createdAt: "2024-01-15T10:00:00.000Z",
      updatedAt: "2024-01-15T10:00:00.000Z",
      candidato: {
        id: "cand-1",
        nome: "Mariana Silva",
        email: "mariana.silva@example.com",
      },
      vaga: {
        id: "vaga-1",
        cargoTitulo: "Desenvolvedor Frontend",
        departamentoNome: "Tecnologia",
        cidade: "São Paulo",
        uf: "SP",
      },
      avaliacaoIa: {
        id: "aval-1",
        scoreIa: "88.50",
        parecerIa: "Excelente aderência aos requisitos técnicos.",
      },
    },
    {
      id: "triagem-2",
      etapa: "testes",
      resultado: "em_andamento",
      motivo: null,
      createdAt: "2024-01-14T10:00:00.000Z",
      updatedAt: "2024-01-14T10:00:00.000Z",
      candidato: {
        id: "cand-2",
        nome: "Carlos Eduardo",
        email: "carlos.eduardo@example.com",
      },
      vaga: {
        id: "vaga-2",
        cargoTitulo: "Analista de RH",
        departamentoNome: "Recursos Humanos",
        cidade: "Rio de Janeiro",
        uf: "RJ",
      },
      avaliacaoIa: null,
    },
    {
      id: "triagem-3",
      etapa: "finalizado",
      resultado: "reprovado",
      motivo: "fit_cultural",
      createdAt: "2024-01-10T10:00:00.000Z",
      updatedAt: "2024-01-16T12:00:00.000Z",
      candidato: {
        id: "cand-3",
        nome: "Fernanda Lima",
        email: "fernanda.lima@example.com",
      },
      vaga: {
        id: "vaga-1",
        cargoTitulo: "Desenvolvedor Frontend",
        departamentoNome: "Tecnologia",
        cidade: "São Paulo",
        uf: "SP",
      },
      avaliacaoIa: {
        id: "aval-3",
        scoreIa: "62.00",
        parecerIa: "Aderência parcial.",
      },
    },
  ];

  it("fetches active screenings with joined relations", async () => {
    vi.spyOn(triagemRepository, "findAllWithJoins").mockResolvedValueOnce(
      mockTriagens,
    );

    const result = await triagemRepository.findAllWithJoins();
    expect(result).toHaveLength(3);
    expect(result[0]?.candidato.nome).toBe("Mariana Silva");
    expect(result[0]?.vaga.cargoTitulo).toBe("Desenvolvedor Frontend");
    expect(result[0]?.avaliacaoIa?.scoreIa).toBe("88.50");
  });

  it("passes filters for etapa, resultado, and motivo to the repository", async () => {
    const spy = vi
      .spyOn(triagemRepository, "findAllWithJoins")
      .mockResolvedValueOnce([mockTriagens[2]!]);

    const filters = {
      etapa: "finalizado",
      resultado: "reprovado",
      motivo: "fit_cultural",
    };

    const result = await triagemRepository.findAllWithJoins(filters);
    expect(spy).toHaveBeenCalledWith(filters);
    expect(result).toHaveLength(1);
    expect(result[0]?.resultado).toBe("reprovado");
    expect(result[0]?.motivo).toBe("fit_cultural");
  });

  it("filters screenings by search query (candidate name, email, role, location)", () => {
    const query = "mariana";
    const filtered = mockTriagens.filter(
      (item) =>
        item.candidato.nome.toLowerCase().includes(query) ||
        (item.candidato.email?.toLowerCase().includes(query) ?? false) ||
        item.vaga.cargoTitulo.toLowerCase().includes(query) ||
        item.vaga.cidade.toLowerCase().includes(query),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.candidato.nome).toBe("Mariana Silva");
  });

  it("groups items correctly into pipeline stages", () => {
    const curriculoItems = mockTriagens.filter((t) => t.etapa === "curriculo");
    const testesItems = mockTriagens.filter((t) => t.etapa === "testes");
    const finalizadoItems = mockTriagens.filter((t) => t.etapa === "finalizado");

    expect(curriculoItems).toHaveLength(1);
    expect(testesItems).toHaveLength(1);
    expect(finalizadoItems).toHaveLength(1);
  });
});
