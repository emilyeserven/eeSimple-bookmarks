# eeSimple Bookmarks — Architecture & Conventions

## Project summary

A full-stack TypeScript monorepo for saving and organizing bookmarks. Built with pnpm workspaces, mirroring the
tooling and architecture of [course-tracker](https://github.com/emilyeserven/course-tracker).

## Tech stack

- **Runtime & build:** Node 22, pnpm 10, TypeScript 5.9 (strict, ES2022, `moduleResolution: bundler`)
- **Frontend:** React 19, Vite, TanStack Router/Query/Form, Tailwind CSS 4
- **Backend:** Fastify 5, Drizzle ORM, PostgreSQL, Swagger UI
- **Testing:** Vitest + Testing Library (client), Node test runner (middleware)

## Monorepo layout

Four packages under `packages/`:

- **types** (`@eesimple/types`) — shared TypeScript definitions; builds to `dist`.
- **middleware** (`@eesimple/middleware`) — Fastify API. Layered `src/`: `db/` (Drizzle schema +
  client + seed), `routes/`, `services/`, `utils/`, `tests/`, `app.ts`, `index.ts`.
- **client** (`@eesimple/client`) — React frontend. `src/`: `routes/` (file-based), `components/`,
  `hooks/`, `lib/`, `stores/`, `test-utils/`.
- **gateway** (`@eesimple/gateway`) — Fastify reverse proxy, the production entrypoint (`server.js`).

Build order: types → middleware → client. The gateway has no build step.

## Key commands

```
pnpm dev              # Postgres + schema push + all packages concurrently
pnpm build            # build types → middleware → client
pnpm test             # run all tests
pnpm typecheck        # strict type checks
pnpm lint:fix         # auto-fix ESLint issues (always run from the repo root)
pnpm verify:changed   # lint/typecheck/test only changed packages
pnpm fallow           # dead-code / duplication / complexity audit
pnpm studio           # Drizzle Studio
pnpm push:dev         # push Drizzle schema to the local database
```

Package-scoped commands use `pnpm --filter=@eesimple/<name>`.

## Conventions

- **ESLint** uses the flat config in `eslint.config.js`, which re-exports
  `@emilyeserven/eslint-config`. Run `pnpm lint:fix` from the repo root — running from a package
  produces import ordering that CI rejects.
- **Conventional Commits** are enforced by commitlint (commit-msg hook) and the `pr-title` workflow.
  Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
  `revert`. release-please derives `CHANGELOG.md` and version bumps from them.
- **PR titles must also start with a Conventional Commits prefix** (e.g. `feat: …`, `fix: …`). The
  `pr-title` workflow (`amannn/action-semantic-pull-request`) lints the title independently of the
  commit messages, so a title without a valid `type:` prefix fails CI even when every commit is
  valid. When opening a PR — or if a PR title was auto-generated without one — set/rename the title
  to a valid prefix before expecting `lint-title` to pass. When a PR closes an issue, its title
  must also include the issue number (e.g. `(#102)`) — the `lint-title` workflow enforces this
  for any PR that has a closing-issue link.
- **Git hooks** (Husky): pre-commit runs `lint-staged`; commit-msg runs commitlint.
- **Path alias:** the middleware uses `@/*` → `src/*` (resolved at build time by `tsc-alias`).
- **`.js` import extensions in `@eesimple/types`:** the types package emits native ESM, so its
  intra-package imports/re-exports must carry explicit `.js` extensions (e.g.
  `export * from "./conditions.js"`), even though the source files are `.ts`. Omitting them builds
  locally but breaks ESM resolution for consumers.
- **UI primitives:** before adding a Radix/shadcn primitive, check
  `packages/client/src/components/ui/` — `dialog`, `dropdown-menu`, `popover`, `toggle-group`,
  `command`, etc. already exist (`Dialog` was once reintroduced twice). Reuse the existing one.
- **Inline-create modals:** the name-only "Add new X" dialogs (`AddCategoryModal`,
  `AddPropertyGroupModal`) are thin wrappers over the shared `InlineCreateModal`
  (`packages/client/src/components/InlineCreateModal.tsx`). A new one should wrap it too rather than
  re-implement the Dialog + name field + reset — see the **`inline-create-modal`** skill.
- **Layout/section patterns** are catalogued under **Content hierarchies** below — consult it
  before choosing how a detail/edit page or panel lays out its content.

## Content hierarchies

The client lays out page and panel content with a small, fixed set of hierarchies. Pick the one
that matches the surface — don't invent a new structure for a one-off page.

- **Flat `LabeledSection` stack** (`packages/client/src/components/LabeledSection.tsx`) — the
  default for detail/edit page content. A small heading + optional muted description sits in a left
  column (`md:col-span-1`, ~1/5) with its content on the right (`md:col-span-4`, ~4/5), stacking on
  narrow screens. Stack instances in a `space-y-6` container and divide them with `<Separator />`
  (`@/components/ui/separator`). **Don't wrap a detail/edit page's content in a card box**
  (`rounded-lg border bg-card`, shadcn `<Card>`) — the stack is the box. Refs:
  `AutofillRuleDetail`/`AutofillRuleForm`, the Website view/edit pages, `BookmarkDetail`,
  `PropertyDetail`.
- **Collapsible / accordion section** (`packages/client/src/components/CollapsibleFormSection.tsx`)
  — a trigger showing the title plus a one-line preview (hidden when open) and a rotating chevron,
  expanding to its full fields. Reach for it **only** when a section is long or optional and
  benefits from collapsing (e.g. autofill activation conditions, property options). Refs:
  `AutofillRuleForm`, `PropertyForm`, `HomepageSectionForm`.
- **Vertical-tabbed sidebar + `<Outlet/>`** (`packages/client/src/components/TabbedEntityLayout.tsx`,
  with the `TabWrapper.tsx` `createTabWrapper` factory and the shared `navLinkClass`) — a `header`
  over a left vertical `nav` (`sm:w-48`, active link highlighted) and a `min-w-0 flex-1` content
  pane holding `<Outlet/>`. The shell for slug-routed taxonomy entities: Categories, Custom
  Properties, Websites, Media Types, YouTube Channels, Tags. Each tab's body is itself a flat
  `LabeledSection` stack.
- **Flat no-tab detail wrapper** (`packages/client/src/components/TaxonomyDetailLayout.tsx`) — a
  loading/error/not-found wrapper that renders its children flat (a `LabeledSection` stack), no
  tabs. Used by Autofill rules.
- **Card boxes** — two distinct uses of the card token, never for detail/edit page content:
  - **List/row cards**: use `<RowCard>` from `@/components/ui/card` (renders `rounded-lg border
    bg-card`). Pass padding (`p-4`) or layout utilities (`group relative`) via `className`. Used in
    `CategoryManager`, `WebsiteManager`, `MediaTypeManager`, `YouTubeChannelManager`,
    `CategoryPreviewCard` (row variant), `BookmarkSearchView`, `HomepageSectionBlock`,
    `CustomPropertyManager`, `AutofillRulesList`.
  - **Settings panels**: use the shadcn `<Card>` with `<CardHeader>`, `<CardContent>`, etc.
    (`DisplaySettings`, `SidebarSettings`, `AutomationsSettings`, `LinkParsingSettings`,
    `HomepageSectionsSettings`).
- **URL-driven right panel** (`packages/client/src/components/panel/` — `RightPanel.tsx`,
  `PanelContent.tsx`, `contentTypes.tsx`) — URL-driven (`dOpen`/`dCT`/`dCId`/`dMode`): content-type
  tiles → searchable list → view/edit. It must achieve **feature and component parity** with the
  main app: a single item viewed/edited in the panel reuses the **same** components the main app
  renders for that entity (e.g. `BookmarkCard`/`BookmarkForm`, `CategoryCard`, `PropertyCard`,
  `WebsiteRow`), in their narrow/mobile layout — never a panel-only variant. Build entity
  views/forms as responsive, reusable components so both surfaces share them, and register each
  content type in `panel/contentTypes.tsx`.

**Current divergences (to be reconciled):**

- Single-tab entities (Tags, YouTube Channels, Media Types, Property Groups) use the full tabbed
  shell for a single "General" tab.

## Data shaping: middleware vs. client

**Default rule:** API endpoints return *render-ready* shapes. Heavy joins, aggregation, grouping,
tree-building, counting, and condition/relationship derivation belong in the middleware's
`services/`, **not** in React components/hooks. If a component is joining across query results,
grouping, aggregating, or building a tree from a flat list, that shape should come from an endpoint
instead.

**Patterns to mirror** (the middleware already does the heavy lifting — follow these):

- **Counts** — `computeTagBookmarkCounts` (subtree + own counts) in `services/tags.ts`; the category
  bookmark-count subquery in `services/categories.ts`. The client renders the number; it doesn't
  tally rows.
- **Trees** — `buildTagTree` / the media-type tree returned by `/api/tags/tree` and
  `/api/media-types/tree`. The client only flattens for indentation.
- **Batched hydration** — `hydrateBookmarkRows` (`services/bookmarkHydration.ts`) joins
  website/mediaType/channel/tags/property-values/images into a render-ready `Bookmark` with no N+1.
- **"Load once → evaluate the shared predicate in-memory → hydrate matches"** —
  `listHomepageSectionBookmarks` (`services/homepageSections.ts`) and `previewAutofillMatches`
  (`services/autofill.ts`) both load via the **bookmark cache** (below) and run the **shared**
  `evaluateConditions` from `@eesimple/types`. Server-side processing that shares logic with the
  client must call the same `@eesimple/types` function — never a re-implementation or a parallel SQL
  translation of the same predicate.

**Sanctioned exceptions that stay client-side** (don't "fix" these by adding endpoints):

- **Interactive, URL-driven filter/search state** — `lib/bookmarkSearch.ts`
  (`bookmarkMatchesSearch`) and the range sliders / multi-selects it backs. A round-trip per slider
  drag would hurt; the bookmarks page deliberately fetches the whole set once and filters in memory.
- **Presentation formatting** — `lib/bookmarkFormat.ts` (number/boolean/date-time display).
- **Derivations that are O(n) over data the page already loaded** — slug lookups (`use*BySlug`),
  facet slider bounds (`effectiveBounds`), and "which rules target this entity"
  (`lib/autofillRulesFilter.ts`). These are free because the list is already in cache; an endpoint
  would only duplicate logic.

**Caching / growth path.** When work must move server-side but the logic is shared with the client
(filtering, condition matching), prefer the **middleware in-memory cache + shared predicate** over
translating predicates to SQL. `services/bookmarkCache.ts` holds the bookmark rows + per-bookmark
`ConditionInput`s + tag-descendant resolver, rebuilt on a version bump; it is coherent because the
gateway runs a single middleware child. **Every write that changes a bookmark's matchable data (the
bookmark row, its tags, or its custom-property values) — or the tag tree — must call
`invalidateBookmarkCache()`** (see the calls in `services/bookmarks.ts`, `services/tags.ts`, and
`services/customProperties.ts`). This keeps one source of truth for the predicate while moving the
work off the client. SQL-level filtering is the last resort, reserved for genuinely large datasets.

## Generated files (do not edit)

- `packages/client/src/routeTree.gen.ts` — regenerate with `pnpm --filter=@eesimple/client routeTree`
  (also auto-regenerated by the Vite plugin during `dev`/`build`).
- `pnpm-lock.yaml` — only `pnpm install` should modify it.
- `.claude/skills/fallow/` — **vendored** from the `fallow` npm package, not hand-written. After
  bumping `fallow`, run `pnpm fallow:sync-skill` and commit the result. CI's `fallow-audit` workflow
  runs `pnpm fallow:check-skill` and fails if the committed copy drifts from the installed package,
  so a `fallow` bump turns the PR red until it's re-synced. Every **other** skill under
  `.claude/skills/` is hand-authored and app-specific — edit those directly. (`fallow` is the only
  installed package that ships a Claude skill; nothing else needs vendoring.)

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

- **Truly push-safe additive changes** (new tables; nullable columns on existing tables; new
  indexes): just edit `src/db/schema.ts`. `push` applies them without prompting on `pnpm dev` and
  on every deploy. No migration file, no `drizzle-kit generate`.
- **Additive changes that trigger a push prompt** — `drizzle-kit push` runs non-interactively in
  production (non-TTY, stdin = `/dev/null`). Certain additive changes still cause an interactive
  confirmation that crashes the deploy (and `--force` does **not** bypass it):
  - **Unique constraints added to an existing table with data** — push warns the constraint may
    fail and asks to truncate (the `pgSuggestions` prompt). With no TTY it crashes the push run.
  - **`NOT NULL` columns added to an existing table** (even with a column-level `DEFAULT`) — push
    prompts before applying.

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

## Deployment

The **gateway pattern** uses `packages/gateway` as the single production entrypoint: a Fastify
server that spawns the middleware as a child process, proxies `/api/*` to it, serves the client's
static build, runs `drizzle-kit push` on boot, and respawns the middleware with backoff. The
root `Dockerfile` builds everything for production. Deploy via Coolify using only `DATABASE_URL`
(see `README.md`).

The middleware calls `app.listen()` **before** running its boot data-steps (`ensure*` / `backfill*`
in `src/index.ts`) so the gateway's `/healthz` probe and `/api/*` proxy stay reachable even if a
boot step is slow on modest hardware — keep that ordering when adding boot steps. The gateway waits
on the middleware with a configurable timeout (`MIDDLEWARE_WAIT_TIMEOUT_MS`, default 60s; database
readiness uses `DB_WAIT_TIMEOUT_MS`).

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | middleware / gateway | PostgreSQL connection string |
| `POSTGRES_USER` | docker-compose | DB user (default: `postgres`) |
| `POSTGRES_PASSWORD` | docker-compose | DB password (default: `password`) |
| `POSTGRES_DB` | docker-compose | DB name (default: `bookmarks`) |
| `POSTGRES_HOST_PORT` | docker-compose | Host port mapped to the db container's 5432 (default: `5432`). Override to avoid host port collisions on a shared host. |
| `GATEWAY_HOST_PORT` | docker-compose | Host port mapped to the gateway's 3000 (default: `3000`). |
| `S3_ENDPOINT` | middleware / gateway | Object-storage (Garage/S3) endpoint for bookmark images, e.g. `http://garage:3900`. |
| `S3_REGION` | middleware / gateway | Object-storage region (default: `garage`; must match `garage.toml`'s `s3_region`). |
| `S3_BUCKET` | middleware / gateway | Bucket for bookmark images (default: `bookmarks`; auto-created on boot). |
| `S3_ACCESS_KEY_ID` | middleware / gateway | Object-storage access key. Image routes return 503 until set. |
| `S3_SECRET_ACCESS_KEY` | middleware / gateway | Object-storage secret key. |
| `GARAGE_S3_HOST_PORT` | docker-compose | Host port mapped to Garage's S3 API 3900 (default: `3900`). |
| `STORAGE_QUOTA_BYTES` | middleware / gateway | Optional storage quota in bytes shown in the Gallery UI alongside used space (e.g. `10737418240` for 10 GB). Omit to hide the quota line. |

Bookmark images are compressed to a 1200px WebP and stored in object storage (Garage by default),
served via `GET /api/bookmarks/:id/image`. Without the `S3_*` vars the app runs normally but image
upload/auto-capture returns 503. See `README.md` → "Object storage (Garage)" for the one-time setup.

See `packages/middleware/.env.example`.
