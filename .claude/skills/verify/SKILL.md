---
name: verify
description: >-
  Verify a change before committing — run the static gate (lint / typecheck / tests for the changed
  packages) and, for anything user-visible, run the app locally without Docker and drive it in a
  browser: local Postgres setup, schema push, dev servers, seeding data through the API, and
  Playwright screenshots. Use when asked to "verify", "check this works", "run the app", "take a
  screenshot", "test it end to end", or right before a commit.
---

# Verifying a change

Two layers: the **static gate** always, then **run the app** whenever the change is user-visible
(UI, API behavior, schema). Tests passing is not proof a page works.

## 0. Static gate

```bash
pnpm verify:changed      # lint + typecheck + tests, only for packages changed vs origin/main
```

`scripts/verify-changed.mjs` diffs `packages/` against the merge-base with `origin/main` (override
with `VERIFY_BASE=<ref>`) plus uncommitted changes, builds `@app/types`, typechecks the changed
packages, runs `pnpm lint` (always from the repo root), then tests: the client via
`vitest run --changed <merge-base>` (only tests whose import graph touches a changed module), the
other packages via their full `test` script (the gateway has none). If it can't resolve the
merge-base it falls back to comparing against `HEAD` only.

The full gate CI runs (`.github/workflows/ci.yml`), when you want certainty:

```bash
pnpm typecheck
pnpm --filter=@app/types build && pnpm lint
pnpm --filter=@app/client test
pnpm --filter=@app/middleware test
pnpm --filter=@app/types test
pnpm build && pnpm --filter=@app/client build-storybook   # CI's build job — Storybook is gated here
```

Also relevant to a push: the pre-push hook (`scripts/prepush-merged-typecheck.mjs`) typechecks the
branch merged with `origin/main`; `pnpm fallow` is the dead-code / complexity audit the
`fallow-audit` workflow runs (see the **`fallow`** skill). If tests fail, see **`test-structure`** /
**`vitest-node-environment`** — never skip or loosen a test to go green (**`what-not-to-test`**).

## 1. Database (once per session)

Docker Hub may be unreachable in a remote sandbox (the network policy can 403 its CDN), so don't
rely on `docker compose` / the root `pnpm dev` there. If PostgreSQL 16 is installed locally, run it
directly:

```bash
sudo mkdir -p /tmp/verify-pgdata && sudo chown postgres /tmp/verify-pgdata
sudo -u postgres /usr/lib/postgresql/16/bin/initdb -D /tmp/verify-pgdata
sudo -u postgres /usr/lib/postgresql/16/bin/pg_ctl -D /tmp/verify-pgdata -l /tmp/verify-pgdata/log -o "-p 5432 -k /tmp" start
sudo -u postgres psql -h /tmp -c "CREATE DATABASE app;"
```

Auth is `trust`, so any password in the URL is ignored. The middleware and `drizzle.config.ts`
default `DATABASE_URL` to `postgresql://postgres:password@localhost:5432/app`, so with the database
above **no `.env` is needed**. On another port/name, either export `DATABASE_URL` for each command or
copy `packages/middleware/.env.example` to `packages/middleware/.env` (gitignored) and edit it.

Then create the schema:

```bash
pnpm push:dev     # runs migrate.ts (idempotent runtime migrations) then drizzle-kit push
```

This works on a fresh database as long as every `migrate.ts` step guards for a missing table. If a
migration step assumes its table exists and fails on an empty database, create the schema first with
`pnpm --filter=@app/middleware exec dotenv -e .env -- drizzle-kit push`, then rerun
`pnpm --filter=@app/middleware run migrate:dev` (and fix the step's guard — see the
**`db-schema-change`** skill).

## 2. Dev servers

Run each in the background:

```bash
pnpm --filter=@app/middleware dev   # API on :3001 (health: GET /healthz)
pnpm --filter=@app/client dev       # Vite on :5173, proxies /api to :3001
```

There is no boot seed — the database starts empty. Without the `S3_*` vars, `/api/files` returns 503;
that's expected noise.

## 3. Seed purposeful data via the API

Create what the change needs through the same API the UI uses (`http://localhost:3001/api`), e.g.
for the example entity:

```bash
curl -s -X POST localhost:3001/api/items -H 'content-type: application/json' \
  -d '{"name":"Alpha","description":"First item"}'
curl -s localhost:3001/api/items
```

The items routes are `GET/POST /api/items`, `GET/PATCH/DELETE /api/items/:id`
(`packages/middleware/src/routes/items.ts`); bodies are typed by `CreateItemInput` /
`UpdateItemInput` in `@app/types`. With docs enabled (the default outside production), the full
surface is browsable at `http://localhost:3001/docs`.

## 4. Drive it with Playwright

Playwright is NOT a repo dependency — don't add it. Install `playwright-core` in the session
scratchpad (`npm init -y && npm install playwright-core`) and launch a pre-installed Chromium (in the
remote sandbox: `/opt/pw-browsers/chromium`):

```js
import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
await page.goto("http://localhost:5173/items", { waitUntil: "networkidle" });
await page.screenshot({ path: "<scratchpad>/items-dark.png", fullPage: true });
```

Gotchas:
- `text=Foo` is substring-matching; descriptions and labels often contain the same word, so prefer
  `getByText("Foo", { exact: true })`, `getByRole`, or `getByLabel`.
- Auto-save fields persist **on blur** — after `fill`, blur the field (`press("Tab")`) and wait for
  the PATCH (`page.waitForResponse(r => r.url().includes("/api/items/") && r.request().method() === "PATCH")`)
  before asserting or screenshotting.
- Check both themes: pass `colorScheme: "light" | "dark"` at `newPage` time.
- Check phone width too (`viewport: { width: 390, height: 844 }`) for any layout change.
- Save screenshots to the scratchpad, not the repo, and look at them before reporting.
