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

import { emailCredencialRepository, type DbOrTx } from "./email-credencial";
import { emailCredenciais } from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres("postgres://postgres:postgres@localhost:5432/wgotalent");
const mockDb = drizzle(client);

describe("emailCredencialRepository", () => {
  it("builds query with notDeleted filter for findAll", () => {
    const qb = notDeleted(mockDb.select().from(emailCredenciais), emailCredenciais);
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_email_credenciais"."deleted_at" is null');
  });

  it("findAll routes its read through notDeleted() on emailCredenciais", async () => {
    vi.mocked(notDeleted).mockClear();
    const fakeDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: async () => [],
          }),
        }),
      }),
    } as unknown as DbOrTx;

    await emailCredencialRepository.findAll(fakeDb);

    expect(notDeleted).toHaveBeenCalledWith(expect.anything(), emailCredenciais);
  });

  it("findActiva filters by ativo=true and returns only the first row", async () => {
    const fakeDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: async () => [{ id: "cred-1" }, { id: "cred-2" }],
          }),
        }),
      }),
    } as unknown as DbOrTx;

    const result = await emailCredencialRepository.findActiva(fakeDb);

    expect(result).toEqual({ id: "cred-1" });
  });

  it("findActiva returns null when there is no active credential", async () => {
    const fakeDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: async () => [],
          }),
        }),
      }),
    } as unknown as DbOrTx;

    const result = await emailCredencialRepository.findActiva(fakeDb);

    expect(result).toBeNull();
  });

  it("create deactivates any existing active credential and inserts the new one atomically", async () => {
    const calls: string[] = [];
    const fakeTx = {
      update: () => ({
        set: (data: Record<string, unknown>) => ({
          where: async () => {
            calls.push("deactivate-existing");
            expect(data.ativo).toBe(false);
          },
        }),
      }),
      insert: () => ({
        values: () => ({
          returning: async () => {
            calls.push("insert");
            return [{ id: "cred-new", ativo: true }];
          },
        }),
      }),
    };
    const fakeDb = {
      transaction: async (cb: (tx: typeof fakeTx) => unknown) => cb(fakeTx),
    } as unknown as DbOrTx;

    const created = await emailCredencialRepository.create(
      {
        host: "imap.gmail.com",
        porta: 993,
        usuario: "rh@empresa.com",
        senhaCifrada: "cifrada",
        pasta: "INBOX",
      },
      fakeDb,
    );

    expect(created).toEqual({ id: "cred-new", ativo: true });
    expect(calls).toEqual(["deactivate-existing", "insert"]);
  });

  it("deactivate sets ativo to false for the given id", async () => {
    let capturedData: Record<string, unknown> | null = null;
    const fakeDb = {
      update: () => ({
        set: (data: Record<string, unknown>) => {
          capturedData = data;
          return {
            where: () => ({
              returning: async () => [{ id: "cred-1", ativo: false }],
            }),
          };
        },
      }),
    } as unknown as DbOrTx;

    const result = await emailCredencialRepository.deactivate("cred-1", fakeDb);

    expect(capturedData).toMatchObject({ ativo: false });
    expect(result).toEqual({ id: "cred-1", ativo: false });
  });

  it("softDelete sets deletedAt for the given id", async () => {
    let capturedData: Record<string, unknown> | null = null;
    const fakeDb = {
      update: () => ({
        set: (data: Record<string, unknown>) => {
          capturedData = data;
          return {
            where: () => ({
              returning: async () => [{ id: "cred-1", deletedAt: "2026-01-01T00:00:00.000Z" }],
            }),
          };
        },
      }),
    } as unknown as DbOrTx;

    const result = await emailCredencialRepository.softDelete("cred-1", fakeDb);

    expect(capturedData).toHaveProperty("deletedAt");
    expect(result).toEqual({ id: "cred-1", deletedAt: "2026-01-01T00:00:00.000Z" });
  });

  it("atualizarWatermark updates ultimoUidProcessado for the given id", async () => {
    let capturedData: Record<string, unknown> | null = null;
    const fakeDb = {
      update: () => ({
        set: (data: Record<string, unknown>) => ({
          where: async () => {
            capturedData = data;
          },
        }),
      }),
    } as unknown as DbOrTx;

    await emailCredencialRepository.atualizarWatermark("cred-1", 42, fakeDb);

    expect(capturedData).toMatchObject({ ultimoUidProcessado: 42 });
  });
});
