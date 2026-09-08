import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import { drizzle } from "drizzle-orm/postgres-js";
import { processamentoIaRepository, type DbOrTx } from "./processamento-ia";

function createQueryCapturingDb(queries: string[]): DbOrTx {
  const client = {
    options: { parsers: {}, serializers: {} },
    unsafe(query: string) {
      queries.push(query);
      return { values: async () => [] };
    },
  };

  return drizzle(client as never) as unknown as DbOrTx;
}

describe("processamentoIaRepository.findPageByFluxo", () => {
  it("filters both rows and pagination total when only failures are requested", async () => {
    const queries: string[] = [];

    await processamentoIaRepository.findPageByFluxo(
      "candidato_vagas",
      { page: 1, pageSize: 10 },
      { somenteFalhas: true },
      createQueryCapturingDb(queries),
    );

    expect(queries).toHaveLength(2);
    for (const query of queries) {
      expect(query).toContain(
        '"wgotalent_processamentos_ia"."deleted_at" is null',
      );
      expect(query).toContain('"wgotalent_processamentos_ia"."fluxo" =');
      expect(query).toContain('"wgotalent_processamentos_ia"."status" =');
    }
  });

  it("does not constrain status when the filter is disabled", async () => {
    const queries: string[] = [];

    await processamentoIaRepository.findPageByFluxo(
      "vaga_candidatos",
      { page: 1, pageSize: 10 },
      {},
      createQueryCapturingDb(queries),
    );

    expect(queries).toHaveLength(2);
    for (const query of queries) {
      expect(query).not.toContain(
        'and "wgotalent_processamentos_ia"."status" =',
      );
    }
  });
});
