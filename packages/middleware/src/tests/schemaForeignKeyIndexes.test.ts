import assert from "node:assert/strict";
import { test } from "node:test";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as schema from "@/db/schema";

// Postgres indexes the *referenced* side of a foreign key (it must be a PK/unique) but NOT the
// *referencing* column. Without one, "all bookmarks in category X" and every ON DELETE
// CASCADE / SET NULL from the parent scan the whole child table. A junction's composite primary
// key only covers lookups by its FIRST column, so the reverse direction needs its own index too.
//
// This guard fails when a foreign-key column is not the leading column of some PK, unique
// constraint, or index on its table. Fix it by adding `index("<table>_<column>_idx").on(...)` to
// the table in `schema.ts` (a new index is push-safe — see the `db-schema-change` skill).

// Single-row tables, where a scan is already one row.
const EXEMPT_TABLES = new Set(["app_settings"]);

test("every foreign-key column leads a PK, unique constraint, or index", () => {
  const missing: string[] = [];
  for (const value of Object.values(schema)) {
    if (!(value instanceof PgTable)) continue;
    const config = getTableConfig(value);
    if (EXEMPT_TABLES.has(config.name)) continue;

    const leading = new Set<string>();
    for (const column of config.columns) {
      if (column.primary || column.isUnique) leading.add(column.name);
    }
    for (const pk of config.primaryKeys) leading.add(pk.columns[0].name);
    for (const unique of config.uniqueConstraints) leading.add(unique.columns[0].name);
    for (const index of config.indexes) {
      const first = index.config.columns[0] as { name?: string };
      if (first.name) leading.add(first.name);
    }

    for (const fk of config.foreignKeys) {
      const column = fk.reference().columns[0].name;
      if (!leading.has(column)) missing.push(`${config.name}.${column}`);
    }
  }
  assert.deepEqual(missing, [], `Unindexed foreign-key columns: ${missing.join(", ")}`);
});
