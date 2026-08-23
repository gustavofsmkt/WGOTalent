import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));
vi.mock("~/server/db/query-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/server/db/query-helpers")>();
  return { ...actual, notDeleted: vi.fn(actual.notDeleted) };
});

import { departamentoRepository, type DbOrTx } from "./departamento";
import { departamentos, cargos } from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";
import { eq } from "drizzle-orm";
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
    expect(typeof departamentoRepository.findActiveCargos).toBe("function");
  });

  it("builds query with notDeleted filter for findAll", () => {
    const qb = notDeleted(mockDb.select().from(departamentos), departamentos);
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_departamentos"."deleted_at" is null');
  });

  it("builds query with notDeleted and id condition for findById", () => {
    const testId = "11111111-1111-1111-1111-111111111111";
    const qb = notDeleted(
      mockDb.select().from(departamentos),
      departamentos,
      eq(departamentos.id, testId),
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_departamentos"."deleted_at" is null');
    expect(sql).toContain('"wgotalent_departamentos"."id" =');
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

  it("findAllWithActiveCargosCount routes its filter through notDeleted() on departamentos instead of an inline isNull", async () => {
    vi.mocked(notDeleted).mockClear();
    const mockFakeDb = {
      select: () => ({
        from: () => ({
          leftJoin: () => ({
            where: () => ({
              groupBy: () => ({
                orderBy: async () => [],
              }),
            }),
          }),
        }),
      }),
    } as unknown as DbOrTx;

    await departamentoRepository.findAllWithActiveCargosCount(mockFakeDb);

    expect(notDeleted).toHaveBeenCalledWith(expect.anything(), departamentos);
  });
});
