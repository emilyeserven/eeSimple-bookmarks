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

/** A boolean custom property's legacy per-card display flags (pre-`field_zones` migration). */
interface BooleanDisplayFlags {
  show_if_false: boolean | null;
  hide_label: boolean | null;
  clickable_in_view: boolean | null;
  show_label_colon: boolean | null;
  show_value_before_label: boolean | null;
}

/** A boolean custom_properties row carrying its id alongside its legacy display flags. */
interface BooleanPropRow extends BooleanDisplayFlags {
  id: string;
}

/** Copy a property's legacy boolean flags onto one card-display placement (only non-default values). */
function mergePlacementBooleanFlags(
  placement: Record<string, unknown>,
  flags: BooleanDisplayFlags,
): void {
  // Only write non-default values to keep the jsonb lean (absent = default).
  if (flags.show_if_false) placement.showIfFalse = true;
  if (flags.hide_label) placement.hideLabel = true;
  if (flags.clickable_in_view) placement.clickableInView = true;
  if (flags.show_label_colon === false) placement.showLabelColon = false;
  if (flags.show_value_before_label) placement.showValueBeforeLabel = true;
}

/**
 * Merge each boolean property's legacy flags into a single rule's `field_zones` placements, mutating
 * `zones` in place. Returns whether any placement was touched (so the caller can skip an UPDATE).
 */
function applyBooleanFlagsToRuleZones(
  zones: Record<string, Record<string, unknown>[]>,
  flagsById: Map<string, BooleanDisplayFlags>,
): boolean {
  let changed = false;
  for (const placements of Object.values(zones)) {
    if (!Array.isArray(placements)) continue;
    for (const placement of placements) {
      const flags = flagsById.get(placement.key as string);
      if (!flags) continue;
      mergePlacementBooleanFlags(placement, flags);
      changed = true;
    }
  }
  return changed;
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
    // `card_display_rules.slug` carries a UNIQUE constraint added to a table that already has rows
    // (at least the seeded Default rule). Same reasoning as `autofill_rules.slug` above: add the
    // column + constraint here before push so push's diff stays empty, then the boot-time
    // `backfillCardDisplayRuleSlugs()` step fills the NULL slugs. Each execute is one statement.
    name: "add card_display_rules.slug column + unique constraint",
    run: async (db) => {
      await db.execute(sql`
        ALTER TABLE IF EXISTS "card_display_rules" ADD COLUMN IF NOT EXISTS "slug" text
      `);
      await db.execute(sql`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'card_display_rules_slug_unique'
          ) THEN
            ALTER TABLE IF EXISTS "card_display_rules"
              ADD CONSTRAINT "card_display_rules_slug_unique" UNIQUE ("slug");
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
    // `app_settings.homepage_text_enabled` is NOT NULL DEFAULT true. Adding a NOT NULL column to the
    // populated singleton makes drizzle-kit push prompt — the same non-TTY crash as above — so
    // pre-apply it here to keep push's diff additive-only. Default must match schema.ts (true) so
    // existing installs with homepage text keep showing it.
    name: "add app_settings.homepage_text_enabled column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "homepage_text_enabled" boolean NOT NULL DEFAULT true
    `),
  },
  {
    // `app_settings` gained the opt-in Advanced sidebar-link columns (Coolify link + URL, docs link,
    // Storybook link), moved off per-device local storage so the choices persist server-side. They
    // are NOT NULL with defaults; adding NOT NULL columns to the populated singleton makes
    // drizzle-kit push prompt — the same non-TTY crash as the cases above — so pre-apply them here.
    // One `ALTER TABLE` with multiple `ADD COLUMN` clauses is a single statement, safe over the
    // extended protocol. Defaults must match schema.ts exactly.
    name: "add app_settings advanced sidebar-link columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "coolify_link_enabled" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "coolify_url" text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "docs_link_enabled" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "storybook_link_enabled" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // `app_settings` gained the Drizzle Gateway sidebar-link columns, following the same pattern as
    // the Coolify pair. They are NOT NULL with defaults; pre-apply here to avoid the drizzle-kit
    // push non-TTY prompt. One `ALTER TABLE` with two `ADD COLUMN` clauses is one SQL statement.
    name: "add app_settings drizzle-gateway sidebar-link columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "drizzle_gateway_link_enabled" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "drizzle_gateway_url" text NOT NULL DEFAULT ''
    `),
  },
  {
    // `app_settings` gained the sidebar-customization columns (group A of issue #410): the hidden
    // category/taxonomy/customization/management item lists + hidden sidebar groups, moved off
    // per-device local storage so the customized sidebar persists server-side. NOT NULL jsonb arrays
    // default to '[]'; adding NOT NULL columns to the populated singleton makes drizzle-kit push
    // prompt (non-TTY crash), so pre-apply them here. Defaults must match schema.ts exactly.
    name: "add app_settings sidebar-customization columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "hidden_category_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "hidden_taxonomy_items" jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "hidden_customization_items" jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "hidden_management_items" jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "hidden_sidebar_groups" jsonb NOT NULL DEFAULT '[]'::jsonb
    `),
  },
  {
    // `app_settings` gained the automation/behavior columns (group B of issue #410): auto-fetch
    // title/image + the open-in-drawer modifier, moved off per-device local storage. NOT NULL with
    // defaults matching schema.ts (auto-fetch on by default, modifier "alt"); pre-apply to keep
    // push's diff additive-only.
    name: "add app_settings automation columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "auto_fetch_title" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "auto_fetch_image" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "sidebar_open_modifier" text NOT NULL DEFAULT 'alt'
    `),
  },
  {
    // `app_settings` gained the display/detail-preference columns (group C of issue #410): bookmark
    // detail media sizing/layout, filter placement, right-panel pin behavior, and the built-in
    // "Cropped" aspect ratio, moved off per-device local storage. NOT NULL with defaults matching
    // schema.ts; pre-apply to keep push's diff additive-only.
    name: "add app_settings display-preference columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "bookmark_detail_image_size" text NOT NULL DEFAULT 'medium',
        ADD COLUMN IF NOT EXISTS "bookmark_detail_video_size" text NOT NULL DEFAULT 'standard',
        ADD COLUMN IF NOT EXISTS "bookmark_detail_layout" text NOT NULL DEFAULT 'single',
        ADD COLUMN IF NOT EXISTS "filters_in_drawer" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "filters_hidden" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "panel_pinned" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "drawer_unpinned_breakpoints" jsonb NOT NULL DEFAULT '[768]'::jsonb,
        ADD COLUMN IF NOT EXISTS "cropped_width" integer NOT NULL DEFAULT 16,
        ADD COLUMN IF NOT EXISTS "cropped_height" integer NOT NULL DEFAULT 9
    `),
  },
  {
    // Display Presets were removed in favor of Card Display Rules; drop the `saved_display_presets`
    // table so it doesn't linger. Destructive, so it lives here (push never drops tables). Idempotent
    // via DROP TABLE IF EXISTS.
    name: "drop saved_display_presets table",
    run: db => db.execute(sql`DROP TABLE IF EXISTS "saved_display_presets"`),
  },
  {
    // The five per-card boolean display knobs (`show_if_false`, `hide_label`, `clickable_in_view`,
    // `show_label_colon`, `show_value_before_label`) moved off `custom_properties` onto the Card
    // Display Rule field placements (`CardFieldPlacement`). Before dropping the columns (next step),
    // carry each boolean property's stored settings into every rule's `field_zones` placement for that
    // property, so existing per-property config is preserved as the per-field placement value. Runs in
    // JS (jsonb manipulation), guarded to fire only WHILE the old columns still exist, so it is
    // idempotent and one-shot (the drop step then makes the guard false forever after).
    name: "migrate custom_properties boolean display knobs into card_display_rules.field_zones",
    run: async (db) => {
      const colCheck = await db.execute(sql`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'custom_properties' AND column_name = 'show_if_false'
      `);
      if (colCheck.rows.length === 0) return;

      const propRows = (await db.execute(sql`
        SELECT id, show_if_false, hide_label, clickable_in_view, show_label_colon, show_value_before_label
        FROM custom_properties WHERE type = 'boolean'
      `)).rows as unknown as BooleanPropRow[];
      const flagsById = new Map<string, BooleanDisplayFlags>(propRows.map(row => [row.id, row]));
      if (flagsById.size === 0) return;

      const ruleRows = (await db.execute(sql`
        SELECT id, field_zones FROM card_display_rules WHERE field_zones IS NOT NULL
      `)).rows as { id: string;
        field_zones: Record<string, Record<string, unknown>[]> | null; }[];

      for (const rule of ruleRows) {
        const zones = rule.field_zones;
        if (!zones) continue;
        if (applyBooleanFlagsToRuleZones(zones, flagsById)) {
          await db.execute(sql`
            UPDATE card_display_rules SET field_zones = ${JSON.stringify(zones)}::jsonb WHERE id = ${rule.id}
          `);
        }
      }
    },
  },
  {
    // …then drop the five now-migrated `custom_properties` boolean display columns. Destructive, so it
    // lives here (push never drops columns non-interactively). One `ALTER TABLE` with multiple
    // `DROP COLUMN IF EXISTS` clauses is a single statement, safe over the extended protocol.
    name: "drop custom_properties per-card boolean display columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "custom_properties"
        DROP COLUMN IF EXISTS "show_if_false",
        DROP COLUMN IF EXISTS "hide_label",
        DROP COLUMN IF EXISTS "clickable_in_view",
        DROP COLUMN IF EXISTS "show_label_colon",
        DROP COLUMN IF EXISTS "show_value_before_label"
    `),
  },
  {
    // `bookmark_relationships` was reshaped from an untyped, composite-PK edge table
    // (`bookmark_a_id`, `bookmark_b_id`) into a typed one (surrogate `id` PK, `relationship_type_id`,
    // `label`, new unique index). push can't converge that PK/column change non-interactively, so
    // drop the OLD-shaped table here and let push recreate the new shape from schema.ts. The guard
    // makes this idempotent and one-shot: it fires only while the table exists WITHOUT the new
    // `relationship_type_id` column, so once push recreates it the step is a no-op forever after
    // (it never wipes the recreated typed table). One `DO $$…$$` block = a single statement.
    name: "reshape bookmark_relationships to typed edges",
    run: db => db.execute(sql`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'bookmark_relationships'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'bookmark_relationships' AND column_name = 'relationship_type_id'
        ) THEN
          DROP TABLE "bookmark_relationships";
        END IF;
      END $$
    `),
  },
  {
    // The "newsletter scan blacklist" was generalized into the "Imports Blacklist": the column was
    // renamed `newsletter_blacklist` → `import_blacklist`. Existing installs carry the old column with
    // data, so RENAME it (preserving entries) before push sees the renamed schema; fresh installs (or
    // ones that never had the blacklist) get it ADDed. It is NOT NULL jsonb DEFAULT '[]', which would
    // make push prompt on the populated singleton (non-TTY crash), so pre-apply here either way. Both
    // executes are single statements and idempotently guarded. Default must match schema.ts exactly.
    name: "rename/add app_settings.import_blacklist column",
    run: async (db) => {
      await db.execute(sql`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'app_settings' AND column_name = 'newsletter_blacklist'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'app_settings' AND column_name = 'import_blacklist'
          ) THEN
            ALTER TABLE "app_settings" RENAME COLUMN "newsletter_blacklist" TO "import_blacklist";
          END IF;
        END $$
      `);
      await db.execute(sql`
        ALTER TABLE IF EXISTS "app_settings"
          ADD COLUMN IF NOT EXISTS "import_blacklist" jsonb NOT NULL DEFAULT '[]'::jsonb
      `);
    },
  },
  {
    // Newsletter Imports were generalized into "Imports": rename the staging tables
    // `newsletter_imports` → `imports` and `newsletter_import_items` → `import_items`, preserving all
    // rows. Renames are destructive/push-incompatible (push can't converge them non-interactively), so
    // do them here before push. Guarded by `to_regclass` so each fires only when the old table exists
    // and the new one doesn't — a no-op once renamed and on fresh installs (push creates the new names
    // directly). One `DO $$…$$` block = a single statement. Postgres keeps each table's rows, indexes,
    // and FK *targets* across a table rename; push then reconciles the auto-generated FK constraint
    // *names* additively (an FK drop+recreate, which never prompts and preserves data).
    name: "rename newsletter_imports table to imports",
    run: db => db.execute(sql`
      DO $$ BEGIN
        IF to_regclass('public.newsletter_imports') IS NOT NULL
           AND to_regclass('public.imports') IS NULL THEN
          ALTER TABLE "newsletter_imports" RENAME TO "imports";
        END IF;
      END $$
    `),
  },
  {
    name: "rename newsletter_import_items table to import_items",
    run: db => db.execute(sql`
      DO $$ BEGIN
        IF to_regclass('public.newsletter_import_items') IS NOT NULL
           AND to_regclass('public.import_items') IS NULL THEN
          ALTER TABLE "newsletter_import_items" RENAME TO "import_items";
        END IF;
      END $$
    `),
  },
  {
    // `import_items.marked_for_deletion` flags an item whose bookmark has been created (or that was
    // blocked) so the Import Settings purge can sweep it. NOT NULL DEFAULT false would make push prompt
    // on a populated table, so pre-apply here. Runs after the table rename above so `import_items`
    // exists; on fresh installs the table doesn't exist yet (IF EXISTS skips) and push creates it with
    // the column from schema.ts.
    name: "add import_items.marked_for_deletion column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "import_items"
        ADD COLUMN IF NOT EXISTS "marked_for_deletion" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // Rename the bookmarks FK column `newsletter_import_id` → `import_id` (the import a bookmark was
    // created from), preserving values. Guarded so it fires only on existing installs that still carry
    // the old column; fresh installs get `import_id` from push. push reconciles the FK constraint name
    // additively afterward.
    name: "rename bookmarks.newsletter_import_id column to import_id",
    run: db => db.execute(sql`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'bookmarks' AND column_name = 'newsletter_import_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'bookmarks' AND column_name = 'import_id'
        ) THEN
          ALTER TABLE "bookmarks" RENAME COLUMN "newsletter_import_id" TO "import_id";
        END IF;
      END $$
    `),
  },
  {
    // `app_settings.redirect_ignore_list` stores domains whose redirect chains should never be
    // followed. It is NOT NULL jsonb DEFAULT '[]'; adding a NOT NULL column to the populated
    // singleton makes drizzle-kit push prompt (non-TTY crash), so pre-apply it here. Default must
    // match schema.ts exactly.
    name: "add app_settings.redirect_ignore_list column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "redirect_ignore_list" jsonb NOT NULL DEFAULT '[]'::jsonb
    `),
  },
  {
    // `bookmark_choices_values` has a NOT NULL `values` column. Adding a new table with NOT NULL
    // columns that references an already-populated table makes drizzle-kit push prompt ("do you want
    // to truncate?"), which crashes the non-TTY deploy. Pre-create the table here with
    // CREATE TABLE IF NOT EXISTS so push's diff for this table is always empty.
    name: "create bookmark_choices_values table",
    run: db => db.execute(sql`
      CREATE TABLE IF NOT EXISTS "bookmark_choices_values" (
        "bookmark_id" uuid NOT NULL REFERENCES "bookmarks"("id") ON DELETE CASCADE,
        "property_id" uuid NOT NULL REFERENCES "custom_properties"("id") ON DELETE CASCADE,
        "values" jsonb NOT NULL,
        PRIMARY KEY ("bookmark_id", "property_id")
      )
    `),
  },
  {
    name: "bookmarks-url-nullable",
    async run(db) {
      // Make the url column nullable so offline (title-only) bookmarks can be created without a URL.
      await db.execute(sql`ALTER TABLE bookmarks ALTER COLUMN url DROP NOT NULL`);
    },
  },
  {
    // `authors.social_links` is NOT NULL DEFAULT '[]'::jsonb. Adding a NOT NULL column to a
    // populated table makes drizzle-kit push prompt non-interactively (crash). Pre-apply here.
    name: "add authors.social_links column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "authors"
        ADD COLUMN IF NOT EXISTS "social_links" jsonb NOT NULL DEFAULT '[]'::jsonb
    `),
  },
  {
    // `publishers.social_links` — same reason as authors.social_links above.
    name: "add publishers.social_links column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "publishers"
        ADD COLUMN IF NOT EXISTS "social_links" jsonb NOT NULL DEFAULT '[]'::jsonb
    `),
  },
  {
    // `websites.social_links` — same reason as authors.social_links above.
    name: "add websites.social_links column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "websites"
        ADD COLUMN IF NOT EXISTS "social_links" jsonb NOT NULL DEFAULT '[]'::jsonb
    `),
  },
  {
    // `app_settings.ai_summarization_prompt` stores the user's AI summarization prompt. NOT NULL
    // DEFAULT '' on the populated singleton makes drizzle-kit push prompt (non-TTY crash), so
    // pre-apply it here to keep push's diff additive-only.
    name: "add app_settings.ai_summarization_prompt column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "ai_summarization_prompt" text NOT NULL DEFAULT ''
    `),
  },
  {
    // `websites.redirect_resolution_failure` flags sites whose redirect chains resolve unreliably.
    // NOT NULL DEFAULT false on the populated `websites` table makes drizzle-kit push prompt (the
    // same non-TTY crash as the other NOT NULL column cases above), so pre-apply it here to keep
    // push's diff additive-only.
    name: "add websites.redirect_resolution_failure column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "websites"
        ADD COLUMN IF NOT EXISTS "redirect_resolution_failure" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // `saved_filters.viewable_online` flags filters surfaced as quick-access shortcuts in the app
    // sidebar (handy in the installed PWA). NOT NULL DEFAULT false on the populated `saved_filters`
    // table makes drizzle-kit push prompt (the same non-TTY crash as the other NOT NULL column cases
    // above), so pre-apply it here to keep push's diff additive-only.
    name: "add saved_filters.viewable_online column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "saved_filters"
        ADD COLUMN IF NOT EXISTS "viewable_online" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // `tags.editable_on_card` opts a tag into the bookmark card "More" menu quick-toggle. NOT NULL
    // DEFAULT false on the populated `tags` table makes drizzle-kit push prompt (the same non-TTY
    // crash as the other NOT NULL column cases above), so pre-apply it here to keep push's diff
    // additive-only.
    name: "add tags.editable_on_card column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "tags"
        ADD COLUMN IF NOT EXISTS "editable_on_card" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // `bookmarks.newsletter_context` is removed: the newsletter passage is now written into
    // `description` on inbox approval instead of being stored as a separate field. Preserve data for
    // existing rows: copy `newsletter_context` → `description` where description is still NULL, then
    // drop the now-redundant column. Both executes are single statements and idempotently guarded so
    // re-running on every boot is a no-op once the column is gone: the copy is wrapped in a
    // column-exists check (a bare `UPDATE … SET description = newsletter_context` would raise 42703
    // "column does not exist" on the second boot / on a fresh DB where push never created it, since
    // migrate runs before push), and the DROP uses IF EXISTS.
    name: "migrate bookmarks.newsletter_context into description, then drop column",
    run: async (db) => {
      await db.execute(sql`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'bookmarks' AND column_name = 'newsletter_context'
          ) THEN
            UPDATE "bookmarks"
            SET "description" = "newsletter_context"
            WHERE "newsletter_context" IS NOT NULL AND "description" IS NULL;
          END IF;
        END $$;
      `);
      await db.execute(sql`
        ALTER TABLE IF EXISTS "bookmarks" DROP COLUMN IF EXISTS "newsletter_context"
      `);
    },
  },
  {
    // `app_settings.auto_apply_title_tags` toggles the "auto-tag from title" automation. NOT NULL
    // DEFAULT false on the populated singleton makes drizzle-kit push prompt (the same non-TTY crash
    // as the other NOT NULL column cases above), so pre-apply it here to keep push's diff
    // additive-only.
    name: "add app_settings.auto_apply_title_tags column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "auto_apply_title_tags" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // `custom_properties.editable_via_cmdk` opts a property into the CMD+K command palette. NOT NULL
    // DEFAULT false on the populated table makes drizzle-kit push prompt, so pre-apply it here.
    name: "add custom_properties.editable_via_cmdk column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "custom_properties"
        ADD COLUMN IF NOT EXISTS "editable_via_cmdk" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // `tags.exclude_from_backfill` prevents a tag from being applied by any autofill backfill
    // operation. NOT NULL DEFAULT false on the populated `tags` table makes drizzle-kit push prompt
    // (the same non-TTY crash as the other NOT NULL column cases above), so pre-apply it here to keep
    // push's diff additive-only.
    name: "add tags.exclude_from_backfill column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "tags"
        ADD COLUMN IF NOT EXISTS "exclude_from_backfill" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // `saved_filters.slug` carries a UNIQUE constraint and was added to a table that may already have
    // rows. `drizzle-kit push` won't add a new column + unique constraint to a populated table without
    // an interactive truncation confirmation, so pre-apply the column and constraint here. The
    // boot-time `backfillSavedFilterSlugs()` step fills the NULL slugs.
    //
    // NOTE: each `db.execute` MUST contain a single SQL statement (the extended protocol runs only the
    // first of a multi-statement string).
    // `app_settings.github_link_enabled` toggles the GitHub repo link in the sidebar. NOT NULL
    // DEFAULT false on the populated singleton makes drizzle-kit push prompt (the same non-TTY crash
    // as the other NOT NULL column cases above), so pre-apply it here to keep push's diff additive-only.
    name: "add app_settings.github_link_enabled column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "github_link_enabled" boolean NOT NULL DEFAULT false
    `),
  },
  {
    // `app_settings` gained the romanized display-preference columns (`show_romanized_by_default`,
    // `sort_by_romanized`). NOT NULL with defaults matching schema.ts (false / true) on the populated
    // singleton makes drizzle-kit push prompt (the same non-TTY crash as the other NOT NULL column
    // cases above), so pre-apply them here to keep push's diff additive-only. One `ALTER TABLE` with
    // two `ADD COLUMN` clauses is a single statement, safe over the extended protocol. (The companion
    // nullable `tags.romanized_name` and `bookmarks.romanized_title` text columns are push-safe and
    // need no step.)
    name: "add app_settings romanized display-preference columns",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings"
        ADD COLUMN IF NOT EXISTS "show_romanized_by_default" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "sort_by_romanized" boolean NOT NULL DEFAULT true
    `),
  },
  {
    name: "add saved_filters.slug column + unique constraint",
    run: async (db) => {
      await db.execute(sql`
        ALTER TABLE IF EXISTS "saved_filters" ADD COLUMN IF NOT EXISTS "slug" text
      `);
      await db.execute(sql`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'saved_filters_slug_unique'
          ) THEN
            ALTER TABLE IF EXISTS "saved_filters"
              ADD CONSTRAINT "saved_filters_slug_unique" UNIQUE ("slug");
          END IF;
        END $$
      `);
    },
  },
  {
    // `bookmark_images` moved from 0..1 (PK on `bookmark_id`) to 0..N (surrogate `id` PK + `is_main` /
    // `sort_order`). The PK swap is DESTRUCTIVE — drizzle-kit push would drop+recreate the populated
    // table and crash this non-TTY deploy — and the NOT NULL `is_main`/`sort_order` columns prompt
    // push too. Pre-apply everything here, idempotently, so push's subsequent diff stays additive
    // (it only adds the new `bookmark_images_bookmark_id_idx` index, which never prompts).
    //
    // On a fresh DB the table doesn't exist yet (push creates it AFTER migrate), so every step is
    // guarded with `IF EXISTS` / `to_regclass` and simply no-ops; push then builds the final shape.
    // Each `db.execute` is a single statement (extended-protocol safe).
    name: "migrate bookmark_images to one-to-many (id PK + is_main/sort_order)",
    run: async (db) => {
      // 1. Surrogate id — existing rows each get a distinct uuid from the volatile default.
      await db.execute(sql`
        ALTER TABLE IF EXISTS "bookmark_images" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid()
      `);
      // 2. The 1:N marker columns (one ALTER, two clauses = one statement). Defaults match schema.ts.
      await db.execute(sql`
        ALTER TABLE IF EXISTS "bookmark_images"
          ADD COLUMN IF NOT EXISTS "is_main" boolean NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0
      `);
      // 3. Swap the PK from `bookmark_id` to `id` — only when the legacy PK is still on `bookmark_id`.
      //    The FK and NOT NULL on `bookmark_id` are independent and survive the PK drop.
      await db.execute(sql`
        DO $$
        DECLARE
          pk_name text;
          pk_is_bookmark_id boolean;
        BEGIN
          IF to_regclass('bookmark_images') IS NULL THEN
            RETURN;
          END IF;
          SELECT conname INTO pk_name
          FROM pg_constraint
          WHERE conrelid = 'bookmark_images'::regclass AND contype = 'p'
          LIMIT 1;
          IF pk_name IS NULL THEN
            RETURN;
          END IF;
          SELECT EXISTS (
            SELECT 1
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = 'bookmark_images'::regclass AND i.indisprimary
              AND a.attname = 'bookmark_id'
          ) INTO pk_is_bookmark_id;
          IF pk_is_bookmark_id THEN
            EXECUTE 'ALTER TABLE "bookmark_images" DROP CONSTRAINT ' || quote_ident(pk_name);
            ALTER TABLE "bookmark_images" ADD PRIMARY KEY ("id");
          END IF;
        END $$
      `);
      // 4. Backfill: mark each bookmark's oldest image as main, but ONLY when it has no main yet — so
      //    legacy single-image rows become main and re-runs never clobber a real multi-image main.
      await db.execute(sql`
        DO $$ BEGIN
          IF to_regclass('bookmark_images') IS NULL THEN
            RETURN;
          END IF;
          UPDATE "bookmark_images" b
          SET "is_main" = true
          WHERE b."is_main" = false
            AND NOT EXISTS (
              SELECT 1 FROM "bookmark_images" m
              WHERE m."bookmark_id" = b."bookmark_id" AND m."is_main" = true
            )
            AND b."id" = (
              SELECT x."id" FROM "bookmark_images" x
              WHERE x."bookmark_id" = b."bookmark_id"
              ORDER BY x."created_at" ASC, x."id" ASC
              LIMIT 1
            );
        END $$
      `);
    },
  },
  {
    // The `show_location_ancestors_on_map` display preference was removed — a location's map now
    // always plots its ancestor chain, so the toggle is gone. Dropping the column is destructive, so
    // do it here (before push) to keep push's diff additive and avoid an interactive drop prompt in
    // the non-TTY deploy. Idempotent via IF EXISTS.
    name: "drop legacy app_settings.show_location_ancestors_on_map",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings" DROP COLUMN IF EXISTS "show_location_ancestors_on_map"
    `),
  },
  {
    // The single global `bookmark_map_level_mode` display preference was removed — a bookmark's
    // locations map now resolves each tagged location's "Show" default from its own level group's
    // `levelMode` (already stored per group in `place_type_level_groups`), independently per anchor,
    // instead of one shared setting for every group. Dropping the column is destructive, so do it
    // here (before push) to keep push's diff additive and avoid an interactive drop prompt in the
    // non-TTY deploy. Idempotent via IF EXISTS.
    name: "drop legacy app_settings.bookmark_map_level_mode",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "app_settings" DROP COLUMN IF EXISTS "bookmark_map_level_mode"
    `),
  },
  {
    // The "Authors" taxonomy was renamed to "People". Renaming a table is destructive to push
    // (it would DROP the old + CREATE the new, losing rows), so rename the live tables here first —
    // push's subsequent diff against the renamed schema is then empty. Postgres preserves rows,
    // indexes, and FK targets across a table rename; push reconciles the auto-generated FK constraint
    // names additively afterward. Idempotent via `to_regclass` guards (skips once already renamed).
    name: "rename authors tables to people",
    run: db => db.execute(sql`
      DO $$ BEGIN
        IF to_regclass('public.authors') IS NOT NULL AND to_regclass('public.people') IS NULL THEN
          ALTER TABLE "authors" RENAME TO "people";
        END IF;
        IF to_regclass('public.author_images') IS NOT NULL AND to_regclass('public.person_images') IS NULL THEN
          ALTER TABLE "author_images" RENAME TO "person_images";
        END IF;
        IF to_regclass('public.bookmark_authors') IS NOT NULL AND to_regclass('public.bookmark_people') IS NULL THEN
          ALTER TABLE "bookmark_authors" RENAME TO "bookmark_people";
        END IF;
        IF to_regclass('public.author_youtube_channels') IS NOT NULL AND to_regclass('public.person_youtube_channels') IS NULL THEN
          ALTER TABLE "author_youtube_channels" RENAME TO "person_youtube_channels";
        END IF;
        IF to_regclass('public.author_websites') IS NOT NULL AND to_regclass('public.person_websites') IS NULL THEN
          ALTER TABLE "author_websites" RENAME TO "person_websites";
        END IF;
        IF to_regclass('public.author_publishers') IS NOT NULL AND to_regclass('public.person_publishers') IS NULL THEN
          ALTER TABLE "author_publishers" RENAME TO "person_publishers";
        END IF;
      END $$
    `),
  },
  {
    // Rename the author_id / author_website_url columns on the (now renamed) people tables to match
    // the renamed schema. Runs after the table rename above; guards check the new table names.
    name: "rename author_id columns to person_id",
    run: db => db.execute(sql`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'person_images' AND column_name = 'author_id')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'person_images' AND column_name = 'person_id') THEN
          ALTER TABLE "person_images" RENAME COLUMN "author_id" TO "person_id";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmark_people' AND column_name = 'author_id')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmark_people' AND column_name = 'person_id') THEN
          ALTER TABLE "bookmark_people" RENAME COLUMN "author_id" TO "person_id";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'person_youtube_channels' AND column_name = 'author_id')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'person_youtube_channels' AND column_name = 'person_id') THEN
          ALTER TABLE "person_youtube_channels" RENAME COLUMN "author_id" TO "person_id";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'person_websites' AND column_name = 'author_id')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'person_websites' AND column_name = 'person_id') THEN
          ALTER TABLE "person_websites" RENAME COLUMN "author_id" TO "person_id";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'person_publishers' AND column_name = 'author_id')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'person_publishers' AND column_name = 'person_id') THEN
          ALTER TABLE "person_publishers" RENAME COLUMN "author_id" TO "person_id";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people' AND column_name = 'author_website_url')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people' AND column_name = 'person_website_url') THEN
          ALTER TABLE "people" RENAME COLUMN "author_website_url" TO "person_website_url";
        END IF;
      END $$
    `),
  },
  {
    // Rename the explicitly-named unique constraints on the people table (asserted by name in
    // schema.ts). FK constraint names are auto-generated and reconciled by push, so only these
    // two need a manual rename. Idempotent via a pg_constraint existence check.
    name: "rename authors unique constraints to people",
    run: db => db.execute(sql`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'authors_name_unique') THEN
          ALTER TABLE "people" RENAME CONSTRAINT "authors_name_unique" TO "people_name_unique";
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'authors_slug_unique') THEN
          ALTER TABLE "people" RENAME CONSTRAINT "authors_slug_unique" TO "people_slug_unique";
        END IF;
      END $$
    `),
  },
  {
    // Publishers → Groups rename. The taxonomy was pulled out of the Media Properties grouping and
    // renamed to Groups (a broader concept). Rename the tables first; the column/constraint renames
    // below guard on the new table names. Guarded + idempotent so already-migrated DBs are no-ops.
    name: "rename publishers tables to groups",
    run: db => db.execute(sql`
      DO $$ BEGIN
        IF to_regclass('public.publishers') IS NOT NULL AND to_regclass('public.groups') IS NULL THEN
          ALTER TABLE "publishers" RENAME TO "groups";
        END IF;
        IF to_regclass('public.person_publishers') IS NOT NULL AND to_regclass('public.person_groups') IS NULL THEN
          ALTER TABLE "person_publishers" RENAME TO "person_groups";
        END IF;
      END $$
    `),
  },
  {
    // Rename the publisher_id columns on the renamed tables to group_id, and drop the now-removed
    // media_property_id link (Groups no longer belongs to the Media Properties taxonomy).
    name: "rename publisher_id columns to group_id",
    run: db => db.execute(sql`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'publisher_id')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'group_id') THEN
          ALTER TABLE "bookmarks" RENAME COLUMN "publisher_id" TO "group_id";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'person_groups' AND column_name = 'publisher_id')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'person_groups' AND column_name = 'group_id') THEN
          ALTER TABLE "person_groups" RENAME COLUMN "publisher_id" TO "group_id";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'media_property_id') THEN
          ALTER TABLE "groups" DROP COLUMN "media_property_id";
        END IF;
      END $$
    `),
  },
  {
    // Rename the explicitly-named unique constraints on the groups table (asserted by name in
    // schema.ts). FK constraint names are auto-generated and reconciled by push. Idempotent.
    name: "rename publishers unique constraints to groups",
    run: db => db.execute(sql`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'publishers_name_unique') THEN
          ALTER TABLE "groups" RENAME CONSTRAINT "publishers_name_unique" TO "groups_name_unique";
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'publishers_slug_unique') THEN
          ALTER TABLE "groups" RENAME CONSTRAINT "publishers_slug_unique" TO "groups_slug_unique";
        END IF;
      END $$
    `),
  },
  {
    // `genre_moods` + `genre_mood_assignments` (the Genres & Moods taxonomy) were added as brand-new
    // tables, but `genre_mood_assignments` is a new table with NOT NULL columns (`owner_type`,
    // `owner_id`, `genre_mood_id`) plus an FK — the same shape as `bookmark_choices_values` above.
    // Against a populated database `drizzle-kit push` treats that as a "do you want to truncate?"
    // (pgSuggestions) change and, in this non-TTY deploy, SILENTLY SKIPS it while still exiting 0 — so
    // the deploy succeeds but the tables never get created and every Genres & Moods query 500s with
    // `relation "genre_moods" does not exist`. Pre-create both tables here so push's diff for them is
    // always empty. Idempotent (`IF NOT EXISTS`); the DDL mirrors schema.ts exactly. Boot-time
    // `backfillGenreMoodSlugs()` fills the NULL slugs.
    name: "create genre_moods table",
    run: db => db.execute(sql`
      CREATE TABLE IF NOT EXISTS "genre_moods" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "romanized_name" text,
        "slug" text,
        "parent_id" uuid REFERENCES "genre_moods"("id") ON DELETE CASCADE,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "genre_moods_slug_unique" UNIQUE("slug")
      )
    `),
  },
  {
    // Sibling names unique within a parent — a unique INDEX (mirrors schema.ts / the `tags` note).
    name: "create genre_moods parent+name unique index",
    run: db => db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "genre_moods_parent_name_unique" ON "genre_moods" ("parent_id", "name")`,
    ),
  },
  {
    // The polymorphic assignment table (see the note on the genre_moods step above). Composite PK +
    // NOT NULL columns + FK to genre_moods — pre-create so push's diff for it is empty.
    name: "create genre_mood_assignments table",
    run: db => db.execute(sql`
      CREATE TABLE IF NOT EXISTS "genre_mood_assignments" (
        "genre_mood_id" uuid NOT NULL REFERENCES "genre_moods"("id") ON DELETE CASCADE,
        "owner_type" text NOT NULL,
        "owner_id" uuid NOT NULL,
        PRIMARY KEY ("genre_mood_id", "owner_type", "owner_id")
      )
    `),
  },
  {
    name: "create genre_mood_assignments owner index",
    run: db => db.execute(
      sql`CREATE INDEX IF NOT EXISTS "genre_mood_assignments_owner_idx" ON "genre_mood_assignments" ("owner_type", "owner_id")`,
    ),
  },
  {
    // `bookmarks.image_display_preference` ("image" | "screenshot" | null) is a plain nullable text
    // column — normally a push-safe additive change. But it shipped in the same release window as the
    // brand-new `genre_mood_assignments` table (the step above), which `drizzle-kit push` treats as a
    // "do you want to truncate?" (pgSuggestions) change. In this non-TTY deploy push bails at that
    // prompt while still exiting 0, so every additive statement it hadn't applied yet — including this
    // ADD COLUMN — is SILENTLY SKIPPED. The column then never exists on the live table and the plain
    // `SELECT … FROM bookmarks` on the bookmarks listing 500s with `column
    // "image_display_preference" does not exist`. Pre-add it here (idempotent `ADD COLUMN IF NOT
    // EXISTS`, no FK/NOT NULL so it never prompts) so push's diff for it is always empty and it can't
    // be skipped — the bookmarks-column twin of the genre_moods pre-create fix above.
    name: "add bookmarks.image_display_preference column",
    run: db => db.execute(sql`
      ALTER TABLE IF EXISTS "bookmarks" ADD COLUMN IF NOT EXISTS "image_display_preference" text
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
