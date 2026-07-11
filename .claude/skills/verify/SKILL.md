---
name: verify
description: Run the eeSimple Bookmarks app locally (no Docker) and drive it in a browser to verify a change end-to-end — local Postgres setup, dev servers, API seeding, and Playwright screenshots.
---

# Verifying changes by running the app

Docker Hub is unreachable in the remote sandbox (the network policy 403s
`production.cloudfront.docker.com`), so don't use `docker compose` / the root `pnpm dev`. PostgreSQL
16 is installed locally instead.

## 1. Database (once per session)

```bash
sudo mkdir -p /tmp/verify-pgdata && sudo chown postgres /tmp/verify-pgdata
sudo -u postgres /usr/lib/postgresql/16/bin/initdb -D /tmp/verify-pgdata
sudo -u postgres /usr/lib/postgresql/16/bin/pg_ctl -D /tmp/verify-pgdata -l /tmp/verify-pgdata/log -o "-p 5432 -k /tmp" start
sudo -u postgres psql -h /tmp -c "CREATE DATABASE bookmarks;"
echo 'DATABASE_URL=postgresql://postgres:password@localhost:5432/bookmarks' > packages/middleware/.env
```

(Auth is `trust`, so the password in the URL is ignored. The `.env` is gitignored.)

**Gotcha:** on a truly fresh database `pnpm push:dev` fails — `migrate.ts` runs first and some steps
(e.g. `ALTER TABLE custom_properties DROP COLUMN IF EXISTS …`) assume their table exists. Run push
before migrate instead:

```bash
cd packages/middleware
pnpm exec dotenv -e .env -- drizzle-kit push --force   # creates the whole schema
pnpm run migrate:dev                                    # now converges cleanly
```

## 2. Dev servers

```bash
cd packages/middleware && pnpm dev   # background; API on :3001, seeds a little sample data on boot
cd packages/client && pnpm dev      # background; Vite on :5173, proxies /api to :3001
```

Expect console/network 503s for image endpoints — the S3 vars are unset; that's normal noise.

## 3. Seed purposeful data via the API

The seed gives ~1 bookmark; create what the change needs through the same API the UI uses
(`http://localhost:3001/api`). Useful shapes:

- `POST /api/bookmarks` `{ url, title, categoryId, tagIds }`
- `PUT /api/bookmarks/:id/relationships`
  `{ relationships: [{ bookmarkId, relationshipTypeId, label?, direction? }] }`
- `GET /api/tags`, `/api/categories`, `/api/relationship-types` for ids.

## 4. Drive it with Playwright

Playwright is NOT a repo dependency. Install `playwright-core` in the session scratchpad
(`npm init -y && npm install playwright-core`) and launch the pre-installed Chromium:

```js
import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
await page.goto("http://localhost:5173/bookmarks/<id>", { waitUntil: "networkidle" });
```

Gotchas:
- The bookmark detail page defaults to the **single-column stacked body** (all view tabs rendered in
  one scroll), so there may be no tab strip to click — scroll to the section instead
  (`page.locator(...).scrollIntoViewIfNeeded()`).
- `text=Foo` is substring-matching; section descriptions often contain feature names, so prefer
  `getByText("Foo", { exact: true })` or a structural selector.
- Both themes: pass `colorScheme: "light" | "dark"` at `newPage` time.
