/**
 * Read-only database disk-usage reporting for Advanced settings. Introspects PostgreSQL's catalog
 * (`pg_total_relation_size` per table + `pg_database_size` for the whole database) — no schema
 * changes, no migration, and nothing matchable, so it never touches the bookmark cache.
 */

import type { DatabaseTableDetail, DatabaseUsageReport } from "@eesimple/types";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/** Raw per-table row from the catalog query — node-postgres returns `bigint` columns as strings. */
interface TableUsageRow {
  table_name: string;
  total_bytes: string | number;
  row_estimate: string | number;
}

/** Raw whole-database total row. */
interface DatabaseSizeRow {
  total_bytes: string | number;
}

/** Coerce a node-postgres numeric column (often a string for `bigint`) to a finite number. */
function toNumber(value: string | number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Shape raw catalog rows into a {@link DatabaseUsageReport}. Pure (no I/O) so it can be unit-tested
 * directly: coerces the string `bigint` columns and clamps the `reltuples` estimate (`-1` before a
 * table is analyzed) up to `0`.
 */
export function mapDatabaseUsageRows(
  tableRows: readonly TableUsageRow[],
  totalRow: DatabaseSizeRow | undefined,
  capturedAt: string,
): DatabaseUsageReport {
  return {
    tables: tableRows.map(row => ({
      tableName: row.table_name,
      totalBytes: toNumber(row.total_bytes),
      rowEstimate: Math.max(0, Math.round(toNumber(row.row_estimate))),
    })),
    totalBytes: totalRow ? toNumber(totalRow.total_bytes) : 0,
    capturedAt,
  };
}

/** Snapshot how much disk space each `public` table and the whole database is using. */
export async function getDatabaseUsageReport(): Promise<DatabaseUsageReport> {
  const tableResult = await db.execute(sql`
    SELECT c.relname AS table_name,
           pg_total_relation_size(c.oid) AS total_bytes,
           c.reltuples::bigint           AS row_estimate
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY pg_total_relation_size(c.oid) DESC
  `);
  const totalResult = await db.execute(sql`
    SELECT pg_database_size(current_database()) AS total_bytes
  `);

  return mapDatabaseUsageRows(
    tableResult.rows as unknown as TableUsageRow[],
    (totalResult.rows as unknown as DatabaseSizeRow[])[0],
    new Date().toISOString(),
  );
}

/** Raw size-breakdown row for a single table. */
interface TableSizeRow {
  heap_bytes: string | number;
  index_bytes: string | number;
  total_bytes: string | number;
}

/** Raw `pg_stat_user_tables` row for a single table (absent until Postgres has gathered stats). */
interface TableStatsRow {
  n_live_tup: string | number;
  n_dead_tup: string | number;
  seq_scan: string | number;
  idx_scan: string | number;
  last_vacuum: string | null;
  last_autovacuum: string | null;
  last_analyze: string | null;
  last_autoanalyze: string | null;
}

/** Raw `information_schema.columns` row. */
interface ColumnInfoRow {
  column_name: string;
  data_type: string;
}

/** Raw per-index row. */
interface IndexUsageRow {
  index_name: string;
  bytes: string | number;
}

/** Coerce a Postgres timestamp column (already ISO-ish, or `null`) to an ISO string or `null`. */
function toIsoOrNull(value: string | Date | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/**
 * Shape raw catalog rows into a {@link DatabaseTableDetail}. Pure (no I/O) so it can be
 * unit-tested directly: coerces string `bigint` columns, clamps a negative TOAST remainder to `0`,
 * and defaults stats to `0`/`null` when `pg_stat_user_tables` has no row yet (a brand-new table).
 */
export function mapDatabaseTableDetail(
  tableName: string,
  sizeRow: TableSizeRow,
  statsRow: TableStatsRow | undefined,
  columnRows: readonly ColumnInfoRow[],
  indexRows: readonly IndexUsageRow[],
): DatabaseTableDetail {
  const heapBytes = toNumber(sizeRow.heap_bytes);
  const indexBytes = toNumber(sizeRow.index_bytes);
  const totalBytes = toNumber(sizeRow.total_bytes);
  const toastBytes = Math.max(0, totalBytes - heapBytes - indexBytes);

  return {
    tableName,
    heapBytes,
    indexBytes,
    toastBytes,
    totalBytes,
    rowEstimate: statsRow ? Math.max(0, Math.round(toNumber(statsRow.n_live_tup))) : 0,
    deadRowEstimate: statsRow ? Math.max(0, Math.round(toNumber(statsRow.n_dead_tup))) : 0,
    sequentialScans: statsRow ? Math.max(0, Math.round(toNumber(statsRow.seq_scan))) : 0,
    indexScans: statsRow ? Math.max(0, Math.round(toNumber(statsRow.idx_scan))) : 0,
    lastVacuum: statsRow ? toIsoOrNull(statsRow.last_vacuum) : null,
    lastAutoVacuum: statsRow ? toIsoOrNull(statsRow.last_autovacuum) : null,
    lastAnalyze: statsRow ? toIsoOrNull(statsRow.last_analyze) : null,
    lastAutoAnalyze: statsRow ? toIsoOrNull(statsRow.last_autoanalyze) : null,
    columns: columnRows.map(row => ({
      columnName: row.column_name,
      dataType: row.data_type,
    })),
    indexes: indexRows.map(row => ({
      indexName: row.index_name,
      bytes: toNumber(row.bytes),
    })).sort((a, b) => b.bytes - a.bytes),
  };
}

/**
 * Diagnostic detail for a single `public` table — heap/index/TOAST size breakdown, live/dead row
 * estimates, vacuum/analyze history, and per-column/per-index detail — for the Database usage
 * card's expandable row. Returns `null` when the table doesn't exist (or isn't a `public` base
 * table). Table-name filters are always passed as bind parameters, never interpolated into SQL.
 */
export async function getDatabaseTableDetail(tableName: string): Promise<DatabaseTableDetail | null> {
  const sizeResult = await db.execute(sql`
    SELECT pg_relation_size(c.oid)         AS heap_bytes,
           pg_indexes_size(c.oid)          AS index_bytes,
           pg_total_relation_size(c.oid)   AS total_bytes
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = ${tableName}
  `);
  const sizeRow = (sizeResult.rows as unknown as TableSizeRow[])[0];
  if (!sizeRow) return null;

  const statsResult = await db.execute(sql`
    SELECT n_live_tup, n_dead_tup, seq_scan, idx_scan,
           last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
    FROM pg_stat_user_tables
    WHERE schemaname = 'public' AND relname = ${tableName}
  `);
  const columnsResult = await db.execute(sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName}
    ORDER BY ordinal_position
  `);
  const indexesResult = await db.execute(sql`
    SELECT indexrelname AS index_name, pg_relation_size(indexrelid) AS bytes
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public' AND relname = ${tableName}
  `);

  return mapDatabaseTableDetail(
    tableName,
    sizeRow,
    (statsResult.rows as unknown as TableStatsRow[])[0],
    columnsResult.rows as unknown as ColumnInfoRow[],
    indexesResult.rows as unknown as IndexUsageRow[],
  );
}
