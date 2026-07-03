---
name: db-schema-change
description: >-
  Change the PostgreSQL schema in eeSimple Bookmarks safely — decide between a plain
  `src/db/schema.ts` edit (push-safe additive) and an idempotent `src/db/migrate.ts` pre-step, and
  wire any seed/backfill as an `ensure*`/`backfill*` boot step. Use when asked to "add a
  column/table/index", "add a unique constraint", "add a NOT NULL column", "drop/rename a column",
  "write a migration", "seed a built-in row", "backfill existing rows", or when a deploy crashes in
  `drizzle-kit push` with a truncation/confirmation prompt. Encodes the rules that keep push's diff
  additive so a non-TTY production deploy never hits an interactive prompt.
---

# Database schema changes

There is **no versioned-migration folder** (no `drizzle/`, no journal, no `generate`). On boot the
gateway runs `dist/db/migrate.js` (the runtime pre-steps), then `drizzle-kit push` **without
`--force`**, which diffs `packages/middleware/src/db/schema.ts` against the live database. The whole
system stays safe by one invariant: **push's remaining diff must always be additive and
prompt-free.** Route every change through this decision table:

| Change | Where it goes |
|---|---|
| **New table**, or a **nullable** column shipped in the same release as one | `schema.ts` **plus** an idempotent `migrate.ts` **pre-create** (`CREATE TABLE` / `ADD COLUMN IF NOT EXISTS`). See the silent-skip caveat below — "push applies new tables silently" is **not** reliable in the non-TTY deploy. |
| A lone **nullable** column or **new index** with no new table in the same release | `schema.ts` only — genuinely push-safe. |
| **Single-column unique constraint** on a table with data; **NOT NULL** column (even with a DEFAULT) | `schema.ts` **plus** a pre-step in `migrate.ts` — push alone hits the interactive `pgSuggestions` prompt and **crashes the non-TTY deploy** (`--force` does not bypass it). |
| **COMPOSITE (multi-column) unique** | Declare it as **`uniqueIndex()`**, **never** a table `unique()` constraint. A composite `unique()` can make push **re-propose it every deploy even when it already exists and matches** → truncate prompt → same non-TTY silent-skip as new tables (below). For an existing table also add a `migrate.ts` step: `DROP CONSTRAINT IF EXISTS` then `CREATE UNIQUE INDEX IF NOT EXISTS`. Bit `tags_parent_name_unique`, then `language_usage_levels`/`language_usages` (#914). Single-column `unique()` (slugs, names) is fine and stays a `unique()`. |
| Drop / rename a column or table; `ALTER TYPE … ADD VALUE`; data-preserving transform | `migrate.ts` pre-step (guarded), then update `schema.ts` to match — push never destroys data itself. |
| Seed rows / backfill values for existing rows | **Not** a migration — an `ensure*` / `backfill*` boot step in the middleware (below). |

**Silent-skip caveat (new tables + companion columns).** Against a populated DB, `drizzle-kit push`
treats a **new table** as a `pgSuggestions` "do you want to truncate?" change; in the non-TTY deploy it
**bails at that prompt while exiting 0**, so the table — *and every additive statement it hadn't
applied yet in the same run, including plain nullable `ADD COLUMN`s* — is **silently skipped**. The
deploy "succeeds" but the table/column never exists and queries 500 with `relation … does not exist` /
`column … does not exist` (this is what bit `genre_moods` #929, `bookmarks.image_display_preference`
#930, and the `podcasts` taxonomy). So **pre-create every new table and pre-add its companion
columns** (e.g. a taxonomy's `bookmarks.<x>_id` FK) in `migrate.ts` with idempotent `IF NOT EXISTS`
DDL. Keep the pre-create **self-contained — no FK to a push-created table** (migrate runs before push,
so a FK to `media_properties`/`bookmarks` fails on a DB that lacks it): declare FK columns as a plain
`uuid` and let push add the FK constraint afterward (additive, never prompts). Verify against a real
Postgres: run `migrate.ts` on a DB that has the base schema but not your new table, then confirm it
recreates it and re-runs as a no-op.

## Writing a `migrate.ts` pre-step

Add an entry to the `migrations` array in `packages/middleware/src/db/migrate.ts`:

```ts
{
  name: "add autofill_rules.slug column + unique constraint",   // mirrors existing entries
  run: db => db.execute(sql`ALTER TABLE "autofill_rules" ADD COLUMN IF NOT EXISTS "slug" text`),
},
```

Rules (each has bitten before):

- **Idempotent, always.** Every step runs on *every* boot: `IF EXISTS` / `IF NOT EXISTS` for
  columns/tables, check `pg_constraint` by name before adding a constraint, check-before-mutate for
  data transforms.
- **Exactly one SQL statement per `db.execute()`.** Drizzle's extended-protocol queries run only the
  first statement of a multi-statement string. One `ALTER TABLE … ADD COLUMN a, ADD COLUMN b` or one
  `DO $$…$$` block is fine; two semicolon-separated statements are silently half-applied — split
  them into separate `db.execute` calls.
- The pre-step runs **before** push, so after it, push's diff for that item is empty — that is the
  whole point. Keep `schema.ts` and the pre-step describing the same end state.

## Seeds and backfills — boot steps, not migrations

Data that depends on application logic (built-in rows, derived slugs, jsonb reshapes) lives in
`packages/middleware/src/index.ts` as `ensure*` / `backfill*` calls (see the long import list there:
`ensureDefaultCategory`, `ensureBuiltInMediaTypes`, `backfillTagSlugs`,
`backfillCardDisplayRuleSubZones`, …). Rules:

- **Idempotent and cheap to re-run** — they execute on every boot.
- **They run *after* `app.listen()`** so `/healthz` and `/api/*` stay reachable while a slow
  backfill runs on modest hardware. Never reorder listen after the boot steps.
- A seed that should run only until the user takes ownership checks for `null` (never-initialized)
  vs. an explicit empty value the user set — see `ensureDefaultPlaceTypeLevelGroups()`.
- A backfill that changes a bookmark's **matchable** data (row, tags, property values) or the tag
  tree must call `invalidateBookmarkCache()`.

## Verify

- `pnpm push:dev` (or `pnpm dev`) applies cleanly against a local database **twice in a row** — the
  second run proves idempotency and an empty push diff.
- `pnpm typecheck` + the middleware tests. If the change adds/removes a field on a shared entity
  type, update the client factory defaults (`test-utils/factories.ts`) in the same change.
