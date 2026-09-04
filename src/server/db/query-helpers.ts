import {
  and,
  eq,
  exists,
  ilike,
  isNull,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";
import type { db } from "~/server/db";
import {
  cidades,
  vagaCidades,
  vagas,
  type CidadeRef,
} from "~/server/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type QueryDb = typeof db | Tx;

/**
 * Ensures the query filters out soft-deleted records.
 *
 * Usage:
 * const qb = notDeleted(db.select().from(departamentos), departamentos);
 *
 * To add more conditions (e.g. an ID filter), pass them as the third argument:
 * const qb = notDeleted(db.select().from(departamentos), departamentos, eq(departamentos.id, id));
 */
export function notDeleted<
  T extends { where(c: SQL | undefined): unknown },
  TTable extends { deletedAt: SQLWrapper },
>(
  qb: T,
  table: TTable,
  ...conditions: (SQL | undefined)[]
): ReturnType<T["where"]> {
  const allConditions = conditions.filter(Boolean);
  if (allConditions.length > 0) {
    return qb.where(
      and(isNull(table.deletedAt), ...allConditions),
    ) as ReturnType<T["where"]>;
  }
  return qb.where(isNull(table.deletedAt)) as ReturnType<T["where"]>;
}

/** Aggregates the active city links for the current outer `vagas` row. */
export function activeCitiesForVaga(dbOrTx: QueryDb): SQL<CidadeRef[]> {
  const query = notDeleted(
    dbOrTx
      .select({
        cidades: sql<CidadeRef[]>`json_agg(
          json_build_object(
            'id', ${cidades.id}::text,
            'nome', ${cidades.nome},
            'uf', ${cidades.uf}
          )
          order by ${cidades.nome}
        )`,
      })
      .from(vagaCidades)
      .innerJoin(cidades, eq(vagaCidades.cidadeId, cidades.id)),
    vagaCidades,
    eq(vagaCidades.vagaId, vagas.id),
    isNull(cidades.deletedAt),
  );

  return sql<CidadeRef[]>`coalesce((${query}), '[]'::json)`;
}

/** Matches an outer `vagas` row by one of its active cities. */
export function matchesActiveVagaCity(dbOrTx: QueryDb, pattern: string): SQL {
  return exists(
    notDeleted(
      dbOrTx
        .select({ id: vagaCidades.id })
        .from(vagaCidades)
        .innerJoin(cidades, eq(vagaCidades.cidadeId, cidades.id)),
      vagaCidades,
      eq(vagaCidades.vagaId, vagas.id),
      isNull(cidades.deletedAt),
      or(ilike(cidades.nome, pattern), ilike(cidades.uf, pattern)),
    ),
  );
}

/** Matches an outer `vagas` row by an exact active city name. */
export function matchesActiveVagaCityName(
  dbOrTx: QueryDb,
  cityName: string,
): SQL {
  return exists(
    notDeleted(
      dbOrTx
        .select({ id: vagaCidades.id })
        .from(vagaCidades)
        .innerJoin(cidades, eq(vagaCidades.cidadeId, cidades.id)),
      vagaCidades,
      eq(vagaCidades.vagaId, vagas.id),
      isNull(cidades.deletedAt),
      eq(cidades.nome, cityName),
    ),
  );
}
