import { asc, desc, type Column, type SQL } from "drizzle-orm";

export type SortDirection = "asc" | "desc";

export interface SortState {
  sort: string;
  dir: SortDirection;
}

export const SORT_PARAM = "sort";
export const DIR_PARAM = "dir";

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Reads and validates the `sort`/`dir` search params against an allowlist of
 * sortable keys. Returns `fallback` (usually the table's default order, or
 * `null`) when the params are missing or invalid, so the URL can never force
 * an unsupported column into the query.
 */
export function parseSort(
  searchParams:
    | { [SORT_PARAM]?: SearchParamValue; [DIR_PARAM]?: SearchParamValue }
    | undefined,
  allowedKeys: readonly string[],
  fallback: SortState | null = null,
): SortState | null {
  const rawSort = firstValue(searchParams?.[SORT_PARAM])?.trim();
  if (!rawSort || !allowedKeys.includes(rawSort)) return fallback;

  const rawDir = firstValue(searchParams?.[DIR_PARAM])?.trim();
  const dir: SortDirection = rawDir === "desc" ? "desc" : "asc";
  return { sort: rawSort, dir };
}

/** Applies the requested direction to a column or SQL expression. */
export function toOrderBy(column: Column | SQL, dir: SortDirection): SQL {
  return dir === "asc" ? asc(column) : desc(column);
}
