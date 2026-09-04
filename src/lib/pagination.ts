export const DEFAULT_PAGE_SIZE = 10;
export const DASHBOARD_PAGE_SIZE = 5;

export interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export type SearchParamsRecord = Record<string, string | string[] | undefined>;
export type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

interface BuildPaginationHrefInput {
  pathname: string;
  searchParams?: SearchParamsRecord;
  pages: Record<string, number>;
  hash?: string;
}

export function parsePage(value: string | string[] | undefined): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return 1;

  const page = Number(rawValue);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function getPaginationOffset({
  page,
  pageSize,
}: PaginationInput): number {
  return (page - 1) * pageSize;
}

export function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ];
}

export function buildPageHref({
  pathname,
  searchParams,
  page,
  pageParam = "page",
  hash,
}: {
  pathname: string;
  searchParams?: SearchParamsRecord;
  page: number;
  pageParam?: string;
  hash?: string;
}): string {
  return buildPaginationHref({
    pathname,
    searchParams,
    pages: { [pageParam]: page },
    hash,
  });
}

export function buildPaginationHref({
  pathname,
  searchParams,
  pages,
  hash,
}: BuildPaginationHrefInput): string {
  const params = new URLSearchParams();
  const pageParams = new Set(Object.keys(pages));

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value === undefined || pageParams.has(key)) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.set(key, value);
    }
  }

  for (const [pageParam, page] of Object.entries(pages)) {
    if (page > 1) params.set(pageParam, String(page));
  }

  const query = params.toString();
  const fragment = hash ? `#${hash.replace(/^#/, "")}` : "";
  return `${pathname}${query ? `?${query}` : ""}${fragment}`;
}
