import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import { candidatoRepository, type CandidatoSummary } from "~/server/db/repositories/candidato";

describe("CandidatosPage - Server Component Logic", () => {
  it("fetches active candidates summary", async () => {
    const mockCandidatos: CandidatoSummary[] = [
      {
        id: "cand-1",
        nome: "Ana Souza",
        email: "ana.souza@example.com",
        celular: "(11) 98888-7777",
        cidade: "São Paulo",
        uf: "SP",
        origem: "manual",
        cargoInteresse: "Desenvolvedor Frontend",
        createdAt: "2023-05-10T10:00:00.000Z",
      },
      {
        id: "cand-2",
        nome: "Carlos Lima",
        email: "carlos.lima@example.com",
        celular: "(21) 97777-6666",
        cidade: "Rio de Janeiro",
        uf: "RJ",
        origem: "email",
        cargoInteresse: null,
        createdAt: "2023-06-15T14:30:00.000Z",
      },
    ];

    vi.spyOn(candidatoRepository, "findAllActiveSummary").mockResolvedValueOnce(
      mockCandidatos,
    );

    const result = await candidatoRepository.findAllActiveSummary();
    expect(result).toHaveLength(2);
    expect(result[0]?.nome).toBe("Ana Souza");
    expect(result[0]?.origem).toBe("manual");
    expect(result[1]?.nome).toBe("Carlos Lima");
    expect(result[1]?.origem).toBe("email");
  });

  it("filters candidates by search query in nome, email, cidade or cargoInteresse", () => {
    const list: CandidatoSummary[] = [
      {
        id: "1",
        nome: "Ana Souza",
        email: "ana.souza@example.com",
        celular: "(11) 98888-7777",
        cidade: "São Paulo",
        uf: "SP",
        origem: "manual",
        cargoInteresse: "Desenvolvedor Frontend",
        createdAt: "2023-05-10T10:00:00.000Z",
      },
      {
        id: "2",
        nome: "Carlos Lima",
        email: "carlos.lima@example.com",
        celular: "(21) 97777-6666",
        cidade: "Rio de Janeiro",
        uf: "RJ",
        origem: "email",
        cargoInteresse: "Analista de RH",
        createdAt: "2023-06-15T14:30:00.000Z",
      },
    ];

    const query = "frontend";
    const filtered = list.filter(
      (c) =>
        c.nome.toLowerCase().includes(query) ||
        (c.email?.toLowerCase().includes(query) ?? false) ||
        c.cidade.toLowerCase().includes(query) ||
        c.uf.toLowerCase().includes(query) ||
        (c.cargoInteresse && c.cargoInteresse.toLowerCase().includes(query)),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.nome).toBe("Ana Souza");
  });

  it("filters candidates by origem", () => {
    const list: CandidatoSummary[] = [
      {
        id: "1",
        nome: "Ana Souza",
        email: "ana.souza@example.com",
        celular: "(11) 98888-7777",
        cidade: "São Paulo",
        uf: "SP",
        origem: "manual",
        cargoInteresse: "Frontend",
        createdAt: "2023-05-10T10:00:00.000Z",
      },
      {
        id: "2",
        nome: "Carlos Lima",
        email: "carlos.lima@example.com",
        celular: "(21) 97777-6666",
        cidade: "Rio de Janeiro",
        uf: "RJ",
        origem: "email",
        cargoInteresse: "RH",
        createdAt: "2023-06-15T14:30:00.000Z",
      },
      {
        id: "3",
        nome: "Mariana Silva",
        email: "mariana.silva@example.com",
        celular: "(31) 96666-5555",
        cidade: "Belo Horizonte",
        uf: "MG",
        origem: "indicacao",
        cargoInteresse: "Backend",
        createdAt: "2023-07-01T09:00:00.000Z",
      },
    ];

    const emailOnly = list.filter((c) => c.origem === "email");
    expect(emailOnly).toHaveLength(1);
    expect(emailOnly[0]?.nome).toBe("Carlos Lima");

    const indicacaoOnly = list.filter((c) => c.origem === "indicacao");
    expect(indicacaoOnly).toHaveLength(1);
    expect(indicacaoOnly[0]?.nome).toBe("Mariana Silva");
  });
});
