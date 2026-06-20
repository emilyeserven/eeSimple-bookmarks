import type {
  ColumnDef,
  ColumnSizingState,
  Row,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import type { MouseEvent } from "react";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** When true the column has no inline width and expands to fill remaining table space. */
    fill?: boolean;
  }
}

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
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Enables column sorting via header clicks. */
  sortable?: boolean;
  /** Enables drag-to-resize column handles. */
  resizable?: boolean;
  /** Controlled column sizing state (for persistence); falls back to local state when omitted. */
  columnSizing?: ColumnSizingState;
  /** Called with the resolved new sizing state whenever column widths change. */
  onColumnSizingChange?: (widths: ColumnSizingState) => void;
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
 * Pass `resizable` to enable drag-to-resize handles; pair with `columnSizing` /
 * `onColumnSizingChange` to persist widths externally.
 */
export function DataTable<T>({
  columns,
  data,
  sortable = false,
  resizable = false,
  columnSizing: externalColumnSizing,
  onColumnSizingChange: externalOnColumnSizingChange,
  getSubRows,
  onRowClick,
  emptyMessage,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [localColumnSizing, setLocalColumnSizing] = useState<ColumnSizingState>({});

  const columnSizing = externalColumnSizing ?? localColumnSizing;

  function handleColumnSizingChange(updater: Updater<ColumnSizingState>) {
    const next = typeof updater === "function" ? updater(columnSizing) : updater;
    if (externalOnColumnSizingChange) {
      externalOnColumnSizingChange(next);
    }
    else {
      setLocalColumnSizing(next);
    }
  }

  const table = useReactTable<T>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(resizable
      ? {
        columnResizeMode: "onChange" as const,
      }
      : {}),
    ...(sortable
      ? {
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
      }
      : {}),
    ...(resizable
      ? {
        onColumnSizingChange: handleColumnSizingChange,
      }
      : {}),
    ...(getSubRows
      ? {
        getSubRows,
        getExpandedRowModel: getExpandedRowModel(),
      }
      : {}),
    state: {
      ...(sortable
        ? {
          sorting,
        }
        : {}),
      ...(resizable
        ? {
          columnSizing,
        }
        : {}),
    },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const canResize = resizable && header.column.getCanResize();
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      resizable && "relative",
                      canSort && "cursor-pointer select-none",
                    ) || undefined}
                    style={resizable && !header.column.columnDef.meta?.fill
                      ? {
                        width: header.getSize(),
                      }
                      : resizable && header.column.columnDef.meta?.fill
                        ? {
                          minWidth: header.column.columnDef.minSize,
                        }
                        : undefined}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {SORT_INDICATOR[header.column.getIsSorted() as string] ?? null}
                    {canResize && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="
                          absolute top-0 right-0 h-full w-1 cursor-col-resize
                          touch-none bg-border opacity-0 select-none
                          hover:opacity-100
                          active:opacity-100
                        "
                      />
                    )}
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
                  <TableCell
                    key={cell.id}
                    style={resizable && !cell.column.columnDef.meta?.fill
                      ? {
                        width: cell.column.getSize(),
                      }
                      : resizable && cell.column.columnDef.meta?.fill
                        ? {
                          minWidth: cell.column.columnDef.minSize,
                        }
                        : undefined}
                  >
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
