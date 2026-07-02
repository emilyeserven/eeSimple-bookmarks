import type { DatabaseTableDetail, DatabaseTableUsage } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useState } from "react";

import { RefreshCw } from "lucide-react";

import { formatSize } from "./galleryFormat";
import { useDatabaseTableDetail, useDatabaseUsage } from "../hooks/useAppSettings";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { copyText } from "@/lib/clipboard";

const DATABASE_USAGE_COLUMNS: ColumnDef<DatabaseTableUsage>[] = [
  {
    accessorKey: "tableName",
    header: "Table",
    cell: ({
      row,
    }) => <span className="font-medium">{row.original.tableName}</span>,
  },
  {
    accessorKey: "rowEstimate",
    header: () => <div className="text-right">Rows (est.)</div>,
    cell: ({
      row,
    }) => (
      <div className="text-right tabular-nums">{row.original.rowEstimate.toLocaleString()}</div>
    ),
  },
  {
    accessorKey: "totalBytes",
    header: () => <div className="text-right">Size</div>,
    cell: ({
      row,
    }) => (
      <div className="text-right tabular-nums">{formatSize(row.original.totalBytes)}</div>
    ),
  },
];

/** Formats an ISO timestamp for display, or "Never" when absent. */
function formatTimestamp(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Never";
}

/**
 * Read-only "Database usage" summary on the Advanced settings page: a per-table breakdown of
 * on-disk space (data + indexes) sorted largest-first, with an estimated row count and a
 * whole-database total. Sourced from PostgreSQL catalog introspection — display only. Clicking a
 * column header sorts the table; clicking a row opens diagnostic detail about that table.
 */
export function DatabaseUsageCard() {
  const {
    data, isLoading, isError, error, isFetching, refetch,
  } = useDatabaseUsage();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database usage</CardTitle>
        <CardDescription>
          Disk space used by each table in the PostgreSQL database (including its indexes). Row
          counts are estimates. Click a table to see diagnostic detail, or a column header to sort.
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw
              className={`
                size-4
                ${isFetching ? "animate-spin" : ""}
              `}
            />
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading
          ? <p className="text-sm text-muted-foreground">Loading…</p>
          : isError
            ? (
              <p className="text-sm text-muted-foreground">
                {`Couldn't load database usage: ${error.message}`}
              </p>
            )
            : data && (
              <div className="space-y-4">
                <div
                  className="
                    flex items-baseline justify-between gap-4 rounded-md border
                    bg-muted/40 px-4 py-3
                  "
                >
                  <span className="text-sm font-medium">Total (whole database)</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatSize(data.totalBytes)}
                  </span>
                </div>
                <DataTable
                  columns={DATABASE_USAGE_COLUMNS}
                  data={data.tables}
                  sortable
                  onRowClick={table => setSelectedTable(table.tableName)}
                />
              </div>
            )}
      </CardContent>
      <DatabaseTableDetailDialog
        tableName={selectedTable}
        onOpenChange={open => setSelectedTable(open ? selectedTable : null)}
      />
    </Card>
  );
}

interface DatabaseTableDetailDialogProps {
  tableName: string | null;
  onOpenChange: (open: boolean) => void;
}

/** Dialog showing diagnostic detail for a single table, opened by clicking a row. */
function DatabaseTableDetailDialog({
  tableName, onOpenChange,
}: DatabaseTableDetailDialogProps) {
  const {
    data: detail, isLoading, isError, error,
  } = useDatabaseTableDetail(tableName);

  return (
    <Dialog
      open={tableName !== null}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tableName}</DialogTitle>
          <DialogDescription>
            Diagnostic detail for this table — copy it to paste into an LLM when investigating why
            it&apos;s bulky.
          </DialogDescription>
        </DialogHeader>
        {isLoading
          ? <p className="text-sm text-muted-foreground">Loading…</p>
          : isError
            ? (
              <p className="text-sm text-muted-foreground">
                {`Couldn't load table detail: ${error.message}`}
              </p>
            )
            : detail && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">Heap size</span>
                  <span className="text-right tabular-nums">{formatSize(detail.heapBytes)}</span>
                  <span className="text-muted-foreground">Index size</span>
                  <span className="text-right tabular-nums">{formatSize(detail.indexBytes)}</span>
                  <span className="text-muted-foreground">TOAST size</span>
                  <span className="text-right tabular-nums">{formatSize(detail.toastBytes)}</span>
                  <span className="font-medium">Total size</span>
                  <span className="text-right font-medium tabular-nums">
                    {formatSize(detail.totalBytes)}
                  </span>
                  <span className="text-muted-foreground">Live rows (est.)</span>
                  <span className="text-right tabular-nums">
                    {detail.rowEstimate.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">Dead rows (est.)</span>
                  <span className="text-right tabular-nums">
                    {detail.deadRowEstimate.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">Sequential scans</span>
                  <span className="text-right tabular-nums">
                    {detail.sequentialScans.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">Index scans</span>
                  <span className="text-right tabular-nums">
                    {detail.indexScans.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">Last vacuum</span>
                  <span className="text-right">{formatTimestamp(detail.lastVacuum)}</span>
                  <span className="text-muted-foreground">Last autovacuum</span>
                  <span className="text-right">{formatTimestamp(detail.lastAutoVacuum)}</span>
                  <span className="text-muted-foreground">Last analyze</span>
                  <span className="text-right">{formatTimestamp(detail.lastAnalyze)}</span>
                  <span className="text-muted-foreground">Last autoanalyze</span>
                  <span className="text-right">{formatTimestamp(detail.lastAutoAnalyze)}</span>
                </div>
                <div>
                  <p className="mb-1 font-medium">Indexes</p>
                  <ul className="space-y-0.5">
                    {detail.indexes.map(index => (
                      <li
                        key={index.indexName}
                        className="flex justify-between gap-4"
                      >
                        <span className="text-muted-foreground">{index.indexName}</span>
                        <span className="tabular-nums">{formatSize(index.bytes)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium">Columns</p>
                  <ul className="space-y-0.5">
                    {detail.columns.map(column => (
                      <li
                        key={column.columnName}
                        className="flex justify-between gap-4"
                      >
                        <span className="text-muted-foreground">{column.columnName}</span>
                        <span>{column.dataType}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void copyText(formatDetailForClipboard(tableName as string, detail))}
                >
                  Copy details
                </Button>
              </div>
            )}
      </DialogContent>
    </Dialog>
  );
}

/** Plain-text summary of a table's diagnostic detail, formatted for pasting into an LLM. */
function formatDetailForClipboard(tableName: string, detail: DatabaseTableDetail): string {
  const lines = [
    `Table: ${tableName}`,
    `Heap size: ${formatSize(detail.heapBytes)}`,
    `Index size: ${formatSize(detail.indexBytes)}`,
    `TOAST size: ${formatSize(detail.toastBytes)}`,
    `Total size: ${formatSize(detail.totalBytes)}`,
    `Live rows (est.): ${detail.rowEstimate.toLocaleString()}`,
    `Dead rows (est.): ${detail.deadRowEstimate.toLocaleString()}`,
    `Sequential scans: ${detail.sequentialScans.toLocaleString()}`,
    `Index scans: ${detail.indexScans.toLocaleString()}`,
    `Last vacuum: ${formatTimestamp(detail.lastVacuum)}`,
    `Last autovacuum: ${formatTimestamp(detail.lastAutoVacuum)}`,
    `Last analyze: ${formatTimestamp(detail.lastAnalyze)}`,
    `Last autoanalyze: ${formatTimestamp(detail.lastAutoAnalyze)}`,
    "Indexes:",
    ...detail.indexes.map(index => `  ${index.indexName}: ${formatSize(index.bytes)}`),
    "Columns:",
    ...detail.columns.map(column => `  ${column.columnName}: ${column.dataType}`),
  ];
  return lines.join("\n");
}
