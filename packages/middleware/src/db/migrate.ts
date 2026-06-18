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
    name: "add autofill_rules.slug column + unique constraint",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "autofill_rules" ADD COLUMN IF NOT EXISTS "slug" text;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'autofill_rules_slug_unique'
        ) THEN
          ALTER TABLE IF EXISTS "autofill_rules"
            ADD CONSTRAINT "autofill_rules_slug_unique" UNIQUE ("slug");
        END IF;
      END $$;
    `),
  },
  {
    // `custom_properties.built_in` is NOT NULL DEFAULT false. drizzle-kit push may prompt before
    // applying it to a populated table, which blocks non-TTY deploys and leaves the column absent.
    name: "add custom_properties.built_in column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "custom_properties"
        ADD COLUMN IF NOT EXISTS "built_in" boolean NOT NULL DEFAULT false;
    `),
  },
  {
    // `tags_parent_name_unique` is a unique constraint on an existing populated table; drizzle-kit
    // push prompts for truncation confirmation which in non-TTY mode either wipes the table or
    // exits non-zero. Create the constraint here so push's diff stays empty on every deploy.
    name: "add tags_parent_name_unique constraint",
    run: db => db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'tags_parent_name_unique'
        ) THEN
          ALTER TABLE IF EXISTS "tags"
            ADD CONSTRAINT "tags_parent_name_unique" UNIQUE ("parent_id", "name");
        END IF;
      END $$;
    `),
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
