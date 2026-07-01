# eeSimple Bookmarks

Self-deploy app for saving and organizing bookmarks.

eeSimple Bookmarks is a full-stack TypeScript pnpm monorepo: a React client, a Fastify API, a shared types
package, and a production gateway that ties them together behind a single port. It mirrors the
tooling and architecture of [course-tracker](https://github.com/emilyeserven/course-tracker).

## Architecture

| Package | Scope | Description |
|---|---|---|
| `packages/types` | `@eesimple/types` | Shared TypeScript types (the API ↔ client contract). |
| `packages/middleware` | `@eesimple/middleware` | Fastify 5 API with Drizzle ORM + PostgreSQL, Swagger UI at `/docs`. |
| `packages/client` | `@eesimple/client` | React 19 + Vite + TanStack Router/Query/Form + Tailwind 4. |
| `packages/gateway` | `@eesimple/gateway` | Fastify reverse proxy and production entrypoint. |

**Build order:** types → middleware → client (the gateway has no build step).

**Tech stack:** Node 22, pnpm 10, TypeScript 5.9 (strict, ES2022). Quality gates via ESLint
(`@emilyeserven/eslint-config`), Husky + commitlint (Conventional Commits), and
[Fallow](https://github.com/fallow-rs/fallow) for dead-code / duplication / complexity audits.

## Local development

Prerequisites: Node 22, pnpm 10 (`corepack enable`), and Docker.

```bash
pnpm install                              # install all workspace dependencies
cp packages/middleware/.env.example packages/middleware/.env
pnpm dev                                  # starts Postgres, pushes the schema, runs all packages
```

`pnpm dev` brings up the database via Docker Compose, applies the schema (`drizzle-kit push`, after
the runtime-migrations hook), then runs the types watcher, the API (http://localhost:3001, docs
at `/docs`), and the client (http://localhost:5173) concurrently. The API auto-seeds a sample
bookmark on first run.

The schema is managed with **`drizzle-kit push`**, like
[course-tracker](https://github.com/emilyeserven/course-tracker): for additive changes (new tables,
columns, constraints) just edit `packages/middleware/src/db/schema.ts` — `push` diffs it against the
database and applies the delta on `pnpm dev` and on every deploy. There are no generated migration
files to write or commit.

Destructive or push-incompatible changes (dropping a column, `ALTER TYPE … ADD VALUE`, data
transforms) go in the idempotent runtime-migrations hook at
`packages/middleware/src/db/migrate.ts`, which runs before `push`.

### Object storage (Garage) for bookmark images

Bookmark images are compressed to an 800px WebP and stored in **Garage**, an S3-compatible object
store that runs as its own container (defined in `docker-compose.yml`). The `docker compose` commands
below are for **local development** — on Coolify you don't run them by hand (see
[Deploy to Coolify](#deploy-to-coolify)). `pnpm dev` only starts Postgres, so set Garage up once:

**1. Start Garage:**

```bash
docker compose up -d garage
```

**2. Initialize it (one time only).** Run each command and copy what it prints where noted:

```bash
# a) Find the node ID:
docker compose exec garage /garage status
#    → copy the node ID listed under "HEALTHY NODES" (the long id before the first space).

# b) Give the node a storage layout (1G is plenty for images) and apply it:
docker compose exec garage /garage layout assign -z dc1 -c 1G <node-id>
docker compose exec garage /garage layout apply --version 1

# c) Create an access key — COPY the "Key ID" and "Secret key" it prints (the secret is shown once):
docker compose exec garage /garage key create bookmarks-key

# d) Create the bucket and let the key read/write it:
docker compose exec garage /garage bucket create bookmarks
docker compose exec garage /garage bucket allow bookmarks --read --write --key bookmarks-key
```

**3. Put the key into your env.** In `packages/middleware/.env`:

```
S3_ENDPOINT=http://localhost:3900
S3_REGION=garage
S3_BUCKET=bookmarks
S3_ACCESS_KEY_ID=<the Key ID from step 2c>
S3_SECRET_ACCESS_KEY=<the Secret key from step 2c>
```

**4. Run the app** (`pnpm dev`) and add an image to a bookmark. To confirm it landed in storage:

```bash
docker compose exec garage /garage bucket info bookmarks
```

> Without the `S3_*` values the app still runs — only image upload / auto-capture returns a 503.

### Useful commands

```bash
pnpm build            # build types → middleware → client
pnpm test             # run all package tests
pnpm typecheck        # strict type checking across packages
pnpm lint / lint:fix  # ESLint (run from the repo root)
pnpm verify:changed   # lint + typecheck + test only the changed packages
pnpm fallow           # dead-code / duplication / complexity audit
pnpm studio           # Drizzle Studio (database GUI)
pnpm push:dev         # run the migrations hook, then push the schema to the local database
```

To reset the database: `docker compose down -v && docker compose up --wait db && pnpm push:dev`.

## Deploy to Coolify

eeSimple Bookmarks is built to self-deploy. In production a single Docker image (the repo-root `Dockerfile`)
runs the **gateway** on port **3000**: it serves the client's static build, proxies `/api/*` to the
middleware (spawned as a child process), and on boot brings the database schema up to date — it runs
the runtime-migrations hook (`dist/db/migrate.js`) and then `drizzle-kit push` — against
`DATABASE_URL`. The only configuration it needs is `DATABASE_URL`.

1. **Provision PostgreSQL.** In your Coolify project, add a PostgreSQL database (or use any external
   Postgres) and copy its connection string.
2. **Create the application.** New Resource → Application → connect this Git repository and branch →
   set the **Build Pack** to **Dockerfile** (Coolify uses the repo-root `Dockerfile`; no extra build
   configuration is required).
3. **Networking.** Expose container port **3000** and set the health check path to **`/healthz`**.
4. **Environment.** Add a single variable:

   ```
   DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
   ```

   (Coolify can inject the URL of a managed database for you.) The `POSTGRES_*` variables in
   `docker-compose.yml` are only for the local database and are **not** needed in Coolify.

   To browse the API docs on the deployed app, also set `DOCS_ENABLED=true` — the gateway then
   proxies the Swagger UI at `/docs` (it's off in production by default). The API is
   unauthenticated, so this makes the full surface publicly explorable; enable it deliberately.

   URL metadata auto-fill works out of the box with keyless sources (oEmbed, Open Library / Google
   Books, DuckDuckGo icons). Two **optional, default-off** providers can be enabled for harder cases
   by setting their env vars (see `packages/middleware/.env.example`): a Microlink-compatible
   `HOSTED_METADATA_ENDPOINT` for JS-rendered / bot-protected pages, and a `YOUTUBE_API_KEY` for the
   YouTube Data API. Both fall back to the keyless path when unset; their status is shown on
   **Settings → Connectors**. A self-hosted [Kavita](https://www.kavitareader.com/) server can also
   be connected there (`KAVITA_ENDPOINT` + `KAVITA_API_KEY`, or via the Connectors page) to link
   bookmarks to a Kavita series, with a "View on Kavita" link-out and series cover import.
5. **Deploy.** Coolify builds the multi-stage image and starts the gateway. The schema is applied
   automatically on first boot. Visit the app URL and check `GET /healthz` returns `{"status":"ok"}`.

> **If the schema didn't apply automatically.** The gateway runs the runtime-migrations hook and
> then `drizzle-kit push` on boot. If a deploy logged a schema error and the app is failing against
> a stale schema, you can apply it by hand from the container terminal (Coolify → the app →
> **Terminal**). Run it from the middleware package, not the gateway working directory:
>
> ```bash
> cd /app/packages/middleware && node dist/db/migrate.js && pnpm exec drizzle-kit push
> ```
>
> Running these from `/app/packages/gateway` (the default directory) fails — the gateway package
> has no `drizzle-kit` dependency, no `drizzle.config.*`, and no migrations folder there.

### Object storage (Garage) for bookmark images

Bookmark images need an S3-compatible store. How Garage runs depends on your build pack:

**Docker Compose build pack (Coolify deploys `docker-compose.yml`).** Garage is already part of the
stack — Coolify starts `garage` next to `db` and `gateway`, and the `garage-data` / `garage-meta`
volumes from the compose file are managed by Coolify and **persist across redeploys**. There is
nothing to add and no volume to attach by hand. You only:

1. **Deploy the stack.** Coolify brings up `db`, `garage`, and `gateway` together — there is **no
   manual `docker compose up`** (that command is local-development only).
2. **Bootstrap Garage once.** Open the **`garage` container's Terminal** in Coolify (your stack → the
   `garage` service → **Terminal**). You're *inside* the container, so call the binary directly —
   **no `docker compose exec` prefix**:

   ```bash
   /garage status                                              # copy the node ID it prints
   /garage layout assign -z dc1 -c 1G <node-id>
   /garage layout apply --version 1
   /garage key create bookmarks-key                            # COPY the Key ID + Secret (shown once)
   /garage bucket create bookmarks
   /garage bucket allow bookmarks --read --write --key bookmarks-key
   ```

3. **Set the keys.** Add `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` (from step 2) to your Coolify
   environment, then redeploy. `S3_ENDPOINT` (`http://garage:3900`), `S3_REGION`, and `S3_BUCKET`
   already default correctly from `docker-compose.yml`.

**Using the Dockerfile build pack instead?** Then `docker-compose.yml` isn't used in production, so
add Garage as its **own** Coolify resource: New Resource → Docker Image `dxflrs/garage:v1.0.1`; mount
this repo's `garage.toml` at `/etc/garage.toml`; and **attach a persistent volume to both
`/var/lib/garage/data` and `/var/lib/garage/meta`** — without it, every redeploy wipes your images.
Run the same bootstrap (above) in that resource's Terminal, then add all five `S3_*` vars to the
**app** resource (`S3_ENDPOINT=http://<garage-service-name>:3900`) and redeploy.

> **Troubleshooting images.**
> - **Upload returns 503 / "storage not configured"** → `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`
>   is missing or wrong (set them *after* the bootstrap, then redeploy).
> - **`AccessDenied` in the logs** → the key wasn't granted on the bucket (re-run `bucket allow`).
> - **App can't reach storage** → `S3_ENDPOINT` must be Garage's **internal** hostname
>   (`http://garage:3900`), not `localhost`.
> - **Images vanish after a redeploy** → the Garage data volume isn't persisting (compose volumes
>   persist by default; on the Dockerfile path, make sure you attached one).

### How it works in production

The gateway (`packages/gateway/server.js`) spawns the middleware, restarts it with exponential
backoff if it crashes, waits for its `/healthz` probe, and serves `packages/client/dist` with an
SPA fallback. Everything runs in one container.

**Smoke-test the production image locally:**

```bash
docker compose up --build      # gateway on http://localhost:3000, Postgres alongside
```

#### Deploying with the Docker Compose build pack

If you deploy this `docker-compose.yml` directly (instead of the Dockerfile build pack above),
the `db` service publishes Postgres on the host. On a shared Coolify host where another stack
already binds host port `5432` (e.g. [course-tracker](https://github.com/emilyeserven/course-tracker)),
this fails with `Bind for 0.0.0.0:5432 failed: port is already allocated`. Set a free host port
for this stack — the gateway still reaches Postgres internally at `db:5432`, so only the host-side
mapping changes:

```
POSTGRES_HOST_PORT=5433
GATEWAY_HOST_PORT=3000
```

## Releases

Versioning and `CHANGELOG.md` are automated by
[release-please](https://github.com/googleapis/release-please) from Conventional Commit messages.
Use `type(scope): description` (e.g. `feat: add bookmark tag filtering`).
