# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Tech stack

- **Runtime & build:** Node 22, pnpm 10, TypeScript 5.9 (strict, ES2022, `moduleResolution: bundler`)
- **Frontend:** React 19, Vite, TanStack Router/Query/Form, Tailwind CSS 4
- **Backend:** Fastify 5, Drizzle ORM, PostgreSQL, Swagger UI, `fast-xml-parser` (podcast RSS/XML feeds)
- **Testing:** Vitest + Testing Library (client), Node test runner (middleware). Pure client
  `.test.ts` files opt into the faster `node` environment with a first-line
  `// @vitest-environment node` pragma — see the **`vitest-node-environment`** skill for the
  decision rule, the **`what-not-to-test`** skill for what deliberately has no test at all, and
  the **`test-structure`** skill for how to structure one (the middleware in-memory fake-`db`
  harness, the client `renderWithRouter` + `vi.mock` recipe, and MSW as a story-only tool).
  The client Vitest config auto-partitions tests into **three projects**: mock-free files run with
  `isolate: false` in persistent workers (the ~2x suite-speed win), while any file using
  `vi.mock`-family or global-stub APIs keeps per-file isolation — so **prefer mock-free tests**;
  the non-isolated path depends on the fresh-world reset in `test-utils/setup.ts` (a new
  module-level singleton that tests mutate belongs in `test-utils/resetStores.ts`). For the local
  loop, `pnpm test:client:changed` (and `pnpm verify:changed`) run only tests affected by your
  diff via `vitest --changed`. Two test-double rules: mock the toast stack **only** through the
  shared `test-utils/toastSpies.ts` seam (never `vi.mock` on `lib/autoSave`, `lib/notifications`,
  or `sonner` directly — the three sonner-layer tests are the sole exception), and a non-zustand
  module-level singleton a test mutates registers a plain reset callback via
  `test-utils/resetStores.ts`'s `registerReset` (zustand stores go in `RESETTABLE_STORES` as
  before).

## Monorepo layout

Four packages under `packages/`:

- **types** (`@eesimple/types`) — shared TypeScript definitions; builds to `dist`.
- **middleware** (`@eesimple/middleware`) — Fastify API. Layered `src/`: `db/` (Drizzle schema +
  client + seed), `routes/`, `services/`, `utils/`, `tests/`, `app.ts`, `index.ts`.
- **client** (`@eesimple/client`) — React frontend. `src/`: `routes/` (file-based), `components/`,
  `hooks/`, `lib/`, `stores/`, `test-utils/`.
- **gateway** (`@eesimple/gateway`) — Fastify reverse proxy, the production entrypoint (`server.js`).

Build order: types → middleware → client. The gateway has no build step.

## Conventions

- **ESLint** uses the flat config in `eslint.config.js`, which re-exports
  `@emilyeserven/eslint-config`. Run `pnpm lint:fix` from the repo root — running from a package
  produces import ordering that CI rejects.
- **Import cap (`import/max-dependencies`) is enforced at `["error", { max: 20, ignoreTypeImports: true }]`.**
  The shared `@emilyeserven/eslint-config` ships it as an ignored `warn`/10; `eslint.config.js` overrides the
  rule **in place** on the shared config object that registers it (`emilyConfigWithCap` — a standalone
  override object can't resolve the `import` plugin, and redeclaring the plugin throws) so it becomes an
  `error` at max 20 (#1368). CI fails on any file over **20** non-type module dependencies, where the rule
  counts `import … from`, `export … from` (re-exports **do** count), and side-effect `import "x"`, **deduped
  by module path** (`import type` / `export type` are ignored). **Scope:** the shared config **excludes
  `packages/middleware/src/**/*.ts` from all `import/*` rules** (its `ignores`), so the cap governs only the
  **client**, **types**, and **gateway/scripts** — the middleware route/boot hubs (`app.ts` 57, `index.ts` 21)
  are outside the rule and need no exemption. The **only** allowed exemptions are genuine by-design hubs in the
  in-scope packages, added as a file-top `/* eslint-disable import/max-dependencies … */`: field/entity
  registries (`workbench/bookmarkViewFields.tsx`) and the `@eesimple/types` public barrel
  (`types/src/index.ts`); the vendored `components/ui/**` stays `off`. A **non-hub** file over the cap is a
  coordination smell — **split it, don't exempt it**: the reference is `PersonGeneralForm.tsx`, whose
  per-field sub-components were relocated into `components/person/*` (a recomposition + re-export shell keeps
  every consumer importing from one module — #1194/#1368). Don't reintroduce a `warn`, and don't raise the
  cap to hide a straggler. (Note: an eslint-disable comment must not contain a literal `*/` — it closes the
  block early; word the justification around it.)
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
  `makeCategory` / `makeTag` / `makeWebsite` / `makeMediaType` / `makeYouTubeChannel` /
  `makeGroup` / `makeGroupType` / `makePerson` / `makeNewsletter` / `makeLocation` / `makeBookmarkImage`
  (override only the fields a test cares about) — **never** re-list every field in an
  inline object literal. Inline literals of these types silently drift when a field is added/removed
  from the shared type and only surface as a CI typecheck failure (one such stray literal is what
  reddened PR #363). When you add or remove a field on one of these shared types,
  update the factory's defaults — that is the single edit point. A new shared entity type that
  tests/stories construct gets a factory here in the same change.
- **Path alias:** the middleware uses `@/*` → `src/*` (resolved at build time by `tsc-alias`).
- **`.js` import extensions in `@eesimple/types`:** the types package emits native ESM, so its
  intra-package imports/re-exports must carry explicit `.js` extensions (e.g.
  `export * from "./conditions.js"`), even though the source files are `.ts`. Omitting them builds
  locally but breaks ESM resolution for consumers.
- **Property-type / format / value-kind variants are derived from one shared `as const` list — add
  a variant in exactly one place.** `CustomPropertyType`, `NumberFormat`, and `DateTimeFormat` are
  `typeof X[number]` over the `CUSTOM_PROPERTY_TYPES` / `NUMBER_FORMATS` / `DATE_TIME_FORMATS` tuples
  in `packages/types/src/customProperties.ts`; the condition `predicate.valueKind`s come from
  `CONDITION_VALUE_KINDS` in `packages/types/src/conditions.ts`. Every former hand-mirrored copy now
  **derives** from these: the client zod enums (`propertyFormSchema.ts`, `AddCustomPropertyModal.tsx`
  via `z.enum(CUSTOM_PROPERTY_TYPES)`), the `TYPE_OPTIONS` / `*_FORMAT_OPTIONS` select lists in
  `lib/propertyForm.ts` (`.map()` over the tuple), the middleware Fastify JSON-Schema enums in
  `routes/customProperties.ts` (`[...CUSTOM_PROPERTY_TYPES]`), and the `propertyNode` predicate
  `oneOf` in `routes/conditionSchema.ts` (built by `.map()` over `CONDITION_VALUE_KINDS`, with a
  `satisfies Record<ConditionValueKind, …>` predicate map that makes a missing branch a compile
  error). **To add a property type: add the string to the tuple and a `CUSTOM_PROPERTY_TYPE_LABELS`
  entry in `customProperties.ts` — that's it.** The label record and the per-type
  `Record<CustomPropertyType, …>` maps (e.g. in `lib/propertyFormat.ts`, `CategoryCustomProperties.tsx`)
  are exhaustive, so a forgotten spot now **fails `tsc`** instead of silently rejecting at the
  modal/API boundary (the PR #341 `image`/`file` drift can no longer happen). Don't reintroduce a
  literal `["number", "boolean", …]` list anywhere — derive from the tuple. **This is the general
  rule, not a four-tuple special case: any string union that crosses a package boundary (a client
  zod enum, a middleware JSON-Schema `enum`, a settings value) is declared as an `as const` tuple +
  `typeof T[number]`** — e.g. `BOOLEAN_LABEL_PRESETS`, `SECTION_ENTRY_TYPES`,
  `BOOKMARK_ADD_FORM_STANDARD_FIELDS` — and every wire schema spreads the tuple
  (`z.enum(TUPLE)` / `enum: [...TUPLE]`). A deliberate *subset* list is typed
  `as const satisfies readonly <Union>[]` with a comment naming it a subset (see
  `lib/inboxPreFill.ts`) so a renamed member fails `tsc`. The bookmark-filter UI
  dispatches the same way: `components/conditions/PropertyConditionEditor.tsx` routes each property
  through `propertyValueKind()` to one of the exhaustive `*ConditionRow` sub-components
  (`Number`/`DateTime`/`File`/`Boolean`) — adding a value kind means adding a branch there too. The
  same exhaustive-`Record<CustomPropertyType, …>` technique also backs **per-type component
  dispatch** — `PropertyDetail.tsx`'s `OPTIONS_FIELDS` maps each type to its options sub-component
  (`BooleanOptionsFields`, `NumericOptionsFields`, …; `null` = no options section), so a new type
  missing a renderer **fails `tsc`** instead of silently rendering nothing (vs. the named-function
  routing above, used where per-branch props differ).
- **Add Bookmark form field placement (`Settings → Display → Bookmark Add Form`).** Which fields the
  **create** form shows — in the main area (**Default**), the collapsible **Advanced** section, or
  **Hidden** — is configured **centrally** in one tab, not hardcoded per field. The page
  (`/settings/display/bookmark-add`, `components/DisplayBookmarkAddSettings.tsx` +
  `hooks/useBookmarkAddFormSettingsPage.ts`) governs three groups, each a three-state
  `SegmentedToggleRow` (`components/SegmentedToggleRow.tsx`, the shared segmented control also used by
  the sidebar show/hide settings). **See the `bookmark-add-form` skill for the change recipes.** In short:
  - **Standard fields** — the `BOOKMARK_ADD_FORM_STANDARD_FIELDS` tuple in
    `packages/types/src/bookmarkAddForm.ts` (14 entries): `title`/`names` (Default), the taxonomy
    fields `categoryId`/`mediaTypeId`/`descriptionTags`/`personIds`/`image` (Advanced),
    and the taxonomy/media/location relations `groupIds` (creators, plural), `genreMoodIds`,
    `locationIds`, `mediaLink` (the six book/movie/tvShow/episode/album/track FKs, via the
    selection-driven `BookmarkMediaField`), `blacklistedTagIds`, `blacklistedLocationIds`, plus
    `secondaryUrl` — all seven of these **default to Hidden** so the create form is unchanged until
    opted in. Persisted in the
    server-side **`bookmark-add-form`** app-settings group as a **placement map**
    (`BookmarkAddFormSettings.standardFieldPlacements: Record<field, placement>`, resolved
    `{...DEFAULT.standardFieldPlacements, ...stored}` — the same merge as the built-in slugs). This
    **replaced** the old `advancedFields`/`hiddenFields` membership arrays (which couldn't express a
    per-field default, so a newly-added field showed in Default for existing saved rows); the middleware
    derives the map from the legacy array columns once for pre-existing rows
    (`resolveBookmarkAddFormSettings` in `services/appSettings.ts`). The `mediaLink` field additionally
    required the six FK fields on `bookmarkSchema`/`buildBookmarkDefaultValues` and forwarding them in
    the create payload (`useBookmarkFormHandlers`); the other five relations were already accepted by the
    create endpoint.
  - **Built-in detail properties** (Runtime, Date Posted, Progress, …) — the
    `BOOKMARK_FORM_DETAIL_SLUGS` tuple, seeded **hidden** via
    `DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.builtInPropertyPlacements` (resolved `{...defaults, ...stored}`
    so a future hidden-by-default slug stays hidden even for existing saved rows). **To hide a new
    built-in detail slug from the create form: add it to `BOOKMARK_FORM_DETAIL_SLUGS` in
    `packages/types/src/bookmarkAddForm.ts` — that's the whole change** (seeds it hidden + adds a
    configurable row). The old two-step `*_SLUG` + `hiddenSlugs`-array edit is gone; the 6 slug
    constants now live in that types file (re-exported by `bookmarkFormSchema.ts`). The former
    **Page Progress** built-in is now **Progress** (slug `progress`) — a generic `itemInItems`
    property whose before/between/after text is overridable **per media type**
    (`CustomProperty.itemInItemsMediaTypeTexts`, resolved by the shared `resolveItemInItemsTexts`)
    and which can **derive its value from a `sections` property's completion**
    (`itemInItemsSourcePropertyId` + the shared `countSectionLeaves`; recomputed server-side by
    `recomputeDerivedProgress` in `services/bookmarkWrites.ts` on every bookmark value write). The
    former **Chapters / Page Sections / URL Sections** built-ins were **merged into one "Sections"
    property** (slug `sections`, all categories + media types, tiered, all entry types; the entry
    type for new rows is hinted from the bookmark's media type via `lib/sectionEntryTypeHint.ts`);
    `SectionEntry` carries a per-entry `completed` flag (checkbox in the editor, clickable on the
    detail view via `mergeSectionsCompleted`; checking a parent checks its children). The one-time
    rename/merge (value-row jsonb concat + UUID rewrites across stored conditions/fill rules/
    layouts/settings keys) lives in `migrate.ts`. **The bookmark PATCH sections schema in
    `routes/bookmarks.ts` must list every optional `SectionEntry` field** (entry AND child level) —
    the bodies are `additionalProperties: false` and Fastify's AJV `removeAdditional` silently
    strips unknown props from every whole-set save (guarded by `bookmarkSectionsSchema.test.ts`). This
    is an instance of a general rule — see the `add-endpoint` skill for the full `removeAdditional`
    trap and the defensive patterns for a new hand-maintained body schema.
  - **User custom properties** — write the property's existing `showInForm`/`hiddenFromForm` flags via
    the normal `useUpdateCustomProperty` mutation. Card 3 lists **every** enabled custom property
    regardless of category/media-type lock, but the **category-lock stays the ultimate runtime gate**:
    a locked property still only renders on the create form when a matching category/media type is
    selected — the scope short-circuit in `selectVisibleFormProperties` (`bookmarkFormProperties.ts`)
    runs before placement and is intentionally **not** bypassed (a scope hint on the row surfaces this).
    The old per-property "Main bookmark form" / "Show outside Advanced area" checkboxes in
    `PropertyDisplaySection` were **removed** (that section now just links here) — placement is
    centralized in this tab.

  Enforcement is **create-mode only** (`!isEdit`): `resolveBookmarkAddForm` (`lib/bookmarkAddForm.ts`)
  + `useBookmarkAddFormVisibility` feed `BookmarkRevealedFields`, which buckets standard fields via the
  exhaustive registry in `bookmarkAddFormFields.tsx` (`BookmarkStandardFieldZone` — a new standard-field
  key **fails `tsc`** until it has a `FIELD_RENDERERS` entry, a `BOOKMARK_ADD_FORM_STANDARD_LABELS` label,
  and a `STANDARD_FIELD_ICONS` icon) and threads `hiddenSlugs`/`placementOverrides` into
  `selectVisibleFormProperties` (`bookmarkFormProperties.ts`). **Edit surfaces are unaffected** — the
  resolver's edit branch derives its split from `DEFAULT.standardFieldPlacements`, **excluding**
  hidden-by-default fields (so the newer taxonomy/media/location relations never render on edit; they are
  edited on their own edit-form sections), and `hiddenFromForm` still gates the edit Properties tab, so
  hidden-from-create properties stay editable after creation.
- **UI primitives:** before adding a Radix/shadcn primitive, check
  `packages/client/src/components/ui/` — `dialog`, `dropdown-menu`, `popover`, `toggle-group`,
  `command`, etc. already exist (`Dialog` was once reintroduced twice). Reuse the existing one.
- **Inline-create modals:** the name-only "Add new X" dialogs (e.g. `AddCategoryModal`) are thin
  wrappers over the shared `InlineCreateModal`
  (`packages/client/src/components/InlineCreateModal.tsx`). A new one should wrap it too rather than
  re-implement the Dialog + name field + reset — see the **`inline-create-modal`** skill.
- **Layout/section patterns** are catalogued under **Content hierarchies** below — consult it
  before choosing how a detail/edit page or panel lays out its content.
- **Card Display Rules** (`Settings → Display → Card Display`, `routes/settings.display.card-display.tsx`
  → `CardDisplaySettings`) govern **per-card** display — field visibility + image presentation
  (aspect/visibility/layout/corner overlays) — for bookmark cards on listing pages. It is a **settings
  page, not a slug-routed entity** (there is no `card-display-rule` route / workbench descriptor / entity;
  the historical multi-rule `CardDisplayRule` model was **replaced** — that interface lingers only as
  orphaned type surface). The whole surface is one **single `CardDisplayConfig`** (`@eesimple/types`),
  seeded/repaired by the `ensureCardDisplayConfig()` boot step: an ordered array of dynamic card-body
  **`CardDisplaySection`s** plus the four fixed image-corner overlays and the image presentation
  attributes. There is **no** layered merge, `sortOrder` priority, or non-deletable Default rule — one
  config governs every card.
  - **`CardDisplaySection`** (`@eesimple/types`) — a card-body section the user can **add / rename /
    reorder / remove** (it replaced the old four fixed `CardBodyZone`s). Each carries its render `form`
    (`stacked` / `inline` / `table`), its per-section `layout` (`CardZoneLayout`, the Flex-vs-Grid
    dropdown), an optional per-bookmark **`visibleIf`** condition tree (absent/empty = always visible),
    and its ordered `fields`. Resolution is client-side: `resolveCardDisplay(bookmark, config, options)`
    (`lib/cardDisplayRules.ts`) filters `config.sections` by each section's `visibleIf` for that bookmark;
    `BookmarkCardDetails` renders the surviving sections in array order (`renderSection`).
  - Grid **column count** and **card/table view** stay page-level (`ListingDisplayControls`, the
    `DisplayOptionsPopover`, and Settings → Display "Listing Defaults"); everything else about how a card
    looks is configured **only** here — including the **hide-website-pill-for-YouTube** behavior
    (`useHideWebsiteForYouTube` reads `config.hideWebsiteForYouTube`; listing cards resolve it per-card,
    other surfaces/table use the config value). The old per-page/global field-visibility + image
    controls, the global "hide website for YouTube" toggle, and **Display Presets** were removed in favor
    of this. The canonical card-field key lists are the
    `STANDARD_CARD_FIELD_KEYS` / `HEADER_CARD_FIELD_KEYS` tuples in
    `packages/types/src/cardFieldKeys.ts` — the client labels (`lib/bookmarkCardFieldDefs.ts`, an
    exhaustive `satisfies Record<StandardCardFieldKey, …>`) and the middleware defaults
    (`services/cardDisplayDefaults.ts`) both **derive** from them, so the two sides can no longer
    drift. The `hiddenCardFields` key list (those keys + custom-property ids) is shared with
    homepage sections.
  - **Field placements** — a `CardFieldPlacement` places one field into a section's `fields` (or one of
    the four `image-*` overlay corners). Order within a section/corner matters (the boards are sortable;
    the card renders in array order). A placement carries `scale`/`mobileScale` (image corners),
    `hideLabel` (image corners + `table`-form sections + boolean body fields), `hideIcon` (image corners
    — overlays show the field's icon/image by default; **also** drops a boolean icon/stars **glyph** in
    any section, falling back to the custom/Yes-No text via `formatBoolean`'s `hideIcon` opt), and the
    **boolean per-field knobs** `showIfFalse`/`clickableInView`/`showLabelColon` (absent =
    true)/`showValueBeforeLabel` (moved off the `CustomProperty` so each placement controls them;
    non-listing surfaces resolve them from the single config via `resolveBooleanDisplay`). The **card
    header** is not fixed: `title`, `externalLink`, and `more` are standard placeable fields (in
    `STANDARD_CARD_FIELDS` / `STANDARD_CARD_FIELD_KEYS`), rendered by `describeField` and laid out as a
    justified header row when co-located in a single section; they're kept out of the image corners.
  - The legacy **`CardFieldZones` / `CARD_FIELD_ZONES` / `CARD_BODY_ZONES`** (`@eesimple/types`) survive
    only as the **transform input** to `cardDisplayConfigFromFieldZones` (the shared default/seed builder
    used by the client baseline, the middleware seed, and the boot backfill — one section per
    `CardBodyZone`), **not** as the live render model. The shared Fastify schema fragments
    (`routes/cardFieldZonesSchema.ts`, used by the card-display **and** homepage-sections routes)
    **derive** their zone-name sets from `CARD_FIELD_ZONES`/`CARD_BODY_ZONES` and check the placement-prop
    map exhaustive against `CardFieldPlacement` via `satisfies` — a new placement prop fails `tsc` there
    until its schema is added (an instance of the general `removeAdditional` trap — see the
    `add-endpoint` skill). **To add a field or a per-field knob to this area, see the `card-field-area`
    skill.**
- **API error envelope — services `throw`, one handler, one shape.** Every user-facing failure is an
  `AppError` (`packages/middleware/src/utils/errors.ts`) carrying a stable `code` + HTTP `statusCode` +
  English `message` + optional `params`; the single `setErrorHandler` serializes it to
  `{ message, code, statusCode, params? }`, and the client re-maps `code` → a translated phrase
  (`lib/errorMessages.ts`), falling back to the English `message` for an unmapped code. Services/routes
  just `throw` (reuse a generic subclass or a per-service `Duplicate*`/`BuiltIn*` one) — they don't
  build error bodies for domain failures. A route may `reply.code().send()` **only** to map a helper's
  *discriminated result union* (external-fetch/image-grab), and then only in the same envelope shape. A
  new client-translatable `code` needs both an `ErrorCode` union entry (in
  `packages/middleware/src/utils/errors.ts` — the union is middleware-local, not in `@eesimple/types`)
  and a client `errorMessages.ts` entry (a non-`tsc`-enforced sync point). The five image-grab
  result kinds (`no_image`/`bad_image`/`blocked`/`server_error`/`fetch_error`) are union members
  with client entries, and every image-grab route maps them through the **single
  `utils/imageGrabError.ts` `imageGrabErrorReply(kind, noun)` helper** — never a per-route message
  map. `conflict` (like `validation`) is *deliberately unmapped* client-side: its server `message`
  names the exact clash and surfaces verbatim. **See the `api-errors` skill.**
- **Shared payload types must be consumed, and new types go in a domain module.** A
  request/response type declared in `@eesimple/types` for an endpoint must be imported by the route
  that implements it (type the parsed body with it beside the JSON schema — see `routes/gallery.ts`
  / `routes/taxonomies.ts`); don't declare aspirational payload types, which is how orphaned type
  surface accumulates. New types land in (or get) a domain module (`customProperties.ts`,
  `entityLayouts.ts`, `cardFieldKeys.ts`, …), not appended to the `index.ts` god-barrel —
  `index.ts` re-exports.
- **Deprecation sunset:** a `@deprecated` export "retained for existing references" must actually
  have references — when a grep shows zero, delete it in the same change instead of letting it
  linger.

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
