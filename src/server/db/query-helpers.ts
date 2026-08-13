import { and, isNull, type SQL } from 'drizzle-orm';

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
  T extends { where(c: any): any },
  TTable extends { deletedAt: any }
>(
  qb: T,
  table: TTable,
  ...conditions: (SQL | undefined)[]
): ReturnType<T['where']> {
  const allConditions = conditions.filter(Boolean);
  if (allConditions.length > 0) {
    return qb.where(and(isNull(table.deletedAt), ...allConditions));
  }
  return qb.where(isNull(table.deletedAt));
}
