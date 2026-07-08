/**
 * Runtime migrations — imperative, idempotent schema fix-ups that run on every boot, BEFORE the
 * gateway's `drizzle-kit push`.
 *
 * `push` is the source of truth for the schema: it diffs `schema.ts` against the live database and
 * applies every *additive* change (new tables, columns, constraints, indexes) on its own. What it
 * cannot do safely or non-interactively is the *destructive* / special cases — dropping a column or
 * table, `ALTER TYPE … ADD VALUE`, renames, or data-preserving transforms. Those belong here: each
 * is a small step that transforms the database so push's subsequent diff stays purely additive (and
 * so push never blocks on an interactive prompt in this non-TTY deploy, and needs no `--force`).
 *
 * Every step runs on every start, so each MUST be idempotent — guard with `IF EXISTS` /
 * `IF NOT EXISTS`, check before mutating, etc. Add one by pushing to `migrations`, e.g.:
 *
 *   import { sql } from "drizzle-orm";
 *   { name: "drop legacy websites.color", run: db => db.execute(sql`ALTER TABLE "websites" DROP COLUMN IF EXISTS "color"`) }
 *
 * The array is intentionally empty: the historical entries had all applied on the single production
 * deployment (issue #862), so they were pruned — a fresh database gets its whole schema from
 * `drizzle-kit push`. The mechanism stays for the next destructive/prompting change.
 *
 * Run via `migrate:prod` (compiled) or `migrate:dev` (tsx); the gateway runs it on boot.
 */
import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

const {
  Pool,
} = pg;

const connectionString
  = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/bookmarks";

interface RuntimeMigration {
  name: string;
  run: (db: NodePgDatabase) => Promise<unknown>;
}

// Ordered list of idempotent, destructive/push-incompatible steps.
const migrations: RuntimeMigration[] = [
  {
    // The per-category "Tiered Tags" root-tag allowlist was removed — all tags are available for
    // every category now. Drop the table so push's diff stays additive.
    name: "drop legacy category_root_tags",
    run: db => db.execute(sql`DROP TABLE IF EXISTS "category_root_tags"`),
  },
  {
    // `entity_layouts` (#1158) is a brand-new table. Against a populated database `drizzle-kit push`
    // treats a new table as a "truncate?" (pgSuggestions) change and, in this non-TTY deploy,
    // SILENTLY SKIPS it while still exiting 0 — so the deploy succeeds but the table never gets
    // created and every entity-layouts query 500s with `relation "entity_layouts" does not exist`
    // (the same failure mode as the podcasts/genre_moods pre-creates). Pre-create it here so push's
    // diff for it is always empty. Idempotent (`IF NOT EXISTS`). No FK columns.
    name: "create entity_layouts table",
    run: db => db.execute(sql`
      CREATE TABLE IF NOT EXISTS "entity_layouts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "entity_kind" text NOT NULL,
        "layout" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `),
  },
  {
    // `entity_layouts.entity_kind` is declared as a `uniqueIndex` (not a table `unique()`
    // constraint) in schema.ts — see the composite-unique push-prompt rule. Pre-create the index
    // here too so push's diff for it stays empty.
    name: "create entity_layouts entity_kind unique index",
    run: db => db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "entity_layouts_entity_kind_unique" ON "entity_layouts" ("entity_kind")`,
    ),
  },
];

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
