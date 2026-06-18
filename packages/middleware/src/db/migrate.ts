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
 * `IF NOT EXISTS`, check before mutating, etc. See the entries in the `migrations` array below for
 * worked examples. Add one by pushing to `migrations`, e.g.:
 *
 *   import { sql } from "drizzle-orm";
 *   { name: "drop legacy websites.color", run: db => db.execute(sql`ALTER TABLE "websites" DROP COLUMN IF EXISTS "color"`) }
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
    // `autofill_rules.slug` carries a UNIQUE constraint and was added to a table that already had
    // rows. `drizzle-kit push` won't add a new column + unique constraint to a populated table
    // without an interactive truncation confirmation, so in this non-TTY deploy it silently skips
    // the change and every `slug` query 500s. Create the column and constraint here, before push,
    // so push's diff stays empty. The boot-time `ensureAutofillSlugs()` step then backfills the
    // NULL slugs.
    //
    // NOTE: each `db.execute` MUST contain a single SQL statement. drizzle/node-postgres send these
    // over the extended protocol, which executes only the FIRST statement of a multi-statement
    // string — so the column-add and the constraint-add are two separate executes (a single
    // `ALTER TABLE … ADD COLUMN …` or a single `DO $$…$$` block each count as one statement).
    name: "add autofill_rules.slug column + unique constraint",
    run: async (db) => {
      await db.execute(sql`
        ALTER TABLE IF EXISTS "autofill_rules" ADD COLUMN IF NOT EXISTS "slug" text
      `);
      await db.execute(sql`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'autofill_rules_slug_unique'
          ) THEN
            ALTER TABLE IF EXISTS "autofill_rules"
              ADD CONSTRAINT "autofill_rules_slug_unique" UNIQUE ("slug");
          END IF;
        END $$
      `);
    },
  },
  {
    // `custom_properties.built_in` is NOT NULL DEFAULT false. drizzle-kit push may prompt before
    // applying it to a populated table, which blocks non-TTY deploys and leaves the column absent.
    name: "add custom_properties.built_in column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "custom_properties"
        ADD COLUMN IF NOT EXISTS "built_in" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // `bookmarks.priority` is NOT NULL DEFAULT 0. Adding a NOT NULL column to the populated
    // `bookmarks` table makes drizzle-kit push prompt for confirmation; in this non-TTY deploy that
    // prompt crashes push (and even `--force` doesn't suppress it), leaving the whole additive diff
    // unapplied so `/api/bookmarks` 500s on the missing column. Pre-apply it so push's diff stays
    // additive-only and never prompts.
    name: "add bookmarks.priority column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "bookmarks"
        ADD COLUMN IF NOT EXISTS "priority" integer NOT NULL DEFAULT 0
    `),
  },
  {
    // `custom_properties` gained several NOT NULL boolean columns (PRs #90/#95). Each would make
    // push prompt on the populated table — the same non-TTY crash as above — so pre-apply them here.
    // This is one `ALTER TABLE` statement with multiple `ADD COLUMN` clauses (a single statement,
    // safe over the extended protocol). Defaults must match schema.ts exactly: `show_in_listings`
    // and `enabled` default to true, the rest to false.
    name: "add custom_properties form/listing/enabled boolean columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "custom_properties"
        ADD COLUMN IF NOT EXISTS "show_in_form" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "hidden_from_form" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "show_in_listings" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "all_categories" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "editable_on_card" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "enabled" boolean NOT NULL DEFAULT true
    `),
  },
  {
    // `tags_parent_name_unique` enforces sibling-name uniqueness. In schema.ts it is a
    // `uniqueIndex` (NOT a table `unique()` constraint) because drizzle-kit 0.31.10 cannot converge
    // on a COMPOSITE unique CONSTRAINT: every push tries to drop+recreate it, and on the populated
    // `tags` table the recreate fires an interactive "Do you want to truncate?" suggestion that
    // crashes the non-TTY deploy (push then exits 0, so the rest of the additive diff is silently
    // skipped — the original cause of the missing-column 500s). A unique INDEX both converges and
    // applies without that prompt. This step migrates existing prod DBs from the old CONSTRAINT to
    // the INDEX before push runs, so push's diff for `tags` stays empty. Idempotent: the DROP and
    // CREATE are both guarded by IF [NOT] EXISTS. (Two separate single-statement executes — the
    // extended protocol runs only the first statement of a multi-statement string.)
    name: "migrate tags_parent_name_unique from constraint to unique index",
    run: async (db) => {
      await db.execute(sql`ALTER TABLE IF EXISTS "tags" DROP CONSTRAINT IF EXISTS "tags_parent_name_unique"`);
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "tags_parent_name_unique" ON "tags" ("parent_id", "name")`);
    },
  },
  {
    // `tags.slug` carries a global UNIQUE constraint and was added to a table that already had rows.
    // As with `autofill_rules.slug`, `drizzle-kit push` won't add a new column + unique constraint to
    // a populated table without an interactive truncation confirmation, which crashes the non-TTY
    // deploy. Create the column and constraint here, before push, so push's diff stays empty. The
    // boot-time `backfillTagSlugs()` step then fills the NULL slugs.
    //
    // NOTE: each `db.execute` MUST contain a single SQL statement (extended protocol runs only the
    // first), so the column-add and the constraint-add are two separate executes.
    name: "add tags.slug column + unique constraint",
    run: async (db) => {
      await db.execute(sql`
        ALTER TABLE IF EXISTS "tags" ADD COLUMN IF NOT EXISTS "slug" text
      `);
      await db.execute(sql`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'tags_slug_unique'
          ) THEN
            ALTER TABLE IF EXISTS "tags"
              ADD CONSTRAINT "tags_slug_unique" UNIQUE ("slug");
          END IF;
        END $$
      `);
    },
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
