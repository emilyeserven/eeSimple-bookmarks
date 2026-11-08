---
name: db-schema-change
description: >-
  Change the PostgreSQL schema in this app safely — decide between a plain
  `packages/middleware/src/db/schema.ts` edit (push-safe additive) and an idempotent
  `packages/middleware/src/db/migrate.ts` pre-step, and wire any seed/backfill as an
  `ensure*`/`backfill*` boot step in `src/index.ts`. Use when asked to "add a column/table/index",
  "add a unique constraint", "add a NOT NULL column", "drop/rename a column", "write a migration",
  "seed a built-in row", "backfill existing rows", or when a deploy crashes (or silently skips a
  table/column) in `drizzle-kit push` with a truncation/confirmation prompt. Encodes the rules that
  keep push's diff additive so a non-TTY production deploy never hits an interactive prompt.
---

# Database schema changes

There is **no versioned-migration folder** (no `drizzle/`, no journal, no `drizzle-kit generate`). On
boot the gateway (`packages/gateway/server.js`) runs the compiled runtime-migrations hook
(`packages/middleware/dist/db/migrate.js`), then `drizzle-kit push` **without `--force`**, which diffs
`packages/middleware/src/db/schema.ts` against the live database and applies the delta. Locally,
`pnpm push:dev` does the same two steps (`migrate:dev` then `drizzle-kit push`).

The whole system stays safe by one invariant: **push's remaining diff must always be additive and
prompt-free.** Production push runs non-interactively (no TTY, stdin = `/dev/null`); anything that
makes push ask a question either crashes the deploy or — worse — makes push bail while still exiting
0. `--force` does **not** suppress drizzle-kit's `pgSuggestions` prompts, and it would apply genuinely
destructive diffs silently, so it is deliberately not used.

Route every change through this decision table:

| Change | Where it goes |
|---|---|
| **New table**, or any column shipped in the same release as a new table | `schema.ts` **plus** an idempotent `migrate.ts` **pre-create** (`CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`). See the silent-skip caveat below — "push applies new tables on its own" is **not** reliable against a populated database. |
| A lone **nullable** column or a **new index**, with no new table in the same release | `schema.ts` only — genuinely push-safe. |
| **Single-column unique constraint** added to a table with data; **NOT NULL** column (even with a column `DEFAULT`) | `schema.ts` **plus** a `migrate.ts` pre-step — push alone hits the interactive prompt and crashes the non-TTY deploy. |
| **Composite (multi-column) unique** | Declare it as **`uniqueIndex()`**, **never** a table `unique()` constraint (see below). For an existing table that already has the constraint, also add a `migrate.ts` step: `DROP CONSTRAINT IF EXISTS`, then `CREATE UNIQUE INDEX IF NOT EXISTS`. Single-column `unique()` (slugs, names — like `items.slug`) is fine and stays a `unique()`. |
| Drop / rename a column or table; `ALTER TYPE … ADD VALUE`; data-preserving transform | `migrate.ts` pre-step (guarded), then update `schema.ts` to match — push never destroys data itself. |
| Seed rows / backfill values for existing rows | **Not** a migration — an `ensure*` / `backfill*` boot step in `packages/middleware/src/index.ts` (below). |

## The silent-skip caveat (new tables + companion columns)

Against a **populated** database, `drizzle-kit push` treats a brand-new table as a `pgSuggestions`
"do you want to truncate?" change. In the non-TTY deploy it **bails at that prompt while exiting 0**,
so the table — *and every additive statement it hadn't applied yet in the same run, including plain
nullable `ADD COLUMN`s* — is **silently skipped**. The deploy "succeeds", but the table/column never
exists and every query against it 500s with `relation … does not exist` / `column … does not exist`.
This is the most common cause of a "missing table/column" 500 right after a deploy.

So **pre-create every new table and pre-add its companion columns** (e.g. an FK column added to an
existing table in the same release) in `migrate.ts` with idempotent `IF NOT EXISTS` DDL that mirrors
`schema.ts`. Keep the pre-create **self-contained — no `REFERENCES` to a table push creates**
(`migrate.ts` runs *before* push, so on a fresh database the referenced table may not exist yet).
Declare FK columns as a plain `uuid` and let push add the FK constraint afterward (that part is
additive and never prompts).

Example — a new `widgets` table plus a nullable `items.widget_id` column in the same release:

```ts
// packages/middleware/src/db/migrate.ts
import { sql } from "drizzle-orm"; // not imported yet in the starter — add it with your first step

const migrations: RuntimeMigration[] = [
  {
    name: "pre-create widgets table",
    run: db => db.execute(sql`CREATE TABLE IF NOT EXISTS "widgets" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "slug" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "widgets_slug_unique" UNIQUE("slug")
    )`),
  },
  {
    name: "pre-add items.widget_id",
    run: db => db.execute(sql`ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "widget_id" uuid`),
  },
];
```

Match drizzle's generated names (e.g. `<table>_<column>_unique` for a single-column `.unique()`) so
push sees the object as already present and its diff for it is empty. Verify against a real Postgres:
run `pnpm push:dev` on a database that has the old schema and some rows, confirm the table/column
appears, then run it again and confirm it is a no-op.

## Composite uniques: `uniqueIndex()`, not `unique()`

A composite table `unique("x").on(t.a, t.b)` can make push **re-propose it on every deploy even when
it already exists and matches** — the same truncate prompt → non-TTY bail → push exits 0 and silently
skips the rest of its additive diff (so a later, unrelated new column never gets added). A
`uniqueIndex("x").on(t.a, t.b)` converges cleanly and applies via `CREATE UNIQUE INDEX IF NOT EXISTS`
with no prompt. Not every composite `unique()` reproduces this, but `uniqueIndex()` always behaves —
prefer it for any composite unique so the trap can't recur.

## Writing a `migrate.ts` pre-step

The `migrations` array in `packages/middleware/src/db/migrate.ts` is **empty** on a fresh project; the
mechanism is there for when you need it. Each entry is `{ name, run: db => db.execute(sql`…`) }`.

Rules (each one has bitten before):

- **Idempotent, always.** Every step runs on *every* boot: `IF EXISTS` / `IF NOT EXISTS` for
  columns/tables/indexes, check `pg_constraint` by name before adding a constraint (a `DO $$ … $$`
  block works), check-before-mutate for data transforms.
- **Exactly one SQL statement per `db.execute()`.** Drizzle's extended-protocol queries run only the
  first statement of a multi-statement string. One `ALTER TABLE … ADD COLUMN a, ADD COLUMN b` or one
  `DO $$…$$` block is fine; two semicolon-separated statements are silently half-applied — split them
  into separate entries.
- The pre-step runs **before** push, so afterwards push's diff for that item is empty — that is the
  whole point. Keep `schema.ts` and the pre-step describing the **same end state**.
- For a NOT NULL column on a populated table: add it nullable, backfill, then `SET NOT NULL` — three
  guarded steps — so push finds nothing left to do.

### Pruning spent steps

Once a step has run on every deployment you care about, it is spent: a fresh database gets the full
schema from push. You may delete it from the array. **This is safe only if you control every
deployment.** If the app is distributed to self-hosters who might skip versions, keep the steps (or
tag the last release that carries them and document that upgrades must pass through it).

## Seeds and backfills — boot steps, not migrations

Data that depends on application logic (built-in rows, derived slugs, jsonb reshapes) runs from the
boot-steps `try` block in `packages/middleware/src/index.ts` (today it only holds `ensureBucket()`).
Two shapes:

- **`ensure*` seeds** — rows a fresh install needs (a default/built-in record). These stay
  permanently. Use `insert(...).values(...).onConflictDoNothing()` on a unique column so re-runs are
  no-ops.
- **`backfill*` one-time transforms** — fill a new field for rows that predate it. Temporary: every
  create path should write the field, so once applied everywhere the backfill can be pruned (same
  caveat as above).

Rules:

- **Idempotent and cheap to re-run** — they execute on every boot.
- **They run *after* `app.listen()`** so `/healthz` and `/api/*` stay reachable while a slow step runs
  on modest hardware. Never move `listen` after the boot steps.
- **Ordering matters when one seed reads another's output.** Express the dependency by **threading
  the produced value as an argument**, not by comment-only ordering (which breaks silently under a
  refactor):
  ```ts
  const defaultGroupId = await ensureDefaultGroup();
  await ensureDefaultItems(defaultGroupId);
  ```
- A seed that should run only until the user takes ownership must distinguish `null`
  (never initialized) from an explicit empty value the user chose.

## Verify

- `pnpm push:dev` (or `pnpm dev`) applies cleanly against a local database **with data**, **twice in a
  row** — the second run proves idempotency and an empty push diff.
- `pnpm typecheck` + `pnpm --filter=@app/middleware test`.
- If the change adds/removes a field on a shared type, update the matching route body schema (see the
  **`add-endpoint`** skill — an undeclared field is silently stripped) and the client factory defaults
  in `packages/client/src/test-utils/factories.ts` in the same change.
