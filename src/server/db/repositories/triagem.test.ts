import { describe, it, expect } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    NODE_ENV: "test",
  },
}));

import { vi } from "vitest";
import { triagemRepository, type DbOrTx } from "./triagem";
import { triagens, vagas, avaliacaoIA } from "~/server/db/schema";
import { notDeleted } from "~/server/db/query-helpers";
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(
  "postgres://postgres:postgres@localhost:5432/wgotalent",
);
const mockDb = drizzle(client);

describe("triagemRepository", () => {
  it("exports a named repository object with required methods", () => {
    expect(typeof triagemRepository.findPageWithJoins).toBe("function");
    expect(typeof triagemRepository.getListSummary).toBe("function");
    expect(typeof triagemRepository.existsForPar).toBe("function");
    expect(typeof triagemRepository.findEmCurriculoPorCandidato).toBe(
      "function",
    );
    expect(typeof triagemRepository.softDelete).toBe("function");
  });

  it("existsForPar filters by deleted_at is null, unlike the old unfiltered check", () => {
    const candidatoId = "11111111-1111-1111-1111-111111111111";
    const vagaId = "22222222-2222-2222-2222-222222222222";
    const qb = notDeleted(
      mockDb.select({ id: triagens.id }).from(triagens),
      triagens,
      eq(triagens.candidatoId, candidatoId),
      eq(triagens.vagaId, vagaId),
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_triagens"."deleted_at" is null');
    expect(sql).toContain('"wgotalent_triagens"."candidato_id" =');
    expect(sql).toContain('"wgotalent_triagens"."vaga_id" =');
  });

  it("findEmCurriculoPorCandidato filters by candidato, etapa='curriculo' and resultado='em_andamento'", () => {
    const candidatoId = "11111111-1111-1111-1111-111111111111";
    const qb = notDeleted(
      mockDb.select({ id: triagens.id }).from(triagens),
      triagens,
      eq(triagens.candidatoId, candidatoId),
      eq(triagens.etapa, "curriculo"),
      eq(triagens.resultado, "em_andamento"),
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_triagens"."deleted_at" is null');
    expect(sql).toContain('"wgotalent_triagens"."etapa" =');
    expect(sql).toContain('"wgotalent_triagens"."resultado" =');
  });

  it("findAllWithJoins filters by vagaId when provided", () => {
    const vagaId = "22222222-2222-2222-2222-222222222222";
    const qb = notDeleted(
      mockDb.select({ id: triagens.id }).from(triagens),
      triagens,
      eq(triagens.vagaId, vagaId),
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_triagens"."deleted_at" is null');
    expect(sql).toContain('"wgotalent_triagens"."vaga_id" =');
  });

  it("findAllWithJoins filters by vaga status='aberta' when vagaAtiva is true", () => {
    const qb = notDeleted(
      mockDb
        .select({ id: triagens.id })
        .from(triagens)
        .innerJoin(vagas, eq(triagens.vagaId, vagas.id)),
      triagens,
      eq(vagas.status, "aberta"),
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_triagens"."deleted_at" is null');
    expect(sql).toContain('"wgotalent_vagas"."status" =');
  });

  it("hydrates only active AI evaluations", () => {
    const qb = notDeleted(
      mockDb
        .select({
          triagemId: triagens.id,
          avaliacaoId: avaliacaoIA.id,
        })
        .from(triagens)
        .leftJoin(
          avaliacaoIA,
          and(
            eq(triagens.id, avaliacaoIA.triagemId),
            isNull(avaliacaoIA.deletedAt),
          ),
        ),
      triagens,
    );
    const sql = qb.toSQL().sql;

    expect(sql).toContain('"wgotalent_avaliacao_ia"."deleted_at" is null');
    expect(sql).toContain(
      '"wgotalent_triagens"."id" = "wgotalent_avaliacao_ia"."triagem_id"',
    );
  });

  it("avoids related-table joins for triagem-only summary filters", async () => {
    const builder = {
      from: vi.fn(),
      innerJoin: vi.fn(),
      where: vi.fn(),
    };
    builder.from.mockReturnValue(builder);
    builder.innerJoin.mockReturnValue(builder);
    builder.where.mockResolvedValue([
      { total: 4, emAndamento: 3, aprovados: 1 },
    ]);
    const fakeDb = {
      select: vi.fn(() => builder),
    } as unknown as DbOrTx;

    const summary = await triagemRepository.getListSummary(
      { resultado: "em_andamento" },
      fakeDb,
    );

    expect(builder.innerJoin).not.toHaveBeenCalled();
    expect(summary).toEqual({ total: 4, emAndamento: 3, aprovados: 1 });
  });

  it("joins only vagas when the summary filters active vacancies", async () => {
    const builder = {
      from: vi.fn(),
      innerJoin: vi.fn(),
      where: vi.fn(),
    };
    builder.from.mockReturnValue(builder);
    builder.innerJoin.mockReturnValue(builder);
    builder.where.mockResolvedValue([
      { total: 2, emAndamento: 1, aprovados: 1 },
    ]);
    const fakeDb = {
      select: vi.fn(() => builder),
    } as unknown as DbOrTx;

    await triagemRepository.getListSummary({ vagaAtiva: true }, fakeDb);

    expect(builder.innerJoin).toHaveBeenCalledTimes(1);
  });
});
