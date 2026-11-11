# eeSimple Bookmarks — Architecture & Conventions (index)

A full-stack TypeScript monorepo for saving and organizing bookmarks, built with pnpm workspaces and
mirroring the tooling of [course-tracker](https://github.com/emilyeserven/course-tracker). Single-user by
design; self-hosted (Coolify) behind a private network.

**This file is an index.** It lists the rules that apply to every change and points to the skill that holds
the full detail. Skills live in `.claude/skills/<name>/`; topics moved out of this file sit in that skill's
`reference.md`. **Before changing an area, read the skill named for it below.**

## Stack and layout

- Node 22, pnpm 10, TypeScript 5.9 (strict, ES2022, `moduleResolution: bundler`).
- Frontend: React 19, Vite, TanStack Router/Query/Form, Tailwind CSS 4.
- Backend: Fastify 5, Drizzle ORM, PostgreSQL, Swagger UI, `fast-xml-parser`.
- Tests: Vitest + Testing Library (client), Node test runner (middleware).
- Packages: `types` (`@eesimple/types`, shared types, builds to `dist`) → `middleware` (Fastify API:
  `db/`, `routes/`, `services/`, `utils/`, `tests/`) → `client` (React: `routes/`, `components/`, `hooks/`,
  `lib/`, `stores/`, `test-utils/`). `gateway` is the production Fastify proxy (`server.js`, no build).
  Build order: types → middleware → client.

Full detail: **`codebase-conventions`** (Tech stack, Monorepo layout).

## Key commands

```
pnpm dev              # Postgres + schema push + all packages concurrently
pnpm build            # build types → middleware → client
pnpm test             # run all tests
pnpm typecheck        # strict type checks
pnpm lint:fix         # auto-fix ESLint issues (always run from the repo root)
pnpm verify:changed   # lint/typecheck/test only changed packages
pnpm test:client:changed  # only client tests affected by your diff
pnpm fallow           # dead-code / duplication / complexity audit
pnpm studio           # Drizzle Studio
pnpm push:dev         # push Drizzle schema to the local database
```

Package-scoped commands use `pnpm --filter=@eesimple/<name>`.

## Rules for every change

Each rule is a one-line summary; the linked skill has the reasoning and the recipe.

**Tooling and git** (`codebase-conventions`)
- Run `pnpm lint:fix` from the repo root only; running it in a package gives import ordering CI rejects.
- `import/max-dependencies` is an error at 20 non-type deps (client, types, gateway/scripts). Split an
  over-cap file; exempt only by-design hubs. Never raise the cap or downgrade to `warn`.
- Conventional Commits (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
  `chore`, `revert`). PR titles need the prefix too, plus `(#issue)` when the PR closes an issue.
- The pre-push hook typechecks the branch merged with `origin/main`. Bypass once with
  `SKIP_MERGED_TYPECHECK=1 git push`.
- Don't edit generated files: `routeTree.gen.ts` (`pnpm --filter=@eesimple/client routeTree`),
  `pnpm-lock.yaml`, and the vendored `.claude/skills/fallow/` (`pnpm fallow:sync-skill`).

**Types and contracts** (`codebase-conventions`, `add-endpoint`, `api-errors`)
- Intra-package imports in `@eesimple/types` carry explicit `.js` extensions.
- Any string union that crosses a package boundary is an `as const` tuple + `typeof T[number]`; zod enums
  and JSON-Schema enums spread the tuple. Never hand-list the members again.
- New types go in a domain module, not the `types/src/index.ts` barrel. A payload type declared for an
  endpoint must be imported by that route.
- Fastify bodies are `additionalProperties: false` with AJV `removeAdditional`: a field missing from the
  schema is silently dropped. Add every new field to the route schema.
- Services `throw` an `AppError`; one error handler serializes `{ message, code, statusCode, params? }`.
  A new client-translated `code` needs an `ErrorCode` entry and an `errorMessages.ts` entry.
- Delete a `@deprecated` export once nothing references it.

**Tests** (`test-structure`, `vitest-node-environment`, `what-not-to-test`)
- Build entities in tests and stories with the factories in `client/src/test-utils/factories.ts`, never
  inline literals. A new shared entity type gets a factory in the same change.
- Prefer mock-free tests (they run non-isolated and fast). Mock toasts only through
  `test-utils/toastSpies.ts`. A module-level singleton that tests mutate registers a reset in
  `test-utils/resetStores.ts`.
- Pure `.test.ts` files start with `// @vitest-environment node`.

**Database** (`db-schema-change`)
- `drizzle-kit push` (no `--force`) is the source of truth; there is no migrations folder.
- A lone nullable column or a new index: edit `schema.ts` only.
- A new table, a `NOT NULL` column, or a unique constraint on a populated table: pre-apply it with an
  idempotent step in `migrate.ts`, one SQL statement per `db.execute()`.
- Composite uniques are `uniqueIndex()`, never a table `unique()`.
- Backfills are `ensure*`/`backfill*` boot steps in `middleware/src/index.ts`, after `app.listen()`.

**Data and caching** (`data-shaping`, `taxonomy-domain-model`)
- Endpoints return render-ready shapes. Joins, counts, trees and aggregation belong in middleware
  services; client-side derivations are allowed only from the list in `data-shaping`.
- Logic shared by client and server lives once in `@eesimple/types` (`evaluateConditions`, bookmark
  search matchers, autofill merge). Never reimplement a predicate in SQL or the client.
- Every write that changes a bookmark's matchable data, or the tag tree, calls `invalidateBookmarkCache()`.
  Display-only data (card display, scan cache, sync previews) never does.
- Polymorphic owner tables have no FK on `ownerId`: every owner's delete runs
  `deleteTaxonomyAssignmentsForOwner`, `deleteEntityNamesForOwner` and (for language-usage owners)
  `deleteLanguageUsagesForOwner`, over the whole subtree for tree taxonomies.
- Built-in vocabularies are hidden, never deleted. Filter `!hidden` at the picker, not the hook.

**UI** (`page-structure`, `toast-notifications`, `decompose-over-cap`, `i18n`)
- Check `client/src/components/ui/` before adding a Radix/shadcn primitive.
- Detail/edit content is a flat `LabeledSection` stack, not a card box. Info pages use a vertical `?tab=`
  rail; edit pages a horizontal `?tab=` strip; both are derived from the entity's resolved layout.
- Adding a field to an entity page is two edits: a `WorkbenchField` in the registry and its key in
  `defaultLayout`. Renderers return a JSX element and never call hooks directly.
- Breadcrumbs are built only in `routes/-appHeaderCrumbs.tsx`.
- Edit tabs auto-save per field through `useFieldAutoSave` or `useCollectionAutoSave`; no Save buttons
  outside create flows and the documented exceptions. Every server write fires a toast.
- A setting that should sync across devices goes in `app_settings` (`app-settings-group`), not `uiStore`.
- Over fallow's complexity cap? Spread hooks into controller/sub-hooks; don't add a
  `fallow-ignore` comment.
- Wrap every user-facing string in `t()` with English-phrase keys. Never write or overwrite Japanese
  values in `ja.json`.
- Every header toolbar action has a matching CMD+K palette item (`cmd-k-entity-context`).
- Every settings sub-page must be starrable; registration is derived from the nav modules
  (`entity-favorites`).

## Where the detail lives

Former CLAUDE.md sections (code comments still cite them by these names) and the skill that holds each:

| Former section | Skill (`.claude/skills/…`) |
|---|---|
| Tech stack · Monorepo layout · Conventions · Generated files | `codebase-conventions` |
| Page-header breadcrumbs · Content hierarchies · Entity page layouts | `page-structure` |
| Large-form / over-cap decomposition | `decompose-over-cap` |
| Edit-tab auto-save standard | `toast-notifications` |
| Data shaping: middleware vs. client | `data-shaping` |
| Multilingual display names · Language usage levels & associations · Genres & Moods & the polymorphic assignment layer · Custom-taxonomy filters & conditions · Creators: People & Groups · Franchise hub bookmarks · Hiding seeded built-in vocabularies | `taxonomy-domain-model` |
| Metadata fetching & connectors | `add-connector` |
| Outside-source sync | `sync-from-source` |
| Locations & maps | `locations-map` |
| Favorite (starring) & sidebar flyouts · Settings page starring | `entity-favorites` |
| Internationalization | `i18n` |
| Database schema changes | `db-schema-change` |
| Deployment · Environment variables | `deployment-env` |
| CMD+K palette sync | `cmd-k-entity-context` |

## Skills by task

- **New entity or table:** `add-entity`, `promote-to-entity`, `db-schema-change`, `add-endpoint`,
  `client-data-hooks`, `api-errors`.
- **Entity pages:** `page-structure`, `tabbed-pages`, `surface-entity-field`, `tab-to-filtered-page`,
  `scope-autofill`, `source-default-association`.
- **Listings:** `listing-page-controls`, `listing-table-view`, `listing-header-create`,
  `bulk-listing-actions`, `standard-listing-card`.
- **Filters and conditions:** `filterable-facet`, `add-condition-type`, `taxonomy-domain-model`.
- **Forms and pickers:** `bookmark-add-form`, `combobox-new-entity-creation`, `inline-create-modal`,
  `toast-notifications`, `app-settings-group`.
- **Cards and display:** `card-field-area`, `display-rules-tab` (explains there is no per-entity tab).
- **Header and palette:** `responsive-popover`, `cmd-k-entity-context`, `entity-favorites`.
- **External data:** `add-connector`, `sync-from-source`, `extension-fill-target`, `locations-map`.
- **Quality:** `decompose-over-cap`, `fallow`, `test-structure`, `vitest-node-environment`,
  `what-not-to-test`, `storybook-story`, `verify`, `overnight-cleanup`.
- **Ops:** `deployment-env`, `i18n`.
