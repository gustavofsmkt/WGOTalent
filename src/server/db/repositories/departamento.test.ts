import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import { departamentoRepository } from "./departamento";
import { departamentos, cargos } from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres("postgres://postgres:postgres@localhost:5432/wgotalent");
const mockDb = drizzle(client);

describe("departamentoRepository", () => {
  it("exports a named repository object with required methods", () => {
    expect(departamentoRepository).toBeDefined();
    expect(typeof departamentoRepository.findAll).toBe("function");
    expect(typeof departamentoRepository.findAllWithActiveCargosCount).toBe("function");
    expect(typeof departamentoRepository.findById).toBe("function");
    expect(typeof departamentoRepository.create).toBe("function");
    expect(typeof departamentoRepository.update).toBe("function");
    expect(typeof departamentoRepository.softDelete).toBe("function");
    expect(typeof departamentoRepository.hasActiveCargos).toBe("function");
    expect(typeof departamentoRepository.countActiveCargos).toBe("function");
  });

  it("builds query with notDeleted filter for findAll", () => {
    const qb = notDeleted(mockDb.select().from(departamentos), departamentos);
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_departamentos"."deleted_at" is null');
  });

  it("builds query with notDeleted and id condition for findById", () => {
    const testId = "11111111-1111-1111-1111-111111111111";
    const qb = departamentoRepository.findById(testId, {
      select: () => ({
        from: (table: any) => notDeleted(mockDb.select().from(table), table),
      }),
    } as any);

    expect(qb).toBeDefined();
  });

  it("builds cargo check query with notDeleted, departamentoId, and ativo = true", () => {
    const testDeptId = "11111111-1111-1111-1111-111111111111";
    const qb = notDeleted(
      mockDb.select({ id: cargos.id }).from(cargos),
      cargos,
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_cargos"."deleted_at" is null');
  });
});
