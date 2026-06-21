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
- **Git hooks** (Husky): pre-commit runs `lint-staged`; commit-msg runs commitlint; **pre-push runs
  the merged-result typecheck** (`scripts/prepush-merged-typecheck.mjs`). CI typechecks the branch
  *merged with the latest `main`*, so a type change that passes a branch-only `pnpm typecheck` can
  still break once `main` has moved on (e.g. a new file on `main` referencing a field this branch
  removed — this is how PR #363 went red). The hook trial-merges `origin/main`, runs `pnpm
  typecheck`, then restores the tree. It only blocks on a real typecheck failure of the merged tree;
  offline / dirty tree / already-merged / merge-conflict each just warn and let the push through.
  Bypass one push with `SKIP_MERGED_TYPECHECK=1 git push`.
- **Shared test factories** (`packages/client/src/test-utils/factories.ts`): construct full shared
  entity objects in tests, stories, and MSW mocks with `makeCustomProperty` / `makeBookmark` /
  `makeCategory` (override only the fields a test cares about) — **never** re-list every field in an
  inline object literal. Inline literals of these types silently drift when a field is added/removed
  from the shared type and only surface as a CI typecheck failure (one such stray literal is what
  reddened PR #363). When you add or remove a field on `CustomProperty` / `Bookmark` / `Category`,
  update the factory's defaults — that is the single edit point.
- **Path alias:** the middleware uses `@/*` → `src/*` (resolved at build time by `tsc-alias`).
- **`.js` import extensions in `@eesimple/types`:** the types package emits native ESM, so its
  intra-package imports/re-exports must carry explicit `.js` extensions (e.g.
  `export * from "./conditions.js"`), even though the source files are `.ts`. Omitting them builds
  locally but breaks ESM resolution for consumers.
- **Validation schemas mirror the `@eesimple/types` unions by hand — update every copy in the same
  change.** The shared TS union/literal types (e.g. `CustomPropertyType`, the condition
  `predicate.valueKind`s) are **not** derived by any validator; each forms/runtime schema re-lists
  the variants manually, and nothing (no test, codegen, or `z.infer`) catches drift — so a forgotten
  copy silently **rejects** the new variant at the modal/API boundary even though `tsc` passes. When
  you add or remove a variant, update **all** of its mirrors:
  - **Client zod / select lists** — `propertyFormSchema.ts` (`type` enum), `AddCustomPropertyModal.tsx`
    (inline-create enum), and `TYPE_OPTIONS` in `lib/propertyForm.ts`.
  - **Middleware Fastify JSON Schema route bodies** — `routes/customProperties.ts` (`type` enum) and
    `routes/conditionSchema.ts` (the `propertyNode` predicate `valueKind` `oneOf` branches).

  Grep for an existing variant string (e.g. `"ratingScale"`) to find every list that needs the new
  value. (This drifted in PR #341: `image`/`file` reached the union and most schemas but not the
  inline-create modal or the file-predicate condition branch.)
- **UI primitives:** before adding a Radix/shadcn primitive, check
  `packages/client/src/components/ui/` — `dialog`, `dropdown-menu`, `popover`, `toggle-group`,
  `command`, etc. already exist (`Dialog` was once reintroduced twice). Reuse the existing one.
- **Inline-create modals:** the name-only "Add new X" dialogs (`AddCategoryModal`,
  `AddPropertyGroupModal`) are thin wrappers over the shared `InlineCreateModal`
  (`packages/client/src/components/InlineCreateModal.tsx`). A new one should wrap it too rather than
  re-implement the Dialog + name field + reset — see the **`inline-create-modal`** skill.
- **Layout/section patterns** are catalogued under **Content hierarchies** below — consult it
  before choosing how a detail/edit page or panel lays out its content.
- **Card Display Rules** (`Settings → Card Display Rules`) govern **per-card** display — field
  visibility + image presentation (aspect/visibility/layout/corner overlays) — for bookmark cards on
  listing pages. A rule is a `conditions` tree + display overrides + `sortOrder`, modeled on
  `homepage_sections` (inline drag-sortable list, no slug/detail pages). **Precedence is a layered
  merge**: for each attribute the highest-priority (lowest `sortOrder`) matching rule that sets a
  non-null value wins; lower rules fill the rest; a seeded, **non-deletable Default rule** (`isDefault`,
  always matches, pinned last, fully concrete — `ensureDefaultCardDisplayRule()` boot step) is the
  baseline. This differs from autofill's single-target last-writer merge — don't "fix" it to match.
  Non-default display columns are **nullable = inherit** (push-safe). Grid **column count** and
  **card/table view** stay page-level (`ListingDisplayControls`, the `DisplayOptionsPopover`, and
  Settings → Display "Listing Defaults"); everything else about how a card looks is configured **only**
  via rules — including the **hide-website-pill-for-YouTube** behavior (`useHideWebsiteForYouTube` now
  reads the Default rule; listing cards resolve it per-card, other surfaces/table use the Default).
  The old per-page/global field-visibility + image controls, the global "hide website for YouTube"
  toggle, and **Display Presets** were removed in favor of this. The `hiddenCardFields` key list
  (`STANDARD_CARD_FIELDS` + custom-property ids in `lib/bookmarkCardFields.ts`) is shared with
  homepage sections — keep in sync.

## Page-header breadcrumbs

The top app-bar breadcrumb trail is built in **one place** —
`packages/client/src/routes/-appHeader.tsx` (`breadcrumbsForPath()` + its helpers). It derives crumbs
from the **pathname** and enriches them with real entity names resolved via `use*BySlug` hooks. Don't
render a page-specific breadcrumb anywhere else; route components only set their own `<h1>`/`<h2>`
title (see **Content hierarchies**), never a header crumb. (The right-panel trail,
`components/panel/PanelBreadcrumbs.tsx`, is a **separate, intentionally distinct** system — it
navigates by `onClick` from a `Browse` root rather than by `<Link>`/pathname. Don't merge them.)

- **Shape:** `List → [ancestors…] → Name → [Section]`. Every crumb except the last is a `<Link>`
  (`BreadcrumbLink asChild`); the last is the current page (`BreadcrumbPage`, non-link).
- **Listing page** → one non-link crumb (`Categories`, `Bookmarks`, …). **Detail / `_view` tab** →
  `List(link) → Name`. **Edit tab** → `List(link) → Name(link → that entity's `…/general` view) →
  Section`. No bare `Edit` leaf when the entity has tabs — end on the tab's label.
- **Name resolves the real entity name** via the entity's `use*BySlug` hook — never a generic
  singular. The descriptor's `singular` is only a brief loading placeholder.
- **Most slug-routed entities share one builder.** Categories, Websites, Media Types, YouTube
  Channels, Property Groups, Custom Properties, and Autofill are all driven by `TAXONOMY_DESCRIPTORS`
  + `taxonomyCrumbs()`. Only **Tags** (ancestor chain), **Bookmarks** (category + title), and
  **Settings** stay bespoke.
- **Segment labels** come from the single `crumbLabel()` helper — a small `LABEL_OVERRIDES` map (only
  where the label differs from a title-cased slug, e.g. `youtube-channels → "YouTube Channels"`,
  `autofill → "Autofill Rules"`) unioned with a title-case humanizer (`shortened-links → "Shortened
  Links"`). Don't reintroduce per-section label maps; new tabs get a correct label for free.
- **Adding a new slug-routed entity** (see the **`add-entity`** skill) means **both**: add its
  `TAXONOMY_DESCRIPTORS` entry **and** resolve its name in `AppHeader` (a `use*BySlug` call feeding
  the `taxonomyNames` map). Skipping either falls through to the generic `"eeSimple Bookmarks"`
  fallback or shows the `singular` placeholder forever.

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
  - **Hierarchy tab rule:** every taxonomy whose schema row has a `parentId` tree — currently
    **Tags** and **Media Types** — gets a view-only **"Hierarchy"** tab (a "Parents" ancestor chain
    + a "Children" subtree), modeled on `routes/tags.$tagSlug._view.hierarchy.tsx`. It is added to
    `viewNav` only (omit it from `VIEW_TO_EDIT` so Edit falls back to General), resolves the node
    *with children* from the `use*Tree()` query (not the flat `use*BySlug`), reuses the generic
    `findAncestorPath`/`flattenTree` from `lib/tagTree.ts`, and renders the entity's `*TreeList`.
    Flat taxonomies (Categories, Websites, YouTube Channels, Property Groups) do **not** get one.
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
- **Card Display Rule resolution** — `lib/cardDisplayRules.ts` (`resolveCardDisplay` +
  `useResolveCardDisplay`) evaluates the shared `evaluateConditions` against each rendered bookmark in
  the listing grid (`BookmarkListPane`) to decide that card's field visibility + image presentation.
  It runs client-side because cards render client-side over already-cached rules/tags; there is **no**
  server bookmark endpoint for rules. The CRUD service (`services/cardDisplayRules.ts`) is therefore
  CRUD-only, and rules never touch `invalidateBookmarkCache()` (they're display-only, not matchable
  data).

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
| `DOCS_ENABLED` | middleware / gateway | Expose the Swagger/OpenAPI docs at `/docs` and the Storybook static UI at `/storybook`. `true`/`1` on, `false`/`0` off; unset defaults to on outside production and off in production. The middleware gates the `@fastify/swagger` registration on it; the gateway gates the `/docs` proxy and the `/storybook` static serving on it — all parse the flag identically, so set `true` to serve the docs and Storybook through the production gateway. Storybook is always built into the image (Dockerfile `build-client` stage → `packages/client/storybook-static/`); only the serving is gated. The API is unauthenticated, so this makes the full surface publicly explorable. |
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
