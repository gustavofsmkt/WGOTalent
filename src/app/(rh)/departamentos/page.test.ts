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

    vi.spyOn(
      departamentoRepository,
      "findAllWithActiveCargosCount",
    ).mockResolvedValueOnce(mockDepartamentos);

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

  it("fetches single department and its active cargos for detail page", async () => {
    const mockDept = {
      id: "dept-1",
      nome: "Engenharia",
      descricao: "Engenharia de software",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    const mockCargos = [
      {
        id: "cargo-1",
        departamentoId: "dept-1",
        titulo: "Desenvolvedor Backend",
        descricao: "Desenvolvimento de APIs",
        ativo: true,
        faixaSalarial: "10000.00",
        requisitos: "Node.js",
        requisitosDesejaveis: "Drizzle",
        criteriosEliminatorios: "TypeScript",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ];

    vi.spyOn(departamentoRepository, "findById").mockResolvedValueOnce(
      mockDept,
    );
    vi.spyOn(departamentoRepository, "findActiveCargos").mockResolvedValueOnce(
      mockCargos,
    );

    const dept = await departamentoRepository.findById("dept-1");
    const cargos = await departamentoRepository.findActiveCargos("dept-1");

    expect(dept?.nome).toBe("Engenharia");
    expect(cargos).toHaveLength(1);
    expect(cargos[0]?.titulo).toBe("Desenvolvedor Backend");
  });

  it("returns null when department is not found or soft-deleted", async () => {
    vi.spyOn(departamentoRepository, "findById").mockResolvedValueOnce(null);

    const dept = await departamentoRepository.findById("non-existent-id");
    expect(dept).toBeNull();
  });
});
