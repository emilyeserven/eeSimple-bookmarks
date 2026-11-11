# app-core — Architecture & Conventions

## Project summary

A self-hostable, full-stack TypeScript starter in a pnpm-workspace monorepo. It ships one example
entity (**Items**) that demonstrates every layer end-to-end; real projects replace it. Deployment
targets include low-power hosts such as a **Raspberry Pi 4/5 (64-bit)** — keep changes Pi-friendly
(see **Raspberry Pi constraints** below).

## Tech stack

- **Runtime & build:** Node 22, pnpm 10, TypeScript 5.9 (strict, ES2022, `moduleResolution: bundler`)
- **Frontend:** React 19, Vite 8, TanStack Router (file-based) / Query / Form, Tailwind CSS 4,
  shadcn/ui primitives, zustand, sonner, vite-plugin-pwa
- **Backend:** Fastify 5, Drizzle ORM, PostgreSQL 16, Swagger UI, optional S3-compatible object
  storage (Garage)
- **Testing:** Vitest + Testing Library (client), Node test runner (middleware/types). See the
  **`test-structure`** skill (fake-`db` harness, `renderWithRouter`, MSW as a story-only tool),
  **`vitest-node-environment`** (when a pure client `.test.ts` opts into `// @vitest-environment node`),
  and **`what-not-to-test`**. The client Vitest config (`packages/client/vite.config.ts`)
  auto-partitions tests into **three projects**: mock-free files run with `isolate: false` in
  persistent workers, while files using `vi.mock`-family or global-stub APIs keep per-file
  isolation — so **prefer mock-free tests**. The non-isolated path relies on the fresh-world reset
  in `test-utils/setup.ts`: a new zustand store goes in `RESETTABLE_STORES` and any other mutable
  module singleton registers a callback via `registerReset` in `test-utils/resetStores.ts`. Mock the
  toast stack only through `test-utils/toastSpies.ts`.

## Monorepo layout

- **types** (`@app/types`) — shared TypeScript definitions; builds to `dist` (native ESM).
- **middleware** (`@app/middleware`) — Fastify API. `src/`: `db/` (Drizzle schema + client +
  `migrate.ts`), `routes/`, `services/`, `utils/`, `tests/`, `app.ts`, `index.ts`.
- **client** (`@app/client`) — React frontend. `src/`: `routes/` (file-based, with route-only code
  colocated in `-components`/`-utils`/`-constants` folders — see **Routing & colocation**),
  `components/` (shared components; `ui/` = vendored shadcn), `hooks/`, `lib/` (`api/` per-entity
  clients), `stores/`, `test-utils/`.
- **gateway** (`@app/gateway`) — Fastify reverse proxy, the production entrypoint (`server.js`).

Build order: types → middleware → client. The gateway has no build step.

## Key commands

```
pnpm dev              # Postgres (docker compose) + schema push + all packages concurrently
pnpm build            # build types → middleware → client
pnpm test             # run all tests
pnpm typecheck        # strict type checks
pnpm lint:fix         # auto-fix ESLint issues (always run from the repo root)
pnpm verify:changed   # lint/typecheck/test only changed packages
pnpm fallow           # dead-code / duplication / complexity audit
pnpm studio           # Drizzle Studio
pnpm push:dev         # run migrate.ts then drizzle-kit push against the local database
pnpm rename <name>    # one-time rename of scope/package/db names for a new project
```

Package-scoped commands use `pnpm --filter=@app/<name>`.

## The example feature (Items) — the reference for every new entity

Each layer has exactly one Items file; copy them when adding an entity (the **`add-entity`** skill
has the full checklist):

| Layer | File |
|---|---|
| Shared types | `packages/types/src/items.ts` (re-exported from `index.ts` with a `.js` extension) |
| Table | `packages/middleware/src/db/schema.ts` |
| Service | `packages/middleware/src/services/items.ts` (throws `AppError` subclasses, slugs via `utils/slug.ts`) |
| Route | `packages/middleware/src/routes/items.ts` (module-level JSON-schema consts), registered in `app.ts` |
| Server test | `packages/middleware/src/tests/items.test.ts` (in-memory fake db) |
| Client API | `packages/client/src/lib/api/items.ts` (`createCrudApi`) |
| Query hooks | `packages/client/src/hooks/useItems.ts` (module-level query key, toasts on mutations) |
| Page | `packages/client/src/routes/items/index.tsx` + `NAV_ITEMS` in `components/AppSidebar.tsx` |
| UI | `packages/client/src/routes/items/-components/ItemsManager.tsx` + `.test.tsx` + `.stories.tsx` |
| Test data | `makeItem` in `test-utils/factories.ts`, MSW handlers in `test-utils/story-mocks.ts` |

## Conventions

- **ESLint** uses the flat config in `eslint.config.js`, which re-exports
  `@emilyeserven/eslint-config`. Run `pnpm lint:fix` from the repo root — running from a package
  produces import ordering that CI rejects.
- **Import cap:** `import/max-dependencies` is an `error` at **20** non-type module dependencies for
  the client/types/gateway/scripts (the shared config excludes `packages/middleware/src/**`). A file
  over the cap is a coordination smell — **split it, don't exempt it**. Only genuine by-design hubs
  (a registry, the `@app/types` barrel) may carry a file-top
  `/* eslint-disable import/max-dependencies -- reason */`; `components/ui/**` is already off. Don't
  raise the cap.
- **Conventional Commits** are enforced by commitlint (commit-msg hook) and the `pr-title` workflow.
  Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
  `revert`. release-please derives `CHANGELOG.md` and versions from them. **PR titles** need the
  prefix too, plus the issue number (e.g. `(#12)`) when the PR closes an issue.
- **Git hooks** (Husky): pre-commit runs `lint-staged`; commit-msg runs commitlint; **pre-push runs
  the merged-result typecheck** (`scripts/prepush-merged-typecheck.mjs`), which trial-merges
  `origin/main` and typechecks so a branch that only breaks once merged is caught locally. It only
  blocks on a real typecheck failure; bypass one push with `SKIP_MERGED_TYPECHECK=1 git push`.
- **Shared test factories** (`packages/client/src/test-utils/factories.ts`): construct shared entity
  objects in tests, stories, and MSW mocks with `make<Entity>(overrides)` — never an inline literal
  listing every field (it silently drifts when the type changes). Adding/removing a field on a shared
  type means updating its factory; a new shared entity gets a factory in the same change.
- **Path alias:** both the middleware and the client use `@/*` → `src/*` (the middleware resolves it
  at build time via `tsc-alias`).
- **`.js` import extensions in `@app/types`:** intra-package imports/re-exports must carry explicit
  `.js` extensions (`export * from "./items.js"`). Omitting them builds locally but breaks ESM
  resolution for consumers.
- **Cross-package string unions are `as const` tuples.** Any union that crosses a package boundary
  (a client zod enum, a middleware JSON-Schema `enum`, a settings value) is declared once in
  `@app/types` as `export const X = [...] as const; export type X = typeof X[number];`, and every
  wire schema spreads it (`z.enum(X)` / `enum: [...X]`). Per-variant maps are typed
  `Record<Union, …>` so a new variant fails `tsc` until handled. Never hand-copy the literal list.
- **Shared payload types must be consumed.** A request/response type in `@app/types` must be imported
  by the route that implements it (type the parsed body with it beside the JSON schema) and by the
  client API module. New types go in a domain module (`items.ts`, …); `index.ts` only re-exports.
- **Fastify `removeAdditional` trap.** Route bodies are `additionalProperties: false`, and Fastify's
  AJV config **silently strips** undeclared properties. A new body field that isn't added to the
  route's JSON schema never reaches the service. See the **`add-endpoint`** skill.
- **API error envelope — services `throw`, one handler, one shape.** Every user-facing failure is an
  `AppError` (`packages/middleware/src/utils/errors.ts`) with a stable `code`, HTTP `statusCode`,
  English `message`, optional `params`; `utils/errorHandler.ts` serializes it to
  `{ message, code, statusCode, params? }`. The server owns the wording: `describeError`
  (`lib/apiError.ts`) is the single place that turns a caught error into toast text (the server's
  `message`), and callers branch on `code` only when they must react to a specific failure. See the
  **`api-errors`** skill.
- **Data shaping lives server-side.** Endpoints return render-ready shapes; joins, aggregation,
  grouping, counting and tree-building belong in middleware `services/`, not React hooks. Logic that
  must run on both sides (e.g. a filter predicate) lives once in `@app/types` and is called from both.
- **Toasts & auto-save.** User-meaningful writes report via `notifySuccess`/`notifyError`
  (`lib/notifications.ts`), which also records the toast in the persisted `notificationStore`.
  Edit forms prefer **per-field auto-save** (text on blur, toggles/selects on change, no Save
  button, no-op when unchanged) reporting through `notifyFieldSaved`/`notifyFieldSaveError`
  (`lib/autoSave.ts`) so the toast names the field — `ItemsManager`'s description field is the
  reference. Create forms keep an explicit submit. Device-local view prefs (theme, collapsed panels)
  live in `stores/uiStore.ts` and change instantly with no toast; anything that must sync across
  devices belongs in the database instead. See the **`toast-notifications`** skill.
- **Client data hooks.** One `hooks/use<Entity>.ts` per entity: module-level query-key consts, a
  list query, and mutations that invalidate their own key **plus every dependent query**. See the
  **`client-data-hooks`** skill.
- **UI primitives:** before adding a Radix/shadcn primitive, check `packages/client/src/components/ui/`
  — dialog, dropdown-menu, popover, sheet, sidebar, select, command, toggle-group, table/data-table,
  etc. already exist. Reuse them.
- **Large components/hooks:** fallow caps cognitive complexity at 25 and scores **each function
  independently**, counting +1 per hook call and per `??`/`&&`/ternary. Over the cap usually means
  hook density: move state + handlers into a controller hook / cohesive sub-hooks and pure helpers.
  Don't add `// fallow-ignore-next-line complexity`. See the **`decompose-over-cap`** skill.
- **Deprecation sunset:** a `@deprecated` export with zero references gets deleted in the same change.

## Routing & colocation

The client uses TanStack Router **file-based routing** under `packages/client/src/routes/`; the route
tree (`routeTree.gen.ts`) is generated. Anything that isn't a route is `-`-prefixed (`-rootLayout.tsx`,
`-components/`), which the generator ignores. Keep route files thin and colocate route-only code:

- Used by **one route** → that route's own `-components/` / `-utils/` / `-constants/` folder (with its
  test and story beside it). Reference: `routes/items/-components/ItemsManager.tsx`.
- Used by a **parent route and routes under it** → promote it to the highest `-` folder covering every
  user (the nearest common ancestor route), and no higher.
- Used across `-` folders that **don't share the same direct parent route** → move it to
  `src/components/` (components) or `src/lib/` (utils/constants).

See the **`tanstack-routes`** skill for file naming (`index`, `$param`, `route.tsx`, `_pathless`,
`name_` un-nesting, `(group)`, `$` splat), typed search params, and the full rules.

## Database schema changes

**`drizzle-kit push` is the source of truth**, not generated migration files. On boot the gateway
runs the runtime-migrations hook (`dist/db/migrate.js`) and then `drizzle-kit push`, which diffs
`src/db/schema.ts` against the live database and applies the delta. There is intentionally **no
`drizzle/` folder, journal, or `generate` script**. Push runs **without `--force`**, so the deploy
stays safe only while push's diff is **additive and prompt-free**:

- **Push-safe** (just edit `schema.ts`): a lone nullable column on an existing table, or a new index.
- **Needs an idempotent `migrate.ts` pre-step** (push would show an interactive prompt that crashes a
  non-TTY deploy — or worse, exits 0 and **silently skips the rest of its diff**):
  - a **new table** on a populated database — pre-create it (and its companion columns) with
    `CREATE TABLE IF NOT EXISTS` mirroring `schema.ts`; declare FK columns as plain `uuid` there and
    let push add the constraint;
  - a **unique constraint** added to an existing table with data;
  - a **NOT NULL** column added to an existing table (even with a default);
  - a **composite unique** — always declare it as `uniqueIndex()`, never a table `unique()`.
- **Destructive / push-incompatible** (drop/rename, `ALTER TYPE … ADD VALUE`, data transforms): an
  idempotent `migrate.ts` step (`IF EXISTS` / check-before-mutate).
- **Each `db.execute()` holds exactly one SQL statement.**
- **Data seeds/backfills** are idempotent `ensure*`/`backfill*` boot steps in
  `packages/middleware/src/index.ts`, which run after `app.listen()`.

See the **`db-schema-change`** skill for the full decision table.

## Raspberry Pi constraints

The stack must keep running on a Pi 4/5 (arm64, 2–4 GB RAM). When changing infrastructure or
adding dependencies:

- **Multi-arch only.** Base images and native deps must ship `linux/arm64` builds (check before
  adding a native npm module or a new compose service). No x86-only binaries.
- **Mind memory.** Defaults are sized small (Postgres `shared_buffers=128MB`, `DB_POOL_MAX=5`,
  `NODE_OPTIONS=--max-old-space-size=384`); heavy optional build steps (Storybook) are off by
  default in the image; optional services (Garage) sit behind a compose profile. Keep new optional
  services opt-in the same way.
- **Boot order stays tolerant of slow hardware.** The middleware calls `app.listen()` **before** its
  boot data-steps so `/healthz` and the gateway proxy stay reachable; the gateway waits on Postgres
  and the API with generous, env-configurable timeouts. Keep that ordering.
- **Prefer cross-built images** (`.github/workflows/docker-publish.yml`, `docker-compose.pi.yml`)
  over building on the device.

## Deployment

The gateway (`packages/gateway/server.js`) is the single production entrypoint: it waits for
Postgres, applies the schema (migrate.ts → `drizzle-kit push`), spawns the middleware as a child
process with backoff restarts, proxies `/api/*` (and `/docs` when `DOCS_ENABLED`), serves the
client build with an SPA fallback (only for `Accept: text/html`), and exposes `/healthz`. The root
`Dockerfile` builds everything; `docker-compose.yml` runs Postgres + the app (+ Garage with
`--profile storage`). Only `DATABASE_URL` is required. See `README.md` for Compose, Raspberry Pi,
and Coolify instructions, and the env-var table.

## Generated files (do not edit)

- `packages/client/src/routeTree.gen.ts` — regenerate with `pnpm --filter=@app/client routeTree`
  (also regenerated by the Vite plugin during `dev`/`build`).
- `pnpm-lock.yaml` — only `pnpm install` should modify it.
- `.claude/skills/fallow/` — **vendored** from the `fallow` npm package. After bumping `fallow`, run
  `pnpm fallow:sync-skill` and commit; CI's `fallow-audit` fails if it drifts. Every other skill
  under `.claude/skills/` is hand-authored — edit directly, and keep them current when the code
  they describe changes.

## Skills index

`add-entity`, `add-endpoint`, `api-errors`, `client-data-hooks`, `db-schema-change`,
`decompose-over-cap`, `fallow`, `overnight-cleanup`, `storybook-story`, `tanstack-routes`,
`test-structure`, `toast-notifications`, `verify`, `vitest-node-environment`, `what-not-to-test`.
