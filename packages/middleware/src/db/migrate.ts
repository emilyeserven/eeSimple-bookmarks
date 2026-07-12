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
  {
    // `parse_templates` (paste-to-parse Parse Templates) is a brand-new table. Same push new-table
    // trap as `entity_layouts` above — pre-create it here so push's diff stays empty. Idempotent
    // (`IF NOT EXISTS`). No FK columns.
    name: "create parse_templates table",
    run: db => db.execute(sql`
      CREATE TABLE IF NOT EXISTS "parse_templates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "delineator" text NOT NULL,
        "pattern" text NOT NULL,
        "fallback_tag" text DEFAULT 'name' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `),
  },
  {
    // `parse_templates.name` is declared as a `uniqueIndex` (not a table `unique()`) in schema.ts —
    // pre-create it identically so push's diff for it stays empty.
    name: "create parse_templates name unique index",
    run: db => db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "parse_templates_name_unique" ON "parse_templates" ("name")`,
    ),
  },
  // User-configurable taxonomies (`taxonomies` / `taxonomy_terms` / `taxonomy_assignments`) are brand
  // -new tables. Same push new-table trap as `entity_layouts` above — pre-create each here (and its
  // indexes) so push's diff stays empty. FK columns are declared as plain `uuid` with NO `REFERENCES`
  // (migrate runs before push, which adds the FK constraints afterward additively). One statement per
  // `db.execute`. Idempotent (`IF NOT EXISTS`).
  {
    name: "create taxonomies table",
    run: db => db.execute(sql`
      CREATE TABLE IF NOT EXISTS "taxonomies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "description" text,
        "hierarchical" boolean DEFAULT true NOT NULL,
        "single_value" boolean DEFAULT false NOT NULL,
        "built_in" boolean DEFAULT false NOT NULL,
        "hidden" boolean,
        "icon" text,
        "show_in_sidebar" boolean DEFAULT true NOT NULL,
        "custom_layout" boolean,
        "sort_order" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `),
  },
  {
    name: "create taxonomies slug unique index",
    run: db => db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "taxonomies_slug_unique" ON "taxonomies" ("slug")`,
    ),
  },
  {
    name: "create taxonomy_terms table",
    run: db => db.execute(sql`
      CREATE TABLE IF NOT EXISTS "taxonomy_terms" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "taxonomy_id" uuid NOT NULL,
        "name" text NOT NULL,
        "slug" text,
        "description" text,
        "parent_id" uuid,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `),
  },
  {
    name: "create taxonomy_terms tax_parent_name unique index",
    run: db => db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "taxonomy_terms_tax_parent_name_unique" ON "taxonomy_terms" ("taxonomy_id", "parent_id", "name")`,
    ),
  },
  {
    name: "create taxonomy_terms tax_slug unique index",
    run: db => db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "taxonomy_terms_tax_slug_unique" ON "taxonomy_terms" ("taxonomy_id", "slug")`,
    ),
  },
  {
    name: "create taxonomy_assignments table",
    run: db => db.execute(sql`
      CREATE TABLE IF NOT EXISTS "taxonomy_assignments" (
        "taxonomy_id" uuid NOT NULL,
        "term_id" uuid NOT NULL,
        "owner_type" text NOT NULL,
        "owner_id" uuid NOT NULL,
        CONSTRAINT "taxonomy_assignments_term_id_owner_type_owner_id_pk" PRIMARY KEY ("term_id", "owner_type", "owner_id")
      )
    `),
  },
  {
    name: "create taxonomy_assignments owner index",
    run: db => db.execute(
      sql`CREATE INDEX IF NOT EXISTS "taxonomy_assignments_owner_idx" ON "taxonomy_assignments" ("owner_type", "owner_id")`,
    ),
  },
  {
    name: "create taxonomy_assignments tax_owner index",
    run: db => db.execute(
      sql`CREATE INDEX IF NOT EXISTS "taxonomy_assignments_tax_owner_idx" ON "taxonomy_assignments" ("taxonomy_id", "owner_type", "owner_id")`,
    ),
  },
  // ── Genres & Moods → generic taxonomy cutover ──────────────────────────────────────────────────
  // The bespoke `genre_moods` taxonomy is folded into the generic engine: it becomes one built-in
  // `taxonomies` row, its entries become `taxonomy_terms` (REUSING the same UUIDs so existing
  // bookmark hydration + stored `genre-mood` condition trees keep resolving with no jsonb rewrite),
  // and its polymorphic assignments become `taxonomy_assignments`. Then the legacy tables are dropped.
  // All steps are idempotent + guarded (`IF EXISTS` / `ON CONFLICT`), so they no-op after the first run.
  {
    // Seed the Genres & Moods taxonomy row as an ORDINARY (non-built-in) taxonomy — it's fully
    // user-controllable (renamable / deletable / demotable). Guarded on the legacy `genre_moods` table
    // still existing so this only fires during the one-time migration: once the table is dropped (end
    // of the first migrating boot), this never runs again, so a user who demotes/deletes G&M won't see
    // it resurrect on the next boot.
    name: "seed genres-moods taxonomy row",
    run: db => db.execute(sql`
      DO $$
      BEGIN
        IF to_regclass('public.genre_moods') IS NOT NULL THEN
          INSERT INTO "taxonomies" ("name", "slug", "hierarchical", "single_value", "built_in", "hidden", "icon", "show_in_sidebar", "sort_order")
          VALUES ('Genres & Moods', 'genres-moods', true, false, false, false, 'Drama', true, 0)
          ON CONFLICT ("slug") DO NOTHING;
        END IF;
      END $$
    `),
  },
  {
    // Flip an already-migrated G&M row (seeded built-in by the first cut of this feature) to
    // non-built-in so it becomes demotable. No-op once it's already false / if G&M was demoted away.
    name: "make genres-moods taxonomy non-built-in",
    run: db => db.execute(
      sql`UPDATE "taxonomies" SET "built_in" = false WHERE "slug" = 'genres-moods' AND "built_in" = true`,
    ),
  },
  {
    // Copy each genre/mood entry into taxonomy_terms with the SAME id (so parent_id links + bookmark
    // hydration + stored condition ids all stay valid). Guarded on the legacy table still existing.
    name: "copy genre_moods into taxonomy_terms",
    run: db => db.execute(sql`
      DO $$
      BEGIN
        IF to_regclass('public.genre_moods') IS NOT NULL THEN
          INSERT INTO "taxonomy_terms" ("id", "taxonomy_id", "name", "slug", "description", "parent_id", "created_at")
          SELECT gm."id", (SELECT "id" FROM "taxonomies" WHERE "slug" = 'genres-moods'),
                 gm."name", gm."slug", gm."description", gm."parent_id", gm."created_at"
          FROM "genre_moods" gm
          ON CONFLICT ("id") DO NOTHING;
        END IF;
      END $$
    `),
  },
  {
    // Copy assignments; a genre/mood that was itself an assignment OWNER (owner_type='genreMood')
    // becomes owner_type='taxonomy' (the generic self-owner value).
    name: "copy genre_mood_assignments into taxonomy_assignments",
    run: db => db.execute(sql`
      DO $$
      BEGIN
        IF to_regclass('public.genre_mood_assignments') IS NOT NULL THEN
          INSERT INTO "taxonomy_assignments" ("taxonomy_id", "term_id", "owner_type", "owner_id")
          SELECT (SELECT "id" FROM "taxonomies" WHERE "slug" = 'genres-moods'),
                 gma."genre_mood_id",
                 CASE WHEN gma."owner_type" = 'genreMood' THEN 'taxonomy' ELSE gma."owner_type" END,
                 gma."owner_id"
          FROM "genre_mood_assignments" gma
          ON CONFLICT ("term_id", "owner_type", "owner_id") DO NOTHING;
        END IF;
      END $$
    `),
  },
  {
    name: "drop legacy genre_mood_assignments",
    run: db => db.execute(sql`DROP TABLE IF EXISTS "genre_mood_assignments"`),
  },
  {
    name: "drop legacy genre_moods",
    run: db => db.execute(sql`DROP TABLE IF EXISTS "genre_moods"`),
  },
  // Property Groups were removed — each custom property is now an individually-placeable layout
  // field, so the visual grouping is obsolete. Drop the join tables, the base table, and the
  // `custom_properties.property_group_id` display-only column here (destructive) so push's
  // subsequent diff against schema.ts stays purely additive. Order: the FK column and both join
  // tables before the base `property_groups` table. Each `db.execute` is a single statement.
  {
    name: "drop legacy custom_properties.property_group_id",
    run: db => db.execute(sql`ALTER TABLE "custom_properties" DROP COLUMN IF EXISTS "property_group_id"`),
  },
  {
    name: "drop legacy property_group_categories",
    run: db => db.execute(sql`DROP TABLE IF EXISTS "property_group_categories"`),
  },
  {
    name: "drop legacy property_group_media_types",
    run: db => db.execute(sql`DROP TABLE IF EXISTS "property_group_media_types"`),
  },
  {
    name: "drop legacy property_groups",
    run: db => db.execute(sql`DROP TABLE IF EXISTS "property_groups"`),
  },
  // Groups' relation tables (added with the Publishers → Groups / Artists merge). A brand-new table
  // is the drizzle-kit push silent-skip trap against a populated DB: push bails at the truncate
  // prompt and skips the table (and the rest of its additive diff), so every full group read
  // (`getGroupById` / `listGroups`, which join these) 500s — including the re-read the create
  // endpoint used to do. Pre-create them here (FK columns as plain uuid; push adds the FK
  // constraints afterward, additively). Idempotent.
  {
    name: "create group_images table",
    run: db => db.execute(sql`
      CREATE TABLE IF NOT EXISTS "group_images" (
        "group_id" uuid PRIMARY KEY NOT NULL,
        "object_key" text NOT NULL,
        "content_type" text NOT NULL,
        "width" integer,
        "height" integer,
        "byte_size" integer NOT NULL,
        "source" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `),
  },
  {
    name: "create group_youtube_channels table",
    run: db => db.execute(sql`
      CREATE TABLE IF NOT EXISTS "group_youtube_channels" (
        "group_id" uuid NOT NULL,
        "channel_id" uuid NOT NULL,
        CONSTRAINT "group_youtube_channels_group_id_channel_id_pk" PRIMARY KEY ("group_id", "channel_id")
      )
    `),
  },
  {
    name: "create group_websites table",
    run: db => db.execute(sql`
      CREATE TABLE IF NOT EXISTS "group_websites" (
        "group_id" uuid NOT NULL,
        "website_id" uuid NOT NULL,
        CONSTRAINT "group_websites_group_id_website_id_pk" PRIMARY KEY ("group_id", "website_id")
      )
    `),
  },
  // ── Page Progress → Progress rename + Chapters/Page Sections/URL Sections → Sections merge ──────
  // The built-in "Page Progress" property is genericized to "Progress" (name AND slug; the row is
  // renamed IN PLACE so its UUID — and therefore every stored condition/fill-rule/value reference —
  // stays valid). The three built-in sections properties are merged into one "Sections" property by
  // REPURPOSING the Chapters row as the survivor (again preserving a UUID) and folding the other two
  // properties' value rows into it; the two retired UUIDs are rewritten across every jsonb column
  // that can carry a custom-property id. All steps are guarded so they no-op after the first
  // migrating boot and on fresh installs (where the seeds create the new-slug rows directly).
  {
    // A user-created property could legitimately hold the slug the built-in is about to take
    // (uniqueSlug only suffixes on conflict at create time). Park it out of the way first — only
    // when the built-in old-slug row actually exists (i.e. the rename below is about to fire).
    name: "park colliding user slug progress",
    run: db => db.execute(sql`
      UPDATE "custom_properties" SET "slug" = 'progress-user'
      WHERE "slug" = 'progress' AND "built_in" = false
        AND EXISTS (SELECT 1 FROM "custom_properties" WHERE "slug" = 'page-progress' AND "built_in")
    `),
  },
  {
    name: "park colliding user slug sections",
    run: db => db.execute(sql`
      UPDATE "custom_properties" SET "slug" = 'sections-user'
      WHERE "slug" = 'sections' AND "built_in" = false
        AND EXISTS (SELECT 1 FROM "custom_properties" WHERE "slug" = 'chapters' AND "built_in")
    `),
  },
  {
    // Rename in place — UUID preserved, so no value-row or jsonb reference needs rewriting for
    // Progress. Existing deploys keep their configured " of "/" pages" base texts; per-media-type
    // overrides are configured via the property options UI.
    name: "rename built-in page-progress to progress",
    run: db => db.execute(sql`
      UPDATE "custom_properties" SET "name" = 'Progress', "slug" = 'progress'
      WHERE "slug" = 'page-progress' AND "built_in"
    `),
  },
  {
    // The Add Bookmark form placement map is keyed by slug — carry the user's stored choice over to
    // the new key (the resolver drops unknown keys, so without this the placement would silently
    // reset to the default).
    name: "remap add-form placement key page-progress to progress",
    run: db => db.execute(sql`
      UPDATE "app_settings" SET "bookmark_form_built_in_placements" =
        ("bookmark_form_built_in_placements" - 'page-progress')
        || jsonb_build_object('progress', "bookmark_form_built_in_placements" -> 'page-progress')
      WHERE "bookmark_form_built_in_placements" ? 'page-progress'
    `),
  },
  {
    // Advanced placement rules key their sparse propertyPlacements by slug too. Rewrite the JSON
    // object keys textually (`"old-slug":` → `"new-slug":`); when a rule repositioned two of the
    // merged slugs the text cast keeps the last duplicate key, which is an acceptable pick.
    name: "remap add-form advanced-rule placement slugs",
    run: db => db.execute(sql`
      UPDATE "app_settings" SET "bookmark_form_advanced_rules" = REPLACE(REPLACE(REPLACE(REPLACE(
        "bookmark_form_advanced_rules"::text,
        '"page-progress":', '"progress":'),
        '"page-sections":', '"sections":'),
        '"url-sections":', '"sections":'),
        '"chapters":', '"sections":')::jsonb
      WHERE "bookmark_form_advanced_rules"::text LIKE ANY (ARRAY['%"page-progress":%', '%"page-sections":%', '%"url-sections":%', '%"chapters":%'])
    `),
  },
  {
    // Rewrite the two retiring property UUIDs (page-sections, url-sections) to the surviving
    // Chapters UUID inside every jsonb column that can carry a custom-property id — stored
    // extension fill rules, condition trees, card field zones/lists, page layouts, and saved
    // filters. A text-level REPLACE is safe (UUIDs are globally unique strings). Runs only while
    // the loser rows still exist, i.e. before the merge step below deletes them. Known cosmetic
    // artifact: a structure that referenced two of the old properties ends up with a duplicate
    // reference to the survivor (conditions OR the same predicate; a zone may list the field
    // twice) — harmless, self-heals on the next user save.
    name: "rewrite merged sections property ids in stored jsonb",
    run: db => db.execute(sql`
      DO $$
      DECLARE
        survivor text;
        loser text;
        tgt record;
      BEGIN
        SELECT "id"::text INTO survivor FROM "custom_properties" WHERE "slug" = 'chapters' AND "built_in";
        IF survivor IS NULL THEN RETURN; END IF;
        FOR loser IN
          SELECT "id"::text FROM "custom_properties" WHERE "slug" IN ('page-sections', 'url-sections') AND "built_in"
        LOOP
          FOR tgt IN
            SELECT * FROM (VALUES
              ('websites', 'extension_fill_rules'),
              ('autofill_rules', 'conditions'),
              ('homepage_filter', 'conditions'),
              ('homepage_sections', 'conditions'),
              ('homepage_sections', 'field_zones'),
              ('homepage_sections', 'hidden_card_fields'),
              ('card_display_rules', 'conditions'),
              ('card_display_rules', 'field_zones'),
              ('card_display_rules', 'hidden_card_fields'),
              ('card_display_rules', 'sections'),
              ('import_rules', 'conditions'),
              ('card_field_templates', 'field_zones'),
              ('entity_layouts', 'layout'),
              ('saved_filters', 'filters'),
              ('app_settings', 'bookmark_form_advanced_rules')
            ) AS t(tname, cname)
          LOOP
            EXECUTE format(
              'UPDATE %I SET %I = REPLACE(%I::text, %L, %L)::jsonb WHERE %I::text LIKE %L',
              tgt.tname, tgt.cname, tgt.cname, loser, survivor, tgt.cname, '%' || loser || '%'
            );
          END LOOP;
        END LOOP;
      END $$
    `),
  },
  {
    // Carry the most-visible stored placement of the three merged slugs over to the new
    // 'sections' key (default beats advanced beats hidden).
    name: "remap add-form placement keys for merged sections",
    run: db => db.execute(sql`
      UPDATE "app_settings" SET "bookmark_form_built_in_placements" =
        ("bookmark_form_built_in_placements" - 'chapters' - 'page-sections' - 'url-sections')
        || jsonb_build_object('sections', CASE
          WHEN 'default' IN ("bookmark_form_built_in_placements" ->> 'chapters', "bookmark_form_built_in_placements" ->> 'page-sections', "bookmark_form_built_in_placements" ->> 'url-sections') THEN 'default'
          WHEN 'advanced' IN ("bookmark_form_built_in_placements" ->> 'chapters', "bookmark_form_built_in_placements" ->> 'page-sections', "bookmark_form_built_in_placements" ->> 'url-sections') THEN 'advanced'
          ELSE 'hidden'
        END)
      WHERE "bookmark_form_built_in_placements" ?| ARRAY['chapters', 'page-sections', 'url-sections']
    `),
  },
  {
    // The merge itself — one atomic DO block (a single statement, so an interrupted boot re-runs it
    // cleanly). Folds each bookmark's up-to-three sections value rows into one row on the survivor
    // (entries concatenated chapters → page-sections → url-sections, each list in stored order;
    // nested children ride along verbatim inside the jsonb, so subsections survive; `exhaustive`
    // stays true only if every merged source was exhaustive), deletes the two loser property rows
    // (cascading their value rows + scope joins), and repurposes the survivor as the generic
    // "Sections" property (all categories + media types, tiered, all entry types). Guarded on the
    // built-in `chapters` slug still existing, so it runs exactly once.
    name: "merge sections properties into one",
    run: db => db.execute(sql`
      DO $$
      DECLARE
        survivor uuid;
        ps uuid;
        us uuid;
      BEGIN
        SELECT "id" INTO survivor FROM "custom_properties" WHERE "slug" = 'chapters' AND "built_in";
        IF survivor IS NULL THEN RETURN; END IF;
        SELECT "id" INTO ps FROM "custom_properties" WHERE "slug" = 'page-sections' AND "built_in";
        SELECT "id" INTO us FROM "custom_properties" WHERE "slug" = 'url-sections' AND "built_in";

        INSERT INTO "bookmark_sections_values" ("bookmark_id", "property_id", "exhaustive", "sections")
        SELECT s."bookmark_id", survivor, bool_and(s."exhaustive"),
               COALESCE(jsonb_agg(s.elem ORDER BY s.prop_ord, s.elem_ord) FILTER (WHERE s.elem IS NOT NULL), '[]'::jsonb)
        FROM (
          SELECT bsv."bookmark_id", bsv."exhaustive",
                 CASE bsv."property_id" WHEN survivor THEN 1 WHEN ps THEN 2 ELSE 3 END AS prop_ord,
                 e.elem, e.elem_ord
          FROM "bookmark_sections_values" bsv
          LEFT JOIN LATERAL jsonb_array_elements(bsv."sections") WITH ORDINALITY AS e(elem, elem_ord) ON true
          WHERE bsv."property_id" IN (survivor, ps, us)
        ) s
        GROUP BY s."bookmark_id"
        ON CONFLICT ("bookmark_id", "property_id") DO UPDATE
          SET "exhaustive" = EXCLUDED."exhaustive", "sections" = EXCLUDED."sections";

        DELETE FROM "custom_properties" WHERE "id" IN (ps, us);

        UPDATE "custom_properties"
        SET "name" = 'Sections', "slug" = 'sections',
            "all_categories" = true, "all_media_types" = true,
            "sections_tiered" = true, "sections_allowed_types" = NULL, "sections_default_type" = NULL
        WHERE "id" = survivor;

        DELETE FROM "property_media_types" WHERE "property_id" = survivor;
        DELETE FROM "property_categories" WHERE "property_id" = survivor;
      END $$
    `),
  },
  {
    // The singular bookmark "publisher" FK (`bookmarks.group_id` → `Bookmark.group`) was removed — it
    // had no UI picker anywhere and was only ever set programmatically. Dropping a column is
    // destructive, so `drizzle-kit push` would prompt (and crash in this non-TTY deploy); drop it here
    // first so push's diff stays additive. Idempotent (`IF EXISTS`). The plural creator groups
    // (`bookmark_groups`) are untouched.
    name: "drop legacy bookmarks.group_id publisher fk",
    run: db => db.execute(sql`ALTER TABLE "bookmarks" DROP COLUMN IF EXISTS "group_id"`),
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
