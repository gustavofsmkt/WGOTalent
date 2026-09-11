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
import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { PgDialect } from "drizzle-orm/pg-core";
import postgres from "postgres";

const client = postgres(
  "postgres://postgres:postgres@localhost:5432/wgotalent",
);
const mockDb = drizzle(client);

describe("triagemRepository", () => {
  it("exports a named repository object with required methods", () => {
    expect(typeof triagemRepository.findPageWithJoins).toBe("function");
    expect(typeof triagemRepository.getListSummary).toBe("function");
    expect(typeof triagemRepository.isAtiva).toBe("function");
    expect(typeof triagemRepository.findApprovedCandidateIds).toBe(
      "function",
    );
    expect(typeof triagemRepository.findEmCurriculoPorCandidato).toBe(
      "function",
    );
    expect(
      typeof triagemRepository.finalizarEmAndamentoComoBancoTalentosPorVaga,
    ).toBe("function");
    expect(typeof triagemRepository.softDelete).toBe("function");
  });

  it("moves only active, in-progress screenings for the vaga to banco de talentos", async () => {
    const builder = {
      set: vi.fn(),
      where: vi.fn(),
      returning: vi
        .fn()
        .mockResolvedValue([
          { candidatoId: "candidato-1" },
          { candidatoId: "candidato-2" },
        ]),
    };
    builder.set.mockReturnValue(builder);
    builder.where.mockReturnValue(builder);
    const fakeDb = {
      update: vi.fn(() => builder),
    } as unknown as DbOrTx;
    const vagaId = "22222222-2222-2222-2222-222222222222";

    const candidatoIds =
      await triagemRepository.finalizarEmAndamentoComoBancoTalentosPorVaga(
        vagaId,
        fakeDb,
      );

    expect(builder.set).toHaveBeenCalledWith(
      expect.objectContaining({
        etapa: "finalizado",
        resultado: "banco_talentos",
        motivo: null,
      }),
    );

    const condition = builder.where.mock.calls[0]?.[0];
    const query = new PgDialect().sqlToQuery(condition);
    expect(query.sql).toContain('"wgotalent_triagens"."vaga_id" =');
    expect(query.sql).toContain('"wgotalent_triagens"."resultado" =');
    expect(query.sql).toContain('"wgotalent_triagens"."deleted_at" is null');
    expect(query.params).toEqual(
      expect.arrayContaining([vagaId, "em_andamento"]),
    );
    expect(candidatoIds).toEqual(["candidato-1", "candidato-2"]);
  });

  it("isAtiva filters by triagem id and deleted_at is null", () => {
    const triagemId = "33333333-3333-3333-3333-333333333333";
    const qb = notDeleted(
      mockDb.select({ id: triagens.id }).from(triagens),
      triagens,
      eq(triagens.id, triagemId),
    );
    const sql = qb.toSQL().sql;
    expect(sql).toContain('"wgotalent_triagens"."deleted_at" is null');
    expect(sql).toContain('"wgotalent_triagens"."id" =');
  });

  it("finds approved candidatos only through active triagens", () => {
    const qb = notDeleted(
      mockDb.select({ candidatoId: triagens.candidatoId }).from(triagens),
      triagens,
      inArray(triagens.candidatoId, ["11111111-1111-1111-1111-111111111111"]),
      eq(triagens.resultado, "aprovado"),
    );
    const sql = qb.toSQL().sql;

    expect(sql).toContain('"wgotalent_triagens"."deleted_at" is null');
    expect(sql).toContain('"wgotalent_triagens"."candidato_id" in');
    expect(sql).toContain('"wgotalent_triagens"."resultado" =');
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

  it("filters screenings by minimum active AI score", () => {
    const qb = notDeleted(
      mockDb
        .select({ id: triagens.id })
        .from(triagens)
        .leftJoin(
          avaliacaoIA,
          and(
            eq(triagens.id, avaliacaoIA.triagemId),
            isNull(avaliacaoIA.deletedAt),
          ),
        ),
      triagens,
      gte(avaliacaoIA.scoreIa, "70"),
    );
    const sql = qb.toSQL().sql;

    expect(sql).toContain('"wgotalent_avaliacao_ia"."score_ia" >=');
    expect(sql).toContain('"wgotalent_avaliacao_ia"."deleted_at" is null');
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

  it("joins AI evaluations when the summary filters by minimum score", async () => {
    const builder = {
      from: vi.fn(),
      leftJoin: vi.fn(),
      where: vi.fn(),
    };
    builder.from.mockReturnValue(builder);
    builder.leftJoin.mockReturnValue(builder);
    builder.where.mockResolvedValue([
      { total: 2, emAndamento: 1, aprovados: 1 },
    ]);
    const fakeDb = {
      select: vi.fn(() => builder),
    } as unknown as DbOrTx;

    await triagemRepository.getListSummary({ scoreIaMinimo: 70 }, fakeDb);

    expect(builder.leftJoin).toHaveBeenCalledTimes(1);
  });
});
