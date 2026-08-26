import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import { vagaRepository } from "./vaga";
import { vagas, cargos, departamentos } from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(
  "postgres://postgres:postgres@localhost:5432/wgotalent",
);
const mockDb = drizzle(client);

describe("vagaRepository", () => {
  it("exports a named repository object with required methods", () => {
    expect(vagaRepository).toBeDefined();
    expect(typeof vagaRepository.findAll).toBe("function");
    expect(typeof vagaRepository.findAllWithCargoAndDepartamento).toBe(
      "function",
    );
    expect(typeof vagaRepository.findById).toBe("function");
    expect(typeof vagaRepository.findByIdWithCargoAndDepartamento).toBe(
      "function",
    );
    expect(
      typeof vagaRepository.findHistoricalByIdWithCargoAndDepartamento,
    ).toBe("function");
    expect(typeof vagaRepository.findActiveCargoOptions).toBe("function");
    expect(typeof vagaRepository.findOpenByCidade).toBe("function");
    expect(typeof vagaRepository.create).toBe("function");
    expect(typeof vagaRepository.update).toBe("function");
    expect(typeof vagaRepository.softDelete).toBe("function");
  });

  it("builds query with notDeleted filter for findAll", () => {
    const qb = notDeleted(mockDb.select().from(vagas), vagas);
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_vagas"."deleted_at" is null');
  });

  it("builds query with notDeleted and joins for findAllWithCargoAndDepartamento", () => {
    const qb = notDeleted(
      mockDb
        .select({
          id: vagas.id,
          status: vagas.status,
        })
        .from(vagas)
        .innerJoin(cargos, eq(vagas.cargoId, cargos.id))
        .innerJoin(departamentos, eq(cargos.departamentoId, departamentos.id)),
      vagas,
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_vagas"."deleted_at" is null');
  });

  it("builds query with notDeleted and id condition for findById", () => {
    const testId = "22222222-2222-2222-2222-222222222222";
    const qb = notDeleted(
      mockDb.select().from(vagas),
      vagas,
      eq(vagas.id, testId),
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_vagas"."deleted_at" is null');
    expect(sql).toContain('"wgotalent_vagas"."id" =');
  });

  it("builds cargo options query with notDeleted and ativo = true", () => {
    const qb = notDeleted(
      mockDb
        .select({
          id: cargos.id,
          titulo: cargos.titulo,
        })
        .from(cargos),
      cargos,
      eq(cargos.ativo, true),
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_cargos"."deleted_at" is null');
    expect(sql).toContain('"wgotalent_cargos"."ativo" =');
  });

  it("builds open vagas by cidade query with notDeleted filter", () => {
    const qb = notDeleted(
      mockDb.select().from(vagas),
      vagas,
      eq(vagas.cidade, "São Paulo"),
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_vagas"."deleted_at" is null');
    expect(sql).toContain('"wgotalent_vagas"."cidade" =');
  });
});
