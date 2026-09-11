import * as React from "react";
import { cn } from "~/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableSortHeader } from "~/components/table-sort-header";

export type ColumnDef<T> = {
  header: string;
  headerClassName?: string;
  cell: (item: T) => React.ReactNode;
  cellClassName?: string;
  /**
   * When set, the header becomes a clickable server-side sort control that
   * writes this key to the `sort` URL param. The value must be in the
   * repository's sort allowlist for the ordering to take effect.
   */
  sortKey?: string;
};

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  getRowKey?: (row: T) => string | number;
  className?: string;
  /** Pagination param reset when a sort header is clicked (defaults to "page"). */
  pageParam?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey = (row) => (row as { id: string | number }).id,
  className,
  pageParam,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "hidden md:block rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs",
        className,
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((col, i) => (
              <TableHead key={i} className={col.headerClassName}>
                {col.sortKey ? (
                  <TableSortHeader
                    sortKey={col.sortKey}
                    label={col.header}
                    pageParam={pageParam}
                  />
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={getRowKey(row)}
              className="hover:bg-muted/30 transition-colors group"
            >
              {columns.map((col, i) => (
                <TableCell key={i} className={col.cellClassName}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
