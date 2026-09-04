import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import {
  buildPageHref,
  getPaginationItems,
  getTotalPages,
  type SearchParamsRecord,
} from "~/lib/pagination";
import { cn } from "~/lib/utils";

export interface TablePaginationProps {
  pathname: string;
  searchParams?: SearchParamsRecord;
  page: number;
  pageSize: number;
  total: number;
  pageParam?: string;
  hash?: string;
  itemLabel?: string;
  className?: string;
}

export function TablePagination({
  pathname,
  searchParams,
  page,
  pageSize,
  total,
  pageParam = "page",
  hash,
  itemLabel = "registros",
  className,
}: TablePaginationProps) {
  if (total === 0) return null;

  const totalPages = getTotalPages(total, pageSize);
  const currentPage = Math.min(page, totalPages);
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, total);
  const pageItems = getPaginationItems(currentPage, totalPages);
  const hrefFor = (targetPage: number) =>
    buildPageHref({
      pathname,
      searchParams,
      page: targetPage,
      pageParam,
      hash,
    });

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 sm:flex-row",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Mostrando {firstItem}–{lastItem} de {total} {itemLabel}
      </p>

      {totalPages > 1 ? (
        <Pagination
          className="mx-0 w-auto"
          aria-label={`Paginação de ${itemLabel}`}
        >
          <PaginationContent>
            {currentPage > 1 ? (
              <PaginationItem>
                <PaginationPrevious
                  href={hrefFor(currentPage - 1)}
                  text="Anterior"
                  aria-label="Ir para a página anterior"
                />
              </PaginationItem>
            ) : null}

            {pageItems.map((item) => (
              <PaginationItem key={item}>
                {typeof item === "number" ? (
                  <PaginationLink
                    href={hrefFor(item)}
                    isActive={item === currentPage}
                    aria-label={`Ir para a página ${item}`}
                  >
                    {item}
                  </PaginationLink>
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}

            {currentPage < totalPages ? (
              <PaginationItem>
                <PaginationNext
                  href={hrefFor(currentPage + 1)}
                  text="Próxima"
                  aria-label="Ir para a próxima página"
                />
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
