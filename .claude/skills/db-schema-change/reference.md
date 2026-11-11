# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Database schema changes

The schema is managed like course-tracker: **`drizzle-kit push` is the source of truth**, not
generated migration files. On boot the gateway runs the runtime-migrations hook
(`dist/db/migrate.js`) and then `drizzle-kit push`, which diffs `src/db/schema.ts` against the live
database and applies the delta. There is intentionally **no `drizzle/` folder, journal, or
`generate` script** — adopting Drizzle's versioned-migration system was the source of brittle
"column already exists" redeploys.

push runs **without `--force`** on purpose: `--force` does not suppress drizzle-kit's
`pgSuggestions` truncation prompts anyway (it still crashes in a non-TTY deploy), and it would apply
genuinely destructive diffs silently. The deploy stays safe by keeping push's diff **additive-only**
— the runtime-migrations hook pre-applies everything that would otherwise make push prompt.

- **Truly push-safe additive changes** (a **lone** nullable column on an existing table, or a new
  index, with **no new table in the same release**): just edit `src/db/schema.ts`. `push` applies
  them without prompting. No migration file, no `drizzle-kit generate`.
- **Additive changes that trigger a push prompt** — `drizzle-kit push` runs non-interactively in
  production (non-TTY, stdin = `/dev/null`). Certain additive changes still cause an interactive
  confirmation that crashes the deploy (and `--force` does **not** bypass it):
  - **A NEW TABLE** — against a *populated* database push treats a brand-new table as a
    `pgSuggestions` "truncate?" change, **bails at the prompt while exiting 0**, and **silently
    skips the table *and every additive statement it hadn't applied yet in the same run* — including
    plain nullable `ADD COLUMN`s**. The deploy "succeeds" but the table/column never exists and
    queries 500 with `relation … does not exist` / `column … does not exist`. This is the primary
    "missing column/table" 500 cause (bit `genre_moods` #929, `bookmarks.image_display_preference`
    #930, the `podcasts` #927 and `languages`/`language_usage_levels`/`language_usages` tables).
    **Pre-create every new table and pre-add its companion columns** (e.g. a taxonomy's
    `bookmarks.<x>_id` FK) in `migrate.ts` with idempotent `IF NOT EXISTS` DDL mirroring `schema.ts`.
    Keep it **self-contained — declare FK columns as a plain `uuid`, no `REFERENCES` to a
    push-created base table** (migrate runs *before* push); push adds the FK constraint afterward
    (additive, never prompts). See the `genre_moods` / `podcasts` / language pre-create steps.
  - **Unique constraints added to an existing table with data** — push warns the constraint may
    fail and asks to truncate (the `pgSuggestions` prompt). With no TTY it crashes the push run.
  - **`NOT NULL` columns added to an existing table** (even with a column-level `DEFAULT`) — push
    prompts before applying.
  - **A COMPOSITE `unique()` constraint** (multi-column, e.g. `unique("x").on(t.a, t.b)`) can make
    push **re-propose it on every deploy even when it already exists and matches** — the same
    truncate prompt → non-TTY crash, after which push exits 0 and **silently skips the rest of its
    additive diff** (the classic "missing column/table" 500s, since a later new column never gets
    added). **Declare composite uniques as `uniqueIndex()`, never a table `unique()` constraint** —
    a unique index converges cleanly and applies via `CREATE UNIQUE INDEX IF NOT EXISTS` with no
    prompt. Single-column `unique()` (slugs, names, etc.) is fine and stays a `unique()`. This bit
    `tags_parent_name_unique` and then the `language_usage_levels` / `language_usages` composite
    uniques (#914 repeated the mistake). For an existing table, also add a `migrate.ts` step that
    `DROP CONSTRAINT IF EXISTS` the old constraint and `CREATE UNIQUE INDEX IF NOT EXISTS` (see the
    "migrate … composite uniques from constraints to unique indexes" steps). Note it is *not* every
    composite `unique()` that reproduces this (some converge), but `uniqueIndex()` always does —
    prefer it for any composite unique so the trap can't recur.

  For these cases, add an idempotent step to `src/db/migrate.ts` — the same place as destructive
  changes. Use `ADD COLUMN IF NOT EXISTS` for columns; check `pg_constraint` by name before adding
  a constraint. The pre-migration runs first, so push's subsequent diff is empty for that item and
  no prompt is issued. **Each `db.execute()` must contain exactly one SQL statement** — drizzle's
  extended-protocol queries run only the first statement of a multi-statement string, so a single
  `ALTER TABLE … ADD COLUMN a, ADD COLUMN b` or a single `DO $$…$$` block is fine, but two
  semicolon-separated statements are not (split them into separate `db.execute` calls). See the
  existing entries in `migrate.ts` for examples.
- **Destructive / push-incompatible changes** (drop or rename a column/table, `ALTER TYPE … ADD
  VALUE`, data-preserving transforms): add a small **idempotent** step to the `migrations` array in
  `src/db/migrate.ts`. It runs before `push` so push's diff stays additive — push runs **without**
  `--force` and so never silently drops data. Each step runs on every boot, so guard it (`IF EXISTS`
  / `IF NOT EXISTS`, check-before-mutate).
- **Data backfills** for existing rows live in the middleware's boot steps in `src/index.ts`
  (`ensure*` / `backfill*`), which run after the schema is in place.
