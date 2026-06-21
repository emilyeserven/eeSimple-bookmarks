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
    // `websites.built_in` is NOT NULL DEFAULT false. As with `custom_properties.built_in` above,
    // adding a NOT NULL column to the populated `websites` table makes drizzle-kit push prompt and
    // crash the non-TTY deploy, so pre-apply it here to keep push's diff additive-only.
    name: "add websites.built_in column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "websites"
        ADD COLUMN IF NOT EXISTS "built_in" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // `websites.shortened_links` / `param_rules` are NOT NULL jsonb DEFAULT '[]'. Adding NOT NULL
    // columns to the populated `websites` table makes drizzle-kit push prompt (non-TTY crash), so
    // pre-apply them here. One ALTER TABLE with two ADD COLUMN clauses is a single statement (safe
    // over the extended protocol). Defaults must match schema.ts exactly.
    name: "add websites.shortened_links + param_rules columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "websites"
        ADD COLUMN IF NOT EXISTS "shortened_links" jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "param_rules" jsonb NOT NULL DEFAULT '[]'::jsonb
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
    // `homepage_sections` gained NOT NULL display columns (`columns`, `image_mode`, `image_layout`).
    // Adding NOT NULL columns to the populated table makes drizzle-kit push prompt — the same
    // non-TTY crash as the cases above — so pre-apply them here. One `ALTER TABLE` statement with
    // multiple `ADD COLUMN` clauses is a single statement, safe over the extended protocol. Defaults
    // must match schema.ts: 2 columns, natural images (true), "above" layout.
    name: "add homepage_sections display columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "homepage_sections"
        ADD COLUMN IF NOT EXISTS "columns" integer NOT NULL DEFAULT 2,
        ADD COLUMN IF NOT EXISTS "image_mode" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "image_layout" text NOT NULL DEFAULT 'above'
    `),
  },
  {
    // `homepage_sections` later gained per-section listing-parity display columns
    // (`image_visibility`, `view_mode`, `hidden_card_fields`). They are NOT NULL with defaults;
    // adding NOT NULL columns to the populated table makes drizzle-kit push prompt — the same
    // non-TTY crash as above — so pre-apply them here. One `ALTER TABLE` with multiple `ADD COLUMN`
    // clauses is a single statement, safe over the extended protocol. Defaults must match schema.ts:
    // "shown" visibility, "cards" view mode, empty hidden-fields array.
    name: "add homepage_sections listing-parity display columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "homepage_sections"
        ADD COLUMN IF NOT EXISTS "image_visibility" text NOT NULL DEFAULT 'shown',
        ADD COLUMN IF NOT EXISTS "view_mode" text NOT NULL DEFAULT 'cards',
        ADD COLUMN IF NOT EXISTS "hidden_card_fields" jsonb NOT NULL DEFAULT '[]'::jsonb
    `),
  },
  {
    // `app_settings` gained homepage-content columns (homepage text + Quick Add config). They are
    // NOT NULL with defaults; adding NOT NULL columns to the populated singleton makes drizzle-kit
    // push prompt — the same non-TTY crash as the cases above — so pre-apply them here. One
    // `ALTER TABLE` with multiple `ADD COLUMN` clauses is a single statement, safe over the extended
    // protocol. Defaults must match schema.ts exactly.
    name: "add app_settings homepage-content columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "homepage_text" text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "homepage_text_width" text NOT NULL DEFAULT 'full',
        ADD COLUMN IF NOT EXISTS "bookmark_quick_add_enabled" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "bookmark_quick_add_width" text NOT NULL DEFAULT 'full',
        ADD COLUMN IF NOT EXISTS "bookmark_quick_add_display" text NOT NULL DEFAULT 'collapsible'
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
    // `app_settings.homepage_header_hidden` is NOT NULL DEFAULT false. Adding a NOT NULL column to
    // the populated singleton makes drizzle-kit push prompt — the same non-TTY crash as above — so
    // pre-apply it here to keep push's diff additive-only.
    name: "add app_settings.homepage_header_hidden column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "homepage_header_hidden" boolean NOT NULL DEFAULT false
    `),
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
  {
    // `custom_properties.allow_default` is NOT NULL DEFAULT true. Adding a NOT NULL column to the
    // populated table makes drizzle-kit push prompt — the same non-TTY crash as the cases above —
    // so pre-apply it here to keep push's diff additive-only.
    name: "add custom_properties.allow_default column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "custom_properties"
        ADD COLUMN IF NOT EXISTS "allow_default" boolean NOT NULL DEFAULT true
    `),
  },
  {
    // `custom_properties.all_media_types` is NOT NULL DEFAULT false. Adding a NOT NULL column to the
    // populated table makes drizzle-kit push prompt — the same non-TTY crash as the cases above —
    // so pre-apply it here to keep push's diff additive-only. (The `property_media_types` join table
    // and the nullable `media_types.parent_id` column are both push-safe additive and need no step.)
    name: "add custom_properties.all_media_types column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "custom_properties"
        ADD COLUMN IF NOT EXISTS "all_media_types" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // Rename the built-in "Video Length" property slug from "video-length" to "runtime". The property
    // is now named "Runtime" and applies to video and audio content. The WHERE NOT EXISTS guard makes
    // this idempotent and prevents a unique-constraint failure if a "runtime" row already exists.
    name: "rename custom_properties slug video-length to runtime",
    run: db => db.execute(sql`
      UPDATE "custom_properties" SET "slug" = 'runtime'
      WHERE "slug" = 'video-length'
        AND NOT EXISTS (SELECT 1 FROM "custom_properties" WHERE "slug" = 'runtime')
    `),
  },
  {
    // `homepage_sections.corner_overlays` gates whether image-corner custom properties are overlaid
    // on this section's cards. It is NOT NULL DEFAULT true; adding a NOT NULL column to the populated
    // table makes drizzle-kit push prompt — the same non-TTY crash as the cases above — so pre-apply
    // it here to keep push's diff additive-only. (The companion `custom_properties.card_image_corner`
    // column is nullable text and therefore push-safe — it needs no step.)
    name: "add homepage_sections.corner_overlays column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "homepage_sections"
        ADD COLUMN IF NOT EXISTS "corner_overlays" boolean NOT NULL DEFAULT true
    `),
  },
  {
    // `homepage_sections.hide_website_for_youtube` lets a section hide the website pill on cards that
    // also have a YouTube channel, so homepage cards no longer inherit this from the Default card
    // display rule. NOT NULL DEFAULT false on the populated table makes drizzle-kit push prompt — the
    // same non-TTY crash as the cases above — so pre-apply it here to keep push's diff additive-only.
    name: "add homepage_sections.hide_website_for_youtube column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "homepage_sections"
        ADD COLUMN IF NOT EXISTS "hide_website_for_youtube" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // `custom_properties` gained `show_in_gallery` / `show_in_details` for the image/file property
    // types (whether an image counts toward the Gallery/quota manifest, and whether the value renders
    // on the bookmark detail page). Both are NOT NULL DEFAULT true; adding NOT NULL columns to the
    // populated table makes drizzle-kit push prompt — the same non-TTY crash as the cases above — so
    // pre-apply them here. One `ALTER TABLE` with two `ADD COLUMN` clauses is a single statement, safe
    // over the extended protocol. Defaults must match schema.ts (both true).
    name: "add custom_properties show_in_gallery + show_in_details columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "custom_properties"
        ADD COLUMN IF NOT EXISTS "show_in_gallery" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "show_in_details" boolean NOT NULL DEFAULT true
    `),
  },
  {
    // Display Presets were removed in favor of Card Display Rules; drop the `saved_display_presets`
    // table so it doesn't linger. Destructive, so it lives here (push never drops tables). Idempotent
    // via DROP TABLE IF EXISTS.
    name: "drop saved_display_presets table",
    run: db => db.execute(sql`DROP TABLE IF EXISTS "saved_display_presets"`),
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
