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
| New table; **nullable** column on an existing table; new index | `schema.ts` only — push applies it silently. |
| **Unique constraint** on a table with data; **NOT NULL** column (even with a DEFAULT) | `schema.ts` **plus** a pre-step in `migrate.ts` — push alone hits the interactive `pgSuggestions` prompt and **crashes the non-TTY deploy** (`--force` does not bypass it). |
| Drop / rename a column or table; `ALTER TYPE … ADD VALUE`; data-preserving transform | `migrate.ts` pre-step (guarded), then update `schema.ts` to match — push never destroys data itself. |
| Seed rows / backfill values for existing rows | **Not** a migration — an `ensure*` / `backfill*` boot step in the middleware (below). |

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
