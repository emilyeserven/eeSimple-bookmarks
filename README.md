# app-core

A self-hostable, full-stack TypeScript starter: **Fastify + Drizzle/Postgres** API, **React 19 +
Vite + TanStack Router/Query/Form + Tailwind 4 + shadcn/ui** client, and a single-container
**gateway** for production. It ships one tiny example feature (**Items**) so everything builds,
runs, and is tested end-to-end — replace it with your own.

It is designed to deploy on modest hardware, including a **Raspberry Pi 4/5** (64-bit OS), and to be
vibe-coded with [Claude Code](https://code.claude.com/): the `.claude/skills/` folder holds recipes
for the common changes (add an entity, add an endpoint, change the schema safely, write tests, keep
complexity down, run a cleanup sweep).

> This core was extracted from [eeSimple Bookmarks](https://github.com/emilyeserven/eesimple-bookmarks),
> which itself mirrors the tooling of
> [course-tracker](https://github.com/emilyeserven/course-tracker).

## Start a new project from this core

```bash
# 1. Copy the code (no history) into a new folder / repo
git clone --depth 1 --branch <this-branch> https://github.com/<owner>/<repo>.git my-project
cd my-project && rm -rf .git && git init -b main

# 2. Rename the scope, root package, DB/bucket names and display title
pnpm install
pnpm rename my-project --title "My Project"
pnpm install && pnpm --filter=@my-project/client routeTree

# 3. Check everything still passes, then commit
pnpm typecheck && pnpm lint && pnpm test
git add -A && git commit -m "chore: initial commit from app-core"
```

Then read `CLAUDE.md` (architecture + conventions) and start replacing the Items example — the
`add-entity` skill walks through adding a new entity end-to-end.

## Architecture

```
packages/
  types/       @app/types       shared TypeScript types (built to dist, native ESM)
  middleware/  @app/middleware  Fastify API: db/ (Drizzle schema + migrate.ts), routes/, services/, utils/, tests/
  client/      @app/client      React app: routes/ (file-based), components/, hooks/, lib/, stores/, test-utils/
  gateway/     @app/gateway     production entrypoint: applies the schema, spawns + proxies the API, serves the client
```

Build order: types → middleware → client. The gateway has no build step.

## Local development

Requirements: Node 22, pnpm 10 (`corepack enable`), Docker.

```bash
cp packages/middleware/.env.example packages/middleware/.env
pnpm install
pnpm dev          # starts Postgres (docker compose), pushes the schema, runs all packages
```

- Client: http://localhost:5173 (proxies `/api` to the middleware)
- API: http://localhost:3001 — Swagger UI at http://localhost:3001/docs
- Storybook: `pnpm --filter=@app/client storybook` → http://localhost:6006

### Useful commands

```bash
pnpm build            # build types → middleware → client
pnpm test             # run all package tests
pnpm typecheck        # strict type checking across packages
pnpm lint / lint:fix  # ESLint (always run from the repo root)
pnpm verify:changed   # lint + typecheck + test only the changed packages
pnpm fallow           # dead-code / duplication / complexity audit
pnpm studio           # Drizzle Studio (database GUI)
pnpm push:dev         # run the migrations hook, then push the schema to the local database
pnpm i18n:status      # translation coverage for src/locales/ja.json
```

To reset the database: `docker compose down -v && docker compose up --wait db && pnpm push:dev`.

### Object storage (Garage) — optional

`/api/files` stores uploads in **Garage**, an S3-compatible object store (any S3 API works). It's
optional: without the `S3_*` values the app runs normally and only the file routes return 503.
Garage runs behind the `storage` compose profile:

```bash
docker compose --profile storage up -d garage

# One-time bootstrap — copy what each command prints where noted:
docker compose exec garage /garage status                        # copy the node ID
docker compose exec garage /garage layout assign -z dc1 -c 1G <node-id>
docker compose exec garage /garage layout apply --version 1
docker compose exec garage /garage key create app-key            # COPY the Key ID + Secret (shown once)
docker compose exec garage /garage bucket create app
docker compose exec garage /garage bucket allow app --read --write --key app-key
```

Put the key into `packages/middleware/.env` (`S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`) and restart
`pnpm dev`. **For production, generate your own `rpc_secret` and `admin_token` in `garage.toml`**
(`openssl rand -hex 32`) — the committed values are for local development only.

## Deploying

In production a single Docker image (the repo-root `Dockerfile`) runs the **gateway** on port
**3000**. On boot it waits for Postgres, runs the runtime-migrations hook (`dist/db/migrate.js`) and
then `drizzle-kit push`, spawns the API as a child process (restarting it with backoff), proxies
`/api/*` to it, and serves the client build with an SPA fallback. The only required configuration is
`DATABASE_URL`; the health check path is **`/healthz`**.

### Docker Compose (any Linux host)

```bash
docker compose up -d --build                     # Postgres + app on http://localhost:3000
docker compose --profile storage up -d --build   # …plus Garage
```

Override `POSTGRES_PASSWORD`, `POSTGRES_HOST_PORT`, `GATEWAY_HOST_PORT`, etc. via a `.env` file next
to `docker-compose.yml`.

### Raspberry Pi

Supported: **Raspberry Pi 4 or 5 with a 64-bit OS** (Raspberry Pi OS 64-bit / Ubuntu arm64), 2 GB+
RAM (4 GB recommended), Docker Engine with the Compose plugin v2.24+. Every image in the stack is
multi-arch (`node:22-bookworm-slim`, `postgres:16-alpine`, `dxflrs/garage`). 32-bit OSes are not
supported.

Two ways to run it:

1. **Pull a prebuilt image (recommended).** The `Docker image` workflow
   (`.github/workflows/docker-publish.yml`) cross-builds `linux/amd64` + `linux/arm64` and pushes to
   GitHub Container Registry on every release (or run it manually from the Actions tab). On the Pi:

   ```bash
   APP_IMAGE=ghcr.io/<owner>/<repo>:latest \
     docker compose -f docker-compose.yml -f docker-compose.pi.yml up -d
   ```

   (For a private image, `docker login ghcr.io` first with a token that has `read:packages`.)

2. **Build on the Pi.** `docker compose up -d --build` works too; the first build takes a while.
   Storybook is skipped by default (`BUILD_STORYBOOK=0`) because it needs ~1.5 GB of RAM to build.

What's tuned for small hardware out of the box (all overridable via env):

| Setting | Default | Where |
|---|---|---|
| Postgres `shared_buffers` / `max_connections` | `128MB` / `30` | `POSTGRES_SHARED_BUFFERS`, `POSTGRES_MAX_CONNECTIONS` (compose) |
| API connection pool | `5` | `DB_POOL_MAX` |
| Node heap cap per process | `--max-old-space-size=384` | `NODE_OPTIONS` (compose) |
| API boot wait before the gateway gives up waiting | `120000` ms | `MIDDLEWARE_WAIT_TIMEOUT_MS` |
| Container health check start period | `120s` | `Dockerfile` `HEALTHCHECK` |
| Storybook in the image | off | `BUILD_STORYBOOK` build arg |
| Garage object storage | off | `--profile storage` |

Tips: put Docker's data dir (and so the Postgres volume) on an SSD rather than the SD card, and add
swap (e.g. 1–2 GB) if you build on a 2 GB Pi.

### Coolify (or any Dockerfile PaaS)

1. Provision PostgreSQL and copy its connection string.
2. New Application → this repo → **Build Pack: Dockerfile**.
3. Expose port **3000**, health check path **`/healthz`**.
4. Set `DATABASE_URL`. Optional: `DOCS_ENABLED=true` to expose `/docs` (the API is unauthenticated —
   enable deliberately), `BUILD_STORYBOOK=1` as a build argument to include `/storybook`.

With the **Docker Compose** build pack instead, Coolify deploys `docker-compose.yml` as-is. If
another stack already binds host port 5432, set `POSTGRES_HOST_PORT=5433`.

> **If the schema didn't apply automatically**, open a terminal in the app container and run it from
> the middleware package (not the gateway's working directory):
>
> ```bash
> cd /app/packages/middleware && node dist/db/migrate.js && pnpm exec drizzle-kit push
> ```

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (**required** in production) |
| `PORT` | Gateway port (default `3000`); the API listens on `MIDDLEWARE_PORT` (default `3001`) |
| `DOCS_ENABLED` | Serve Swagger at `/docs` and Storybook at `/storybook`. Unset = on in dev, off in production |
| `DB_POOL_MAX` | API Postgres pool size (default `5`) |
| `DB_WAIT_TIMEOUT_MS` / `SCHEMA_PUSH_ATTEMPTS` | Gateway boot: how long to wait for Postgres / how many schema-apply retries |
| `MIDDLEWARE_WAIT_TIMEOUT_MS` | How long the gateway waits for the API's `/healthz` (default `60000`, compose sets `120000`) |
| `LOG_LEVEL` | API log level (default `info`; `debug` logs request params/bodies) |
| `UPLOAD_MAX_BYTES` | Max upload size for `/api/files` (default 8 MB) |
| `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Object storage for `/api/files` |
| `POSTGRES_*`, `GATEWAY_HOST_PORT`, `GARAGE_S3_HOST_PORT`, `BUILD_STORYBOOK`, `NODE_OPTIONS`, `APP_IMAGE` | docker-compose only |

## Releases

Versioning and `CHANGELOG.md` are automated by
[release-please](https://github.com/googleapis/release-please) from Conventional Commit messages
(`feat: …`, `fix: …`). Commit messages are linted by commitlint and PR titles by the `PR Title`
workflow. Each release also publishes the multi-arch Docker image (see `release-please.yml` → `docker-publish.yml`).
