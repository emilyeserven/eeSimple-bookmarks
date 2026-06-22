/**
 * Read-only database disk-usage reporting for Advanced settings. Introspects PostgreSQL's catalog
 * (`pg_total_relation_size` per table + `pg_database_size` for the whole database) — no schema
 * changes, no migration, and nothing matchable, so it never touches the bookmark cache.
 */

import type { DatabaseUsageReport } from "@eesimple/types";
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
