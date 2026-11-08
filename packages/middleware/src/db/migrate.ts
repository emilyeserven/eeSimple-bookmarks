/**
 * Runtime migrations — imperative, idempotent schema fix-ups that run on every boot, BEFORE the
 * gateway's `drizzle-kit push`.
 *
 * `push` is the source of truth for the schema: it diffs `schema.ts` against the live database and
 * applies every *additive* change (new tables, columns, constraints, indexes) on its own. What it
 * cannot do safely or non-interactively is the *destructive* / special cases — dropping a column or
 * table, `ALTER TYPE … ADD VALUE`, renames, data-preserving transforms — and a few additive cases
 * that make push prompt (a NEW table against a populated database, a NOT NULL column, a unique
 * constraint on existing data). Those belong here: each is a small step that transforms the
 * database so push's subsequent diff stays purely additive (so push never blocks on an interactive
 * prompt in a non-TTY deploy, and needs no `--force`).
 *
 * Every step runs on every start, so each MUST be idempotent — guard with `IF EXISTS` /
 * `IF NOT EXISTS`, check before mutating, etc. Each `db.execute()` must contain exactly ONE SQL
 * statement. Add one by pushing to `migrations`, e.g.:
 *
 *   { name: "drop legacy items.color", run: db => db.execute(sql`ALTER TABLE "items" DROP COLUMN IF EXISTS "color"`) }
 *
 * See the `db-schema-change` skill for the full decision table.
 *
 * Run via `migrate:prod` (compiled) or `migrate:dev` (tsx); the gateway runs it on boot.
 */
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const {
  Pool,
} = pg;

const connectionString
  = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/app";

interface RuntimeMigration {
  name: string;
  run: (db: NodePgDatabase) => Promise<unknown>;
}

// Ordered list of idempotent, destructive/push-incompatible steps. Empty on a fresh project.
const migrations: RuntimeMigration[] = [];

async function main(): Promise<void> {
  if (migrations.length === 0) {
    console.log("[migrate] no runtime migrations to apply");
    return;
  }

  const pool = new Pool({
    connectionString,
  });
  const db = drizzle(pool);
  try {
    for (const migration of migrations) {
      console.log(`[migrate] applying: ${migration.name}…`);
      await migration.run(db);
    }
    console.log("[migrate] runtime migrations up to date");
  }
  finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
