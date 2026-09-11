"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "~/lib/utils";
import { DIR_PARAM, SORT_PARAM, type SortDirection } from "~/lib/sort";

export interface TableSortHeaderProps {
  sortKey: string;
  label: string;
  /** Pagination param reset on sort change (defaults to "page"). */
  pageParam?: string;
  className?: string;
}

/**
 * Clickable table header that drives server-side sorting through the URL.
 * Cycles the column through none → asc → desc → none while preserving every
 * other filter param. Rendered by {@link DataTable} whenever a column defines
 * a `sortKey`.
 */
export function TableSortHeader({
  sortKey,
  label,
  pageParam = "page",
  className,
}: TableSortHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = searchParams.get(SORT_PARAM) === sortKey;
  const dir: SortDirection | null = isActive
    ? searchParams.get(DIR_PARAM) === "desc"
      ? "desc"
      : "asc"
    : null;

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(pageParam);

    if (!isActive) {
      params.set(SORT_PARAM, sortKey);
      params.set(DIR_PARAM, "asc");
    } else if (dir === "asc") {
      params.set(SORT_PARAM, sortKey);
      params.set(DIR_PARAM, "desc");
    } else {
      params.delete(SORT_PARAM);
      params.delete(DIR_PARAM);
    }

    const query = params.toString();
    // Navigate directly rather than inside startTransition: on a force-dynamic
    // route a wrapped navigation can be interrupted by a competing update,
    // which surfaces as the header needing two clicks to sort.
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const Icon = !isActive ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  const sortLabel = !isActive
    ? "não ordenado"
    : dir === "asc"
      ? "crescente"
      : "decrescente";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Ordenar por ${label} (${sortLabel})`}
      className={cn(
        "group -ml-1 inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive ? "font-medium text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      <Icon
        aria-hidden="true"
        className={cn(
          "size-3.5 shrink-0 transition-opacity",
          isActive ? "opacity-100" : "opacity-40 group-hover:opacity-70",
        )}
      />
    </button>
  );
}
