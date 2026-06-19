import type {
  ColumnDef,
  Row,
  SortingState,
} from "@tanstack/react-table";
import type { MouseEvent } from "react";

import { useState } from "react";

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Enables column sorting via header clicks. */
  sortable?: boolean;
  /** Returns child rows for tree data; enables the expanded row model. */
  getSubRows?: (row: T) => T[] | undefined;
  /** Row click handler (skipped when the click originated inside an interactive element). */
  onRowClick?: (row: T, event: MouseEvent) => void;
  emptyMessage?: string;
}

/** True when the click landed on (or inside) a button, link, input, or marked control. */
function isInteractiveTarget(el: HTMLElement | null): boolean {
  return Boolean(
    el?.closest(
      "a, button, input, select, textarea, [role=checkbox], [role=menuitem], [data-no-row-click]",
    ),
  );
}

const SORT_INDICATOR: Record<string, string> = {
  asc: " ↑",
  desc: " ↓",
};

/**
 * Generic TanStack-Table renderer over the shadcn table primitives. Powers the Table view of
 * listing pages: pass per-entity column defs, the already-filtered rows, and an optional
 * `onRowClick`. Supply `getSubRows` for tree data (Tags / Media Types) to enable expand/collapse.
 */
export function DataTable<T>({
  columns, data, sortable = false, getSubRows, onRowClick, emptyMessage,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable<T>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(sortable
      ? {
        getSortedRowModel: getSortedRowModel(),
        state: {
          sorting,
        },
        onSortingChange: setSorting,
      }
      : {}),
    ...(getSubRows
      ? {
        getSubRows,
        getExpandedRowModel: getExpandedRowModel(),
      }
      : {}),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                return (
                  <TableHead
                    key={header.id}
                    className={canSort ? "cursor-pointer select-none" : undefined}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {SORT_INDICATOR[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0
            ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-6 text-center text-muted-foreground"
                >
                  {emptyMessage ?? "Nothing to show."}
                </TableCell>
              </TableRow>
            )
            : rows.map((row: Row<T>) => (
              <TableRow
                key={row.id}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={onRowClick
                  ? (event) => {
                    if (isInteractiveTarget(event.target as HTMLElement)) return;
                    onRowClick(row.original, event);
                  }
                  : undefined}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
