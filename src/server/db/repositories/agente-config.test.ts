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

import { agenteConfigRepository, type DbOrTx } from "./agente-config";
import { agenteConfig } from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres("postgres://postgres:postgres@localhost:5432/wgotalent");
const mockDb = drizzle(client);

describe("agenteConfigRepository", () => {
  it("exports a named repository object with required methods", () => {
    expect(agenteConfigRepository).toBeDefined();
    expect(typeof agenteConfigRepository.findAll).toBe("function");
    expect(typeof agenteConfigRepository.findBySlot).toBe("function");
    expect(typeof agenteConfigRepository.update).toBe("function");
  });

  it("builds query with notDeleted filter for findAll", () => {
    const qb = notDeleted(mockDb.select().from(agenteConfig), agenteConfig);
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_agente_config"."deleted_at" is null');
  });

  it("findAll routes its read through notDeleted() on agenteConfig", async () => {
    vi.mocked(notDeleted).mockClear();
    const mockFakeDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: async () => [],
          }),
        }),
      }),
    } as unknown as DbOrTx;

    await agenteConfigRepository.findAll(mockFakeDb);

    expect(notDeleted).toHaveBeenCalledWith(expect.anything(), agenteConfig);
  });

  it("findBySlot routes its read through notDeleted() on agenteConfig", async () => {
    vi.mocked(notDeleted).mockClear();
    const mockFakeDb = {
      select: () => ({
        from: () => ({
          where: async () => [],
        }),
      }),
    } as unknown as DbOrTx;

    await agenteConfigRepository.findBySlot("extracao_curriculo", mockFakeDb);

    expect(notDeleted).toHaveBeenCalledWith(
      expect.anything(),
      agenteConfig,
      expect.anything(),
    );
  });
});
