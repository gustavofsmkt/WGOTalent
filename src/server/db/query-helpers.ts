import { and, isNull, type SQL, type SQLWrapper } from "drizzle-orm";

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
