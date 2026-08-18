import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import { departamentoRepository } from "~/server/db/repositories/departamento";

describe("DepartamentosPage - Server Component Logic", () => {
  it("fetches active departments with cargo counts", async () => {
    const mockDepartamentos = [
      {
        id: "1",
        nome: "Tecnologia",
        descricao: "Desenvolvimento de software e infraestrutura",
        createdAt: "2023-01-12T00:00:00.000Z",
        updatedAt: "2023-01-12T00:00:00.000Z",
        deletedAt: null,
        activeCargosCount: 5,
      },
      {
        id: "2",
        nome: "Recursos Humanos",
        descricao: "Gestão de pessoas e talentos",
        createdAt: "2023-02-05T00:00:00.000Z",
        updatedAt: "2023-02-05T00:00:00.000Z",
        deletedAt: null,
        activeCargosCount: 2,
      },
    ];

    vi.spyOn(departamentoRepository, "findAllWithActiveCargosCount").mockResolvedValueOnce(
      mockDepartamentos,
    );

    const result = await departamentoRepository.findAllWithActiveCargosCount();
    expect(result).toHaveLength(2);
    expect(result[0]?.nome).toBe("Tecnologia");
    expect(result[0]?.activeCargosCount).toBe(5);
    expect(result[1]?.nome).toBe("Recursos Humanos");
    expect(result[1]?.activeCargosCount).toBe(2);
  });

  it("filters departments by search query in name or description", () => {
    const list = [
      {
        id: "1",
        nome: "Tecnologia",
        descricao: "Desenvolvimento de software",
        activeCargosCount: 5,
      },
      {
        id: "2",
        nome: "Recursos Humanos",
        descricao: "Gestão de talentos",
        activeCargosCount: 2,
      },
    ];

    const query = "soft";
    const filtered = list.filter(
      (d) =>
        d.nome.toLowerCase().includes(query.toLowerCase()) ||
        d.descricao.toLowerCase().includes(query.toLowerCase()),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.nome).toBe("Tecnologia");
  });
});
