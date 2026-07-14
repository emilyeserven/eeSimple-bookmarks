# eeSimple Bookmarks — Architecture & Conventions

## Project summary

A full-stack TypeScript monorepo for saving and organizing bookmarks. Built with pnpm workspaces, mirroring the
tooling and architecture of [course-tracker](https://github.com/emilyeserven/course-tracker).

## Tech stack

- **Runtime & build:** Node 22, pnpm 10, TypeScript 5.9 (strict, ES2022, `moduleResolution: bundler`)
- **Frontend:** React 19, Vite, TanStack Router/Query/Form, Tailwind CSS 4
- **Backend:** Fastify 5, Drizzle ORM, PostgreSQL, Swagger UI, `fast-xml-parser` (podcast RSS/XML feeds)
- **Testing:** Vitest + Testing Library (client), Node test runner (middleware). Pure client
  `.test.ts` files opt into the faster `node` environment with a first-line
  `// @vitest-environment node` pragma — see the **`vitest-node-environment`** skill for the
  decision rule, and the **`what-not-to-test`** skill for what deliberately has no test at all.

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
  literal `["number", "boolean", …]` list anywhere — derive from the tuple. The bookmark-filter UI
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
    `packages/types/src/bookmarkAddForm.ts`: `title`/`names` (Default), the taxonomy fields
    `categoryId`/`mediaTypeId`/`languageId`/`groupId`/`descriptionTags`/`personIds`/`image` (Advanced),
    and the taxonomy/media/location relations `groupIds` (creators, plural), `genreMoodIds`,
    `locationIds`, `mediaLink` (the six book/movie/tvShow/episode/album/track FKs, via the
    selection-driven `BookmarkMediaField`), `blacklistedTagIds`, `blacklistedLocationIds` — all six of
    these **default to Hidden** so the create form is unchanged until opted in. Persisted in the
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
    strips unknown props from every whole-set save (guarded by `bookmarkSectionsSchema.test.ts`).
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
    of this. The `hiddenCardFields` key list (`STANDARD_CARD_FIELDS` + custom-property ids in
    `lib/bookmarkCardFields.ts`) is shared with homepage sections — keep in sync.
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
    until its schema is added. **To add a field or a per-field knob to this area, see the `card-field-area`
    skill.**

## Page-header breadcrumbs

The top app-bar breadcrumb trail is built in **one place** —
`packages/client/src/routes/-appHeader.tsx` (`breadcrumbsForPath()` + its helpers). It derives crumbs
from the **pathname** and enriches them with real entity names resolved via `use*BySlug` hooks. Don't
render a page-specific breadcrumb anywhere else; route components only set their own `<h1>`/`<h2>`
title (see **Content hierarchies**), never a header crumb.

- **Shape:** `List → [ancestors…] → Name → [Section]`. Every crumb except the last is a `<Link>`
  (`BreadcrumbLink asChild`); the last is the current page (`BreadcrumbPage`, non-link).
- **Listing page** → one non-link crumb (`Categories`, `Bookmarks`, …). **Detail / `info` page** →
  `List(link) → Name` (the info page's inner tabs are a `?tab=` param and stay out of the trail).
  **Edit tab** → `List(link) → Name(link → that entity's `…/info` view) → Section`. No bare `Edit`
  leaf when the entity has tabs — end on the tab's label.
- **Name resolves the real entity name** via the entity's `use*BySlug` hook — never a generic
  singular. The descriptor's `singular` is only a brief loading placeholder.
- **Most slug-routed entities share one builder.** Categories, Websites, Media Types, YouTube
  Channels, Custom Properties, and Autofill are all driven by `TAXONOMY_DESCRIPTORS`
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
- **Info page = vertical `?tab=` rail** (`packages/client/src/components/workbench/EntityInfoView.tsx`) —
  a slug-routed entity's read-only **Info** page (`…/$slug/info`, e.g. `/categories/dev/info`) is a
  **vertical** tab rail beside the active tab's body, and the active tab is a **`?tab=<key>` search
  param** (`/categories/dev/info?tab=custom-properties`), *not* a path segment. The rail is **derived from the
  entity's resolved layout** — `deriveWorkbenchTabs(workbench, layout, "view", entity)`, which returns the
  view-mode-visible tabs of the resolved `EntityLayout` (see **Entity page layouts**) — and each tab body
  is rendered by the shared `workbench/WorkbenchRouteTab.tsx` (`mode="view"`) → `LayoutDrivenTabBody`, so
  it is the same body the old per-segment `_view.*` routes rendered. The `?tab=` param is validated by
  `validateInfoTabSearch` (`lib/infoTabSearch.ts`). A single-tab entity drops the rail. **There are no
  more `_view` layout routes or per-tab `_view.*` route files** — one `…$slug.info.tsx` (or
  `…$slug._hub.info.tsx` for listing entities) route per entity replaces the whole `_view` subtree.
- **Edit page = horizontal `?tab=` strip** (`packages/client/src/components/workbench/EntityEditView.tsx`,
  over the shared **`TabbedShell.tsx`** + `navLinkClass` + `navStripClass`) — the edit-mode mirror of the
  Info rail: a `header` over a horizontal tab `nav` strip and a `min-w-0` content pane, where the active
  tab is the **`?tab=<key>` search param** (`…/$slug/edit?tab=display`, validated by `validateEditTabSearch`),
  **not** a path segment. There is a **single `…/$slug/edit` route** per entity, not one route file per
  tab. The strip is derived from the resolved layout — `deriveWorkbenchTabs(workbench, layout, "edit",
  entity)` — and each tab body is the same `workbench/WorkbenchRouteTab.tsx` (`mode="edit"`) →
  `LayoutDrivenTabBody` the Info rail uses, so one descriptor drives every surface; each tab body is itself
  a flat `LabeledSection` stack. Consecutive tabs sharing a `WorkbenchTab.group` collapse into a trailing
  **"More" dropdown** (`EntityEditView`'s `groupEditTabs`). The strip (`navStripClass`:
  `flex items-center gap-1 overflow-x-auto border-b pb-1`) scrolls horizontally when the tabs overflow, so
  the same component serves the page and mobile.
  - **`TabbedEntityLayout.tsx`** — the older path-segment-tab shell — is now used **only** by the
    **Settings** page (`routes/settings.tsx`); slug-routed entity edit moved off it to the `?tab=`
    `EntityEditView` above (bookmarks use `TabbedShell` directly via `BookmarkEditView`). Don't reach for
    `TabbedEntityLayout` on an entity. (`VerticalTabbedLayout` is the sanctioned **settings-section**
    pattern — the tabbed Display/Automations/Locations/Advanced sections render through it; never use it
    for a slug-routed entity's edit tabs.)
  - **Hierarchy tab rule:** every taxonomy whose schema row has a `parentId` tree — currently
    **Tags**, **Media Types**, **Locations**, and **Genres & Moods** — gets a view-only **"Hierarchy"**
    workbench tab (a "Parents" ancestor chain + a "Children" subtree). It is a `view`-only
    `WorkbenchTab` in the entity's `*Workbench` descriptor (so it shows on the Info rail but not on Edit),
    resolves the node *with children* from the `use*Tree()` query (not the flat `use*BySlug`), reuses the
    generic `findAncestorPath`/`flattenTree` from `lib/tagTree.ts`, and renders the entity's `*TreeList`.
    The shared **`HierarchyView`** component (`components/HierarchyView.tsx`) renders the "Parents" +
    "Children" body, and the **`useExpandedSet`** hook (`hooks/useExpandedSet.ts`) tracks expanded
    nodes — a new tree taxonomy passes its `ancestors`, a `renderAncestorLink`, and its `*TreeList`
    rather than re-implementing the markup. **Websites are the sanctioned derived-tree exception**:
    no `parentId` column, but their Hierarchy tab renders the domain/subdomain tree derived by
    `useWebsiteTree` (`websiteHierarchyView.tsx`) — a *derived* tree is legitimate for a view-only
    Hierarchy tab when a real containment relation exists in the data. Genuinely flat taxonomies
    (Categories, YouTube Channels) do **not** get one.
- **Entity-scoped bookmarks page + the `_hub` listing strip** — an entity whose bookmarks can be
  meaningfully listed (Categories, Tags, Websites, Media Types, YouTube Channels, Genres & Moods,
  Languages, Locations, Media Properties, the seven media taxonomies, People, Groups) gets a **pathless
  `_hub` layout** (`…$slug._hub.tsx` → `components/ListingHubLayout.tsx`) that renders the entity `<h1>`
  header over a **horizontal outer strip of real URL path segments**: **Bookmarks** (`…/$slug`, exact
  match), **Gallery** (`…/$slug/gallery`), **Media** (`…/$slug/media`), and **Info** (`…/$slug/info`).
  The first three are `BookmarkSearchView` panes sharing the filter sidebar — selected by the
  `activeView` prop passed from each `_hub.{index,gallery,media}.tsx` route — and **Info** navigates to
  the vertical `EntityInfoView`. `edit` sits **outside** `_hub` (a sibling of the pathless layout) so
  the strip never shows while editing. Each entity's listing body is a shared `routes/-<entity>Listing.tsx`
  component the three pane routes render with their own `activeView`; it resolves the entity by slug,
  filters bookmarks by its id/relation, and passes `pageKey`/filter props to `BookmarkSearchView` with
  **no `header`** (the `<h1>` lives in `_hub`). **Do not redirect to `/bookmarks?<filter>=…`** — that
  loses the entity context and breaks deep-linking. Reference: `routes/categories.$categorySlug._hub.tsx`
  + `._hub.index.tsx` + `-categoryListing.tsx`. **The header shows an Edit (pencil) icon, not an Info
  icon** — Info is now a listing tab, so `viewDetailsAction`/`taxonomyViewLink` were removed;
  `taxonomyEditLink` (`components/header/toolbarActionTypes.tsx`) now renders the Edit button on the bare
  listing + its gallery/media/info tabs (a new entity gets it from the length-based guard, no per-entity
  branch). The `_hub` header is the `<h1>` title plus any entity-specific chrome (the tree entities'
  sub-items chip row: Tags' "Sub-tags:", Locations' "Sub-locations:", and Languages' clearable
  `?usageLevel=` badge). **Newsletters** are the bespoke listing entity — their `_hub` strip is
  `Issues | Info` (the "listing" is the import-group issues list, not bookmarks).
- **Card boxes** — two distinct uses of the card token, never for detail/edit page content:
  - **List/row cards**: use `<RowCard>` from `@/components/ui/card` (renders `rounded-lg border
    bg-card`). Pass padding (`p-4`) or layout utilities (`group relative`) via `className`. Used in
    `WebsiteManager`, `MediaTypeManager`, `YouTubeChannelManager`,
    `CategoryPreviewCard` (row variant), `BookmarkSearchView`, `HomepageSectionBlock`,
    `CustomPropertyManager`, `AutofillRulesList`.
  - **Settings panels**: use the shadcn `<Card>` with `<CardHeader>`, `<CardContent>`, etc.
    (`DisplaySettings`, `AutomationsSettings`, `LinkParsingSettings`,
    `HomepageSectionsSettings`).
- **Entity view/edit = the `EntityWorkbench` descriptor** (the URL-driven right drawer/panel was
  removed in issue #1108 — there is no more `components/panel/`, `drawerSearch`, `dOpen`/`dCT`/…
  params, or `useEditPanelClick`/`usePanelControls`; every affordance now just navigates to the full
  page).
  - **One source of truth per entity = its `EntityWorkbench` descriptor** (`components/workbench/<entity>.tsx`,
    typed by `workbench/types.ts`). The descriptor carries the **field registry** (`layoutKind` + `fields`
    + `defaultLayout` — see **Entity page layouts**), the load hook (`useBySlug`),
    `name`/`isBuiltIn`/`canDelete`, and a `useDelete` control; its `tabs` array is now **thin**
    (`{ key, label, group? }`, no `view`/`edit` `WorkbenchPane`) — it survives only to carry the code-only
    `group` nav metadata. `EntityInfoView`/`EntityEditView` derive the tab rail/strip from the resolved
    layout and render each tab body via `WorkbenchRouteTab` → `LayoutDrivenTabBody`, dispatching the
    registry's per-field `view`/`edit` renderer by mode. So the view bodies, the edit forms (the auto-save
    `*GeneralForm` / per-field forms), and the responsive `TabbedShell` are all shared — **add/rename a tab
    or place a field in exactly one place** (the registry + `defaultLayout`). **Never** reintroduce an
    inline `*Row` editor, a `*Card`/`TagViewInfo` view card, the opaque pane `render`, or the monolithic
    submit **create** form for edit. **Create** flows (inline-create modals) keep their submit form —
    `CreateAutofillRule` / `TagCreateForm` / `PropertyForm` / `BookmarkForm` stay submit-driven for create
    only.
  - **The shared tabbed shell is `components/TabbedShell.tsx`** — a horizontal, scrollable tab strip
    (`navStripClass`) above the active body, on every surface (full-width page and phone); the strip
    scrolls horizontally when the tabs overflow, so the main pane is mobile-friendly for free. A
    single-tab (or tab-less) surface drops the nav strip.
  - **Bookmarks are layout-driven too (#1163), but off `ENTITY_DESCRIPTORS`.** A bookmark's view **and**
    edit both resolve the `"bookmark"` field registry (`components/workbench/bookmark.tsx` +
    `bookmarkViewFields.tsx`) through the shared `LayoutDrivenTabBody`; the old asymmetry
    (`buildBookmarkDetailSections` view vs. a per-tab edit route quartet) is gone. Bookmarks are
    **id-routed**, not slug-routed, so they can't reuse the slug-coupled `EntityInfoView`/`EntityEditView`:
    the detail page uses `BookmarkDetailBody` (single column) / `BookmarkDetailTabbed`, both fed by
    `hooks/useBookmarkViewTabs.ts` (resolves the layout + drops the data-empty tabs — the registry
    replacement for the old per-section null-omission, pure logic in `lib/bookmarkViewTabs.ts`), and edit
    is the single `bookmarks.$bookmarkId.edit` route (`?tab=`, redirected from the old `/edit/<seg>` paths
    incl. legacy `relationships → related`) rendering `components/BookmarkEditView.tsx` — the id-routed
    mirror of `EntityEditView`, with a bespoke General-tab Delete danger zone (bookmarks have no
    `useDelete` workbench control). The `"bookmark"` field split gives parity by construction:
    `general`/`customProperties`/`languageUsages`/`gallery`/`reel` carry both renderers; `relatedEdit` is
    edit-only; `relatedBookmarks`/`hierarchy`/`mediaSource`/`locationsMap`/`metadata`/`debugInfo` are
    view-only (so Metadata/Debug are view-only tabs and the Related tab shows the four view blocks in view,
    the one edit form in edit). Byte-identical is **waived** for bookmarks (design §7-A) — the unified tab
    order is view-preserving (general, properties, languages, image, video, related, metadata, debug) so
    the default single-column detail page stays closest to today; the edit strip reorders but each tab's
    content is unchanged. Every save behavior is untouched (each `edit` renderer just wraps the existing
    form — see **Edit-tab auto-save standard**).

## Entity page layouts

The per-deploy **Page Layouts** editor (#1106) lets an operator arrange an entity's view/edit UI as a
user-editable **Tab › Section › Field** tree, instead of the tab/section structure being hardcoded JSX.
**The whole system is live** — the schema, the `WorkbenchField` registry contract, the pure
`resolveLayout`, the render seam, server persistence, and the drag-and-drop editor (**Settings → Display
→ Page Layouts**, `PageLayoutsSettings` + `LayoutBoard`) all shipped. **Every entity is layout-driven**:
all 21 slug-routed workbench kinds *and* bookmarks render through the resolved-layout path (pilots
Category + Newsletter #1161, then rollout batches #1164/#1165, bookmarks #1163). The legacy opaque-pane
path (`WorkbenchPane.render`) still exists in the types + `WorkbenchRouteTab`/`deriveWorkbenchTabs` as a
**dormant fallback**, but **no descriptor populates panes anymore** — treat "add a field to a page" as a
registry edit, never a pane edit.

- **Schema (`@eesimple/types`, `entityLayouts.ts`).** `EntityLayout = { tabs: LayoutTab[] }`,
  `LayoutTab = { key, label, icon?, description?, sections: LayoutSection[] }`, `LayoutSection = { key,
  title?, description?, columns?, fields: string[] }`. `key`s are stable machine slugs (merge identity);
  `label`/`title` are user-editable; array order = render order; `icon` is a serialized **string name** (a
  user-created tab must be jsonb-serializable — the registry's real `LucideIcon` is resolved from it via
  `lib/icons.tsx` `icons[name]`). `columns` is a section's **column count (1–4; absent = 1 = full-width
  stack)** — its fields render at `1/columns` width and overflow wraps, honored identically in the editor
  preview (`LayoutBoard`) and on the real View/Edit pages (`LayoutDrivenTabBody` via `sectionColumnsClass`
  in `lib/layoutColumns.ts`, which stacks to one column below `md`). `description` is an optional
  user-editable blurb shown on the View/Edit pages: a **tab** description renders as a muted line at the
  top of the tab body, a **section** description renders under its title (via `LabeledSection`'s
  `description`). `columns`/`description` are additive jsonb (no migration) but each has the same
  hand-maintained sync points: the Fastify `layoutSectionSchema`/`layoutTabSchema`
  (`middleware/routes/entityLayoutsSchema.ts`, `additionalProperties: false`) and the two places a
  tab/section literal is rebuilt from scratch — `resolveLayout`'s recreated-tab/-section branch and the
  editor's `renameSection` reducer — must carry them through (#1220). **Page Layouts is its own top-level settings
  section** (`/settings/page-layouts`, a vertical entity rail, not the old Display sub-tab dropdown). `LAYOUTABLE_ENTITY_KINDS` (the 21 workbench kinds + `"bookmark"`) is the single edit
  point for adding a layoutable kind; `EntityLayoutRecord` is the API/DB row shape (`{ entityKind, layout,
  updatedAt }`, `layout: null` = no override) and `isValidEntityLayout` is the structural boundary guard
  (validates the tabs/sections nesting only — it does **not** check field keys; that is `resolveLayout`'s
  read-time job).
- **Field registry contract (`components/workbench/types.ts`).** A `WorkbenchField<E>` is a placeable,
  mode-aware unit: `{ key, label, icon?, view?, edit?, showIf? }` — the mode picks the `view`/`edit`
  renderer, so **view/edit parity is by construction** (one layout tree, no per-mode storage; an
  edit-only field renders nothing in view and vice-versa, which reproduces today's view-only "Hierarchy"
  / edit-only "Display" tabs for free). A composite editor (Conditions builder, gallery grid, rules
  list) registers as **one** field — internals are not decomposed. `useFieldAutoSave` stays inside the
  `edit` renderer; the danger zone stays a `WorkbenchRouteTab` fixture, not a placeable field.
- **Every entity opts in via three descriptor fields.** `EntityWorkbench` carries `layoutKind` /
  `fields` / `defaultLayout`; with all three set (now **every** descriptor),
  `EntityInfoView`/`EntityEditView` build their rail + per-tab `LabeledSection` stacks from the resolved
  layout (`deriveWorkbenchTabs` + `LayoutDrivenTabBody`), registry `fields` dispatched by mode. (Omitting
  all three falls back to the opaque `tabs`/pane `render` path — the pre-migration behavior, retained as a
  dormant fallback, no longer exercised.) **Bookmarks are the exception that stays off
  `ENTITY_DESCRIPTORS`** (id-routed, not slug-routed): they adopt only `layoutKind`/`fields`/`defaultLayout`
  and render through `LayoutDrivenTabBody` via bookmark-specific view bodies + `BookmarkEditView`, not the
  slug-coupled `EntityInfoView`/`EntityEditView` — see **Content hierarchies → Bookmarks are
  layout-driven**. Author `fields` exhaustively (`const
  fooFields = {…} satisfies Record<FooFieldKey, WorkbenchField<Foo>>` + a `defaultLayout` whose section
  `fields` are typed `FooFieldKey[]`) so a declared key without a renderer fails `tsc` — the
  `bookmarkAddFormFields.tsx` FIELD_RENDERERS idiom.
  - **Adding or surfacing a field is the everyday change, and it is two edits:** add the `WorkbenchField`
    entry to the entity's `fields` registry (`view` and/or `edit` renderer, optional `showIf`) **and**
    place its `key` in `defaultLayout` (append it to the section it belongs in). That is the whole surface
    — **no route file, no per-tab form, no `*Detail`/pane wiring**; the registry entry *is* the field.
    (`resolveLayout` even auto-appends a known-but-unplaced field to its default home, but a field you
    never add to `defaultLayout` can't appear until you do — so always place it.) See the
    **`surface-entity-field`** skill.
  - **The migration recipe (already applied to every entity; repeat only for a brand-new layoutable
    kind):** audit the entity's current tabs/panes → build `fields` + `defaultLayout` (one untitled section
    per tab, fields in current render order) → set `layoutKind`/`fields`/`defaultLayout` → **delete the
    opaque pane bodies** (thin the `tabs` array down to `{ key, label, group? }` — it now exists only to
    carry the code-only `group` nav metadata + satisfy the type) → snapshot-check tab/section/field order
    in **both** modes (`pilotLayouts.test.tsx` for the pilots, `rolloutBatch1Layouts.test.tsx` /
    `batch2Layouts.test.tsx` for the rollout, `bookmarkLayout.test.tsx` for bookmarks). The default must
    render byte-identically at the **tab/section/field-order** level — the layout-driven path intentionally
    drops the pane `<h2>`/description header (the rail label + section titles identify the content) and
    normalizes decomposed edit fields to `space-y-6`; those are the accepted deltas, not CSS pixel-parity
    (byte-identical is **waived** for bookmarks per design §7-A — one unified layout can't match the two
    asymmetric legacy surfaces).
  - **A field renderer must return a JSX *element* (`({entity}) => <Comp .../>`), never call hooks
    directly** — `LayoutDrivenTabBody` invokes `render({entity})` as a plain call, so any hooks must live
    inside the returned component (isolated fiber), or the changing field set breaks the Rules of Hooks.
  - **Field-granularity edge cases** (judgment, not mechanical): a scalar cluster sharing one `useAppForm`
    + a `grid sm:grid-cols-2` stays **one** field (Website `general` = site name/domain/description —
    splitting would linearize the grid); asymmetric view/edit composites reconcile into **one ordered field list**
    where each field is view-only, edit-only, or both, and the mode picks the renderer (Category
    `genreMoods` edit-only + `autofillSources` view-only; Newsletter `name`/`tags`/`genreMoods` edit-only +
    `metadata` view-only); a within-tab `<Separator/>` folds into the **leading edge of the field it
    precedes** (Newsletter `tags`/`genreMoods`), since the layout inserts separators only between sections.
  - **Extracting a coarse composite into granular fields (the repeatable recipe).** The inverse of the
    "keep it composite" judgment above: when an operator should be able to place a composite field's
    sub-fields independently (e.g. the bookmark `general`/"Details" field → Name / Primary language /
    Names / URL / Description / Category / Media type / Tags, with the blacklists pulled into an **Advanced**
    section — #1163), promote each sub-field to its own `WorkbenchField` key. Two shapes, by how the
    sub-field is backed:
    1. **Independently-backed sub-field** (its own hook / react-query-backed, no shared `useAppForm`) →
       promote it directly: add a `WorkbenchField` (its `edit`/`view` renderer wraps the existing
       sub-component) and place its key in `defaultLayout`. This is the Category precedent
       (`primaryLanguage`/`names` broken out beside the `details` composite) — nothing else is needed
       because react-query already coordinates the shared state across the separate fibers. Category's
       `name`/`icon`/`description` (#1186) turned out to be this same shape even though they shared one
       `useAppForm` — the grid was only a layout convenience, with **no real cross-field coordination**
       between the three (each already auto-saved on its own trigger); splitting them just meant giving
       each its own tiny `useAppForm` + `useFieldAutoSave` instance, not a form-context provider. Check
       for genuine coordination (shared validation, one field's save affecting another) before reaching
       for shape 2 below. A single **bundled** state hook likewise counts here (no provider) when each
       returned slice is used by exactly one field and auto-save is per field: every granular field
       component calls the one hook and reads only its slice — Newsletter (`useNewsletterGeneralForm`)
       and **YouTube Channel** (#1192, `useYouTubeChannelGeneralForm`, atomized into name / description /
       avatar / default-category / self-ids / tags / websites / groups / labeled-websites / genres; the
       avatar field owns the "Sync from source" registration).
    2. **Shared-`useAppForm` composite** (one controller with cross-field coordination — the bookmark
       General form: name-blur autofill, website-lookup → autofill offer → category, primary-language
       sync) → because the render seam calls each field renderer as a plain function, N independent field
       components would each spin up N separate form instances. Introduce a **form-context provider** at
       the entity's **edit-view** level that instantiates the controller **once**
       (`BookmarkGeneralFormProvider` in `BookmarkGeneralFormContext.tsx`, mounted by `BookmarkEditView`
       around the edit body — gated on the active tab hosting a shared-form field so it mounts exactly
       where the old monolithic form did). **A slug-routed entity has no bespoke edit view** (it renders
       through the generic `EntityEditView`), so it declares the provider on its **workbench descriptor**
       instead — `editFormProvider` + `sharedFormFieldKeys` on `EntityWorkbench`, which `EntityEditView`
       uses to wrap the edit body with the same active-tab gate (reference: `websiteWorkbench` +
       `WebsiteGeneralFormContext.tsx`, #1188). Each granular **edit** field is then a thin component that
       reads the shared controller from context (`useBookmarkGeneralFormContext`) and renders the existing
       sub-component; **view** fields read the entity directly and need no context. Split any shared
       sub-component into per-field halves (`BookmarkGeneralRelationsSection` → media-type + tags;
       `BookmarkBlacklistSection` → the two blacklist halves) and **recompose** the original from the
       halves so its story/test and any other consumer stay unchanged (the "form reused elsewhere is
       recomposed" rule below). Place the new keys in `defaultLayout` — grouping the pulled-out fields
       into a **titled section** (`{ key, title, fields }`) is how the old `CollapsibleFormSection`
       "Advanced" becomes a first-class section. Finish by updating the both-modes snapshot
       (`bookmarkLayout.test.tsx`) to the new field/section order. See the **`surface-entity-field`**
       skill's "Extraction (reverse direction)" section.
  - **A form reused elsewhere is recomposed, not deleted.** `CategoryGeneralForm` (used by `CategoryCard`)
    and `NewsletterGeneralForm` (used by its story) are recomposed from the **same** extracted per-field
    sub-components the registry uses, so their output/tests/stories are unchanged while the layout tab gets
    per-field placement. `usePrimaryLanguageField` is react-query-backed, so mounting it in two separate
    fields (name-sync + the standalone primary-language field) coordinates via the shared cache.
- **Nav grouping survives the layout path.** The edit strip's "More" dropdown (consecutive same-`group`
  tabs collapse under a shared `group` label) is code-only metadata on `WorkbenchTab.group`,
  **never persisted in the layout jsonb**. `deriveWorkbenchTabs` re-attaches each resolved tab's `group`
  from the matching `workbench.tabs[key]` — so a layout-driven descriptor keeps a thin `tabs` array solely
  as the group source, and a user-created tab (no matching key) stays flat.
- **Resolution.** Defaults derive from **code, never the DB**: an absent/empty stored layout resolves to
  the descriptor's `defaultLayout`, so a deploy with no saved layout renders as today. The pure
  `resolveLayout(stored, defaultLayout, knownFieldKeys)` (`@eesimple/types`) reconciles a stale stored
  layout: unknown field keys dropped, known-but-unplaced fields appended to their default home
  (recreating a deleted container so a new code-added field can never be invisible), ≥1 tab always
  resolves. The two render-time gates it defers to the renderer live in the pure helpers in
  `lib/workbenchLayout.ts` (`fieldRendersInMode` / `visibleSectionsForTab` / `modeVisibleTabs`): a
  section with no mode-visible field, and a tab with no visible section, are hidden at render.
- **Persistence + the editor are live.** `hooks/useEntityLayout.ts` `useEntityLayout(kind)` is the
  **single read seam** every consumer goes through (`useResolvedWorkbenchLayout(workbench)`); it reads the
  `entity_layouts` store via `useEntityLayouts()` (`hooks/useEntityLayouts.ts` → `GET /api/entity-layouts`,
  one shared cached query) and returns the kind's stored `layout` (or `null` → the code `defaultLayout`).
  Writes go through `useSaveEntityLayout`/`useResetEntityLayout` (`PUT`/`DELETE /api/entity-layouts/:kind`,
  served by `middleware/routes/entityLayouts.ts` + `services/entityLayouts.ts`, whose `upsertEntityLayout`
  is select-then-branch so it stays testable against the in-memory fake db). The **DnD editor** is
  `components/LayoutBoard.tsx` (a dnd-kit Tab › Section › Field board with an unplaced-fields tray + a tab
  `IconPicker`, controlled `value`/`onChange`, no persistence of its own), staged and committed by
  `PageLayoutsSettings.tsx` on **Settings → Display → Page Layouts**. You can also prove the loop by hand:
  `PUT` a layout for a kind and the live page rearranges in both modes; `DELETE` resets to the default.
  - **Editor selectable-list caveat.** The render path honors stored layouts for **all** kinds, but the
    editor's kind picker (`LAYOUT_DRIVEN_ENTITIES` in `lib/layoutDrivenEntities.ts`) currently lists only
    these **13**: **Bookmark, Category, Newsletter, Group, Custom Property, Genres & Moods, Tag, Website,
    Media Type, Location, YouTube Channel, Person, Autofill**. Growing it to the remaining layoutable
    kinds is **T13 (#1371)** — add one `{ kind, label, fields, defaultLayout }` entry per kind; the render
    side needs no change. (An entity is added here once its General composite (or, for a config entity,
    its main composite field) is broken into granular fields — e.g. Group #1195, Website #1188, Location
    #1191, YouTube Channel #1192, Person #1194, Autofill #1197.) **Card Display Rules is *not* a
    layoutable kind** — it's a settings page, absent from `LAYOUTABLE_ENTITY_KINDS`, so it can't be added
    here without first being turned into a slug-routed entity with a field registry.
- **Dynamic (user-defined) placeable fields (#1163+).** The layout engine also carries **runtime-sourced**
  fields, not just the compile-time `fields` registry: a descriptor may set `useDynamicFields` (on
  `EntityWorkbench`) returning a `DynamicFieldSet` (fields keyed by a runtime id + a `defaultHome`
  tab/section). `useLayoutDrivenWorkbench` (`hooks/useEntityLayout.ts`) merges these into the resolved
  `fields` and appends their keys to an **augmented** `defaultLayout` (via `augmentDefaultLayout` in
  `lib/workbenchLayout.ts`) so an unplaced/new one still gets a home — keeping `resolveLayout` pure and
  the invisibility invariant intact. Every layout consumer (`EntityInfoView`/`EntityEditView`/
  `WorkbenchRouteTab`, the bookmark detail/edit bodies, and `PageLayoutsSettings`' tray) routes its
  workbench through this seam. **Bookmarks are the sole source today:** each **enabled** custom property
  is a placeable field keyed by its id (`useBookmarkDynamicFields` in `BookmarkPropertyLayoutFields.tsx`;
  the Card-Display-Rules card-field convention), so an operator arranges individual properties across the
  bookmark view/edit tabs. All per-property edit fields share **one** `useBookmarkPropertiesForm`
  controller via `BookmarkPropertiesFormContext` (mounted by `BookmarkEditView` when the active tab hosts
  a property field), since the controller debounce-persists the whole value set. This **replaced Property
  Groups**, which was removed — there is no property-group entity, table, or `propertyGroupId` column; the
  bookmark property view/form and the filter sidebar render properties flat.
- **Explicitly out of scope for v1 — don't "fix" these:**
  - **Create forms are unaffected.** The Add Bookmark quick-create form keeps its own, separate placement
    system (Settings → Display → Bookmark Add Form; see **Add Bookmark form field placement** + the
    `bookmark-add-form` skill). Page Layouts governs **view/edit** surfaces only.
  - **No per-mode divergence.** One layout tree drives both view and edit; the mode only chooses which
    renderer of a field fires. There is no separate stored arrangement for view vs edit — an edit-only or
    view-only field is how a per-mode difference is expressed.
  - **No per-user layouts.** A layout is **per-deploy** (one stored `entity_layouts` row per kind,
    operator-set), not per-user; there is no user column.

## Large-form / over-cap decomposition

When a component or hook trips fallow's cognitive-complexity cap (`maxCognitive: 25`), the cause is
usually **hook-density, not branching**. fallow scores **each function independently** — nested
function bodies are **not** rolled into the parent (unlike SonarJS) — so **extracting handler
functions does not lower a component's score**. What it counts is **+1 per hook call** (`useState` /
`useRef` / `useEffect` / every custom hook) plus +1 per `??`, `&&`, and ternary (`?.` only affects
*cyclomatic*). A form that calls ~25 hooks is over the cap before a single `if`. Use
`pnpm exec fallow health --complexity-breakdown` to see the per-decision contributions.

The remedy is to **spread the hooks**, not the handlers. The reference is the **bookmark form**
(`BookmarkForm.tsx`, ~250 lines of thin JSX):

- a **controller hook** (`useBookmarkFormController.ts`) owns the `useAppForm` instance, the state,
  and every create/edit/scan/reset handler — the component just wires its return into JSX;
- **cohesive state sub-hooks** partition the `useState`s so no one function is hook-dense
  (`useBookmarkFormUiState`, `useSourceDefaultFlags` in `useBookmarkFormState.ts`);
- **module-level pure helpers** hold the heaviest self-contained logic and the `??` chains, and are
  unit-tested directly (`bookmarkSubmit.ts`'s `applyImageIntent` / `promoteSourceDefaults`,
  `buildBookmarkDefaultValues` in `bookmarkFormSchema.ts`).

This is the **state-orchestration** sibling to **PropertyForm**'s section-component split (see
**Content hierarchies**): PropertyForm divides the *rendered UI* into section components typed via the
shared form-API sample type; the bookmark form additionally moves the *state + handlers* out of the
component. Reach for a controller hook when the cap pressure is hook-density rather than inline JSX
branching. Don't reintroduce a `// fallow-ignore-next-line complexity` to dodge this. The
**CMD+K palette** is the same pattern at coordinator scale: its state hooks live in
`useCommandPaletteState.ts` and each command group is its own component
(`CommandPaletteNavGroups` / `ListingPageCommandGroup` / `CommandPaletteTaxonomyModes` / …), leaving
`CommandPalette.tsx` as handlers + composition — split a new over-cap coordinator along the same
group seams rather than growing it inline. This nests when the extracted view is itself over cap:
`CommandPaletteTaxonomyModes`' flat chain of `mode === "…" && bookmarkId && (<SubPalette .../>)`
guards became one small named component per mode (each doing its own guard, scored independently);
`CommandPalette`'s "default view" fragment became `CommandPaletteDefaultView`, whose own guard-chain
group render was further split into one component per conditional group
(`BookmarkQuickEditGroups` / `QuickAddGroup` / `SyncFromSourceGroup` / …). See the
**`decompose-over-cap`** skill for the full pattern table (hook-density → sub-hook, `??`/ternary →
pure helper or reuse an existing one, switch-shaped dispatch → per-branch components, repeated
non-JSX blocks like `useBookmarkGeneralForm`'s 7 near-identical `save<Field>` mutators → one
parametrized helper).

## Edit-tab auto-save standard

Every slug-routed entity **edit** tab (Categories, Custom Properties, Websites, Media Types, YouTube
Channels, Tags, Autofill) **auto-saves per field — there is no Save button.** Each
field persists on its own and fires a toast that **names the field** and is recorded in the
Notifications log (the header **bell popover**, `components/NotificationsBellPopover.tsx`, over the
`notificationStore` — this is the history home since the right drawer was removed in issue #1108).
The single implementation is `hooks/useFieldAutoSave.ts` (the
`saveField` engine: single-field PATCH, deep-equal no-op skip, invalid skip, success-only snapshot
advance) + `lib/autoSave.ts` (`notifyFieldSaved` / `notifyFieldSaveError` wording). **Reference:
`components/CategoryGeneralForm.tsx`.** The full recipe + rules live in the **`toast-notifications`**
skill — consult it before building or changing an edit tab. In short:

- **Trigger:** text/textarea save **on blur**; toggles/selects/checkboxes/comboboxes save **on
  change**. Keep `useAppForm` + the zod schema for field state/validation, but **delete** the `<form
  onSubmit>` wrapper, `<form.SubmitButton>` / `requireDirty`, and any manual `JSON.stringify` dirty
  check. The `lib/form.tsx` primitives already expose `onBlur` (text/number) and `onValueChange`
  (select/combobox) hooks — wire them; don't fork the primitives.
- **Invalid/failed saves keep the user's input** (never revert); the field-named error toast + the
  inline field error are the only feedback. An invalid value simply doesn't fire a save.
- **Name fields drive the slug** — pass `saveField`'s `opts.onSuccess` to navigate to the new slug
  when it changes (the on-blur trigger keeps this from firing mid-typing).
- **Multi-key sections** (e.g. `categoryIds` + `allCategories`) call `update.mutate({ … both … })`
  directly with one `notifyFieldSaved("Categories")` so the user sees a single section toast;
  association/toggle tabs (`CategoryCustomProperties`) just add the `notify*` callbacks to their existing
  mutation.
- **Exceptions:** **create** flows (create pages, right-panel create, inline-create modals) keep an
  explicit submit button — `PropertyForm` (full) and `TagForm` stay submit-driven for create while
  their per-tab **edit** forms auto-save. **Bookmark edit** also auto-saves per field now (General tab
  scalars via `useFieldAutoSave` + a bespoke `saveUrl`; the Properties tab debounce-persists the whole
  value set like the Languages tab, one "Properties" toast) — the **only** Save button left on bookmark
  edit is the Image tab's, which applies the staged multi-image picker intent (uploads/kept/main/
  removals) that can't be expressed as a single field; every other Image action already saves
  immediately. **Bookmark edit is now the single layout-driven `?tab=` route (#1163)** — the per-tab
  route quartet is gone; each edit tab body is the `"bookmark"` field registry's `edit` renderer wrapping
  the **same** form component (`BookmarkGeneralForm` / `BookmarkRelatedForm` / `BookmarkPropertiesForm` /
  `LanguageUsagesTabEditor` / `BookmarkImageEditForm` / `BookmarkVideoEditForm`), so none of these save
  semantics changed; the General Delete danger zone is a `BookmarkEditView` fixture (bookmarks are
  id-routed, off the workbench `useDelete` control). See **Content hierarchies → Bookmarks are
  layout-driven**. **Local-only Zustand prefs** stay instant with **no toast**
  (nothing persists server-side). The no-toast carve-out is **only** for *ephemeral, device-local
  view prefs* in `uiStore` — what now remains there is `theme`, `collapsedSidebarSections`, the
  physical sizing (`sidebarWidth`/`panelWidth`/`tableColumnWidths`), open/closed state
  (`addBookmarkFormOpen`/`collapsedHomepageSectionIds`), the page-level listing prefs
  (`bookmarkColumns`/`viewMode`/`bookmarkImageMode`/…), and the transient filter/header state. A
  setting that must **stick across devices/browsers** belongs in the server-side `app_settings`
  singleton (`services/appSettings.ts` + `hooks/useAppSettings.ts`), **not** `uiStore` — and once it
  persists server-side it **does** fire a specific, recorded toast on save like any other persisted
  setting. The **Display / Sidebar (Drawer) / Automations** settings pages were migrated this way
  (issue #410, mirroring the **Advanced** Coolify/docs/Storybook fix): the sidebar-visibility lists,
  auto-fetch, bookmark-detail media sizing/layout, the listing search-box
  pin (`searchBoxPinned`), and the built-in Cropped W/H are server-backed groups
  (`/api/app-settings/{sidebar-customization,automation,display-preferences}`), read via convenience
  hooks (`useCroppedWidth`, …) and written with a `notifySuccess` toast —
  **including the inline popovers** that set the same prefs (detail-layout) and the on-blur Cropped
  W/H inputs. Don't misclassify a should-persist setting as a local pref: that's exactly what shipped
  those pages toast-less (and non-syncing) before the move. (The `panelPinned`/
  `drawerUnpinnedBreakpoints`/`sidebarOpenModifier` keys of these groups are dormant orphans left over
  from the removed right drawer — issue #1108.)

## Data shaping: middleware vs. client

**Default rule:** API endpoints return *render-ready* shapes. Heavy joins, aggregation, grouping,
tree-building, counting, and condition/relationship derivation belong in the middleware's
`services/`, **not** in React components/hooks. If a component is joining across query results,
grouping, aggregating, or building a tree from a flat list, that shape should come from an endpoint
instead.

**Patterns to mirror** (the middleware already does the heavy lifting — follow these):

- **Counts** — `computeTagBookmarkCounts` (subtree + own counts) in `services/tags.ts` and its
  locations twin, both thin wrappers over the generic `parentId`-tree helpers in
  `utils/parentTree.ts` (children map, subtree ids, subtree bookmark counts — reuse these for any
  new tree taxonomy); the category bookmark-count subquery in `services/categories.ts`. The client
  renders the number; it doesn't tally rows.
- **Trees** — `buildTagTree` / the media-type tree returned by `/api/tags/tree` and
  `/api/media-types/tree`. The client only flattens for indentation.
- **Batched hydration** — `hydrateBookmarkRows` (`services/bookmarkHydration.ts`) joins
  website/mediaType/channel/tags/property-values/images into a render-ready `Bookmark` with no N+1.
- **Plex media taxonomy CRUD is a factory** — `createPlexTaxonomyService`
  (`services/plexTaxonomyService.ts`) generates the list/create/update/delete/bulkDelete/
  backfillSlugs set for movies/tvShows/episodes/tracks (albums stays custom for its People/Group
  credit transactions). A new Plex-shaped taxonomy service should be a thin factory wrapper, not a
  copy of a sibling file; the client table columns for these come from `plexMediaColumns` in
  `components/tables/columnHelpers.tsx` the same way.
- **"Load once → evaluate the shared predicate in-memory → hydrate matches"** —
  `listHomepageSectionBookmarks` (`services/homepageSections.ts`) and `previewAutofillMatches`
  (`services/autofill.ts`) both load via the **bookmark cache** (below) and run the **shared**
  `evaluateConditions` from `@eesimple/types`. Server-side processing that shares logic with the
  client must call the same `@eesimple/types` function — never a re-implementation or a parallel SQL
  translation of the same predicate. The autofill **last-writer merge** follows the same rule:
  `mergeMatchingAutofillRules` / `urlTitleConditionInput` live in `@eesimple/types`
  (`autofillMerge.ts`) and are the single implementation behind both the client form prefill
  (`lib/autofill.ts`) and server-side creation (`suggestAutofillForBookmark`).

**Sanctioned exceptions that stay client-side** (don't "fix" these by adding endpoints):

- **Interactive, URL-driven filter/search state** — `lib/bookmarkSearch.ts`
  (`bookmarkMatchesSearch`) and the range sliders / multi-selects it backs. A round-trip per slider
  drag would hurt; the bookmarks page deliberately fetches the whole set once and filters in memory.
  `bookmarkMatchesSearch` and `hasAnyActiveFilter` are both thin `.every()`/`.some()` iterations over
  one `BOOKMARK_SEARCH_FACETS` table — each entry pairs a facet's match predicate with its
  active-filter check, so adding a facet is one table entry instead of editing both functions'
  `&&`/`||` chains (see the **`filterable-facet`** skill).
- **Presentation formatting** — `lib/bookmarkFormat.ts` (number/boolean/date-time display).
- **Derivations that are O(n) over data the page already loaded** — slug lookups (`use*BySlug`),
  facet slider bounds (`effectiveBounds`), and "which rules target this entity"
  (`lib/autofillRulesFilter.ts`). These are free because the list is already in cache; an endpoint
  would only duplicate logic.
- **Card Display resolution** — `lib/cardDisplayRules.ts` (`resolveCardDisplay` +
  `useResolveCardDisplay`) evaluates the shared `evaluateConditions` against each rendered bookmark in
  the listing grid (`BookmarkListPane`) to decide that card's **per-section** visibility (each
  `CardDisplaySection.visibleIf`) + image presentation. It runs client-side because cards render
  client-side over the already-cached config/tags; there is **no** server bookmark endpoint for the
  config. The config service (`services/cardDisplayRules.ts`) is therefore CRUD-only, and it never
  touches `invalidateBookmarkCache()` (display-only, not matchable data).

**Caching / growth path.** When work must move server-side but the logic is shared with the client
(filtering, condition matching), prefer the **middleware in-memory cache + shared predicate** over
translating predicates to SQL. `services/bookmarkCache.ts` holds the bookmark rows + per-bookmark
`ConditionInput`s + tag-descendant resolver, rebuilt on a version bump; it is coherent because the
gateway runs a single middleware child. **Every write that changes a bookmark's matchable data (the
bookmark row, its tags, or its custom-property values) — or the tag tree — must call
`invalidateBookmarkCache()`** (see the calls in `services/bookmarks.ts`, `services/tags.ts`, and
`services/customProperties.ts`). This keeps one source of truth for the predicate while moving the
work off the client. SQL-level filtering is the last resort, reserved for genuinely large datasets.

## Multilingual display names

An entity (bookmark or taxonomy term) can carry multiple language-labelled names (`entity_names`,
`packages/types/src/entityNames.ts` — a pure module shared by API + browser). Three languages drive
how those names surface, and they are **distinct — do not conflate them**:

- **Interface language** (`interfaceLanguage`, react-i18next / `Intl`) — the UI chrome locale.
- **Secondary display language** (`secondaryLanguageId`, `null` = auto) — which language's name shows
  as the de-emphasized secondary label (breadcrumbs, comboboxes) when there's no primary override.
- **Fallback display language** (`fallbackLanguageId`, **`null` = English**) — the last-resort
  language for the secondary label (and the `preferRomanized` sort fallback) when **no**
  preferred/secondary-language name matches. This is the configurable replacement for the formerly
  hardcoded English. All three live in the **display-preferences** app-settings group (Settings →
  Display → Names) and are mirrored end-to-end (type → `app_settings` column → service → route →
  `useAppSettings` hooks → UI). Read it via `useFallbackDisplayLanguage()` (never returns `null` —
  unset resolves to `{ isoCode: "en" }`) / the app-root `FallbackDisplayLanguageProvider` context
  (`useFallbackDisplayLanguageValue()`, `null` outside the provider), and thread it as the last arg
  of `resolveDisplayNames` / into `resolveNameSortKey`'s opts. **Default deploy is byte-identical** —
  omitting/`null` reduces to the old English fallback inside the pure helpers.

**Only display/sort follow this setting.** Slug derivation (`slugSourceFromNames`, the Locations
`englishName` slug source), Wikidata/Wikipedia link resolution, and the source-derived English
`entity_names` persistence (`mergeEnglishEntityName`) **stay English-anchored** — a source's English
name is stored as English regardless of the display fallback, and slugs stay stable.

## Language usage levels & associations

A **language** can be tagged with a **usage level** on many owner entities — e.g. "English dub",
"Japanese subtitles only", "sparse English explanations", or a person's "native / conversational"
proficiency. Two pieces back this (see the **`add-entity`** / **`add-condition-type`** skills for the
change recipes):

- **`language_usage_levels`** — a user-definable taxonomy (mirrors `place_types`) **grouped by
  `kind`**: `availability` (Dub, Subtitles, Explanations…) qualifies content, `proficiency` (Native,
  Fluent, Learning…) qualifies People. `kind` is free text (add a kind without a migration); built-ins
  are seeded (`ensureBuiltInLanguageUsageLevels`) and non-deletable — but **hideable** from pickers via
  the `hidden` flag (see **Hiding seeded built-in vocabularies**). Its `(kind, name)` uniqueness is a
  **`uniqueIndex`, not a `unique()` constraint** — see the composite-unique rule under **Database
  schema changes** (a composite `unique()` there crashed prod `drizzle-kit push`). `deleteLanguageUsageLevel(id, reassignToId?)` reassigns or drops referencing rows (no
  cascade FK), like `deletePlaceType`.
  - **`/taxonomies/language-usage-levels` is a two-screen surface, reached via a flyout on the
    Languages sidebar item** (`LanguagesSidebarItem`, mirroring `GroupsSidebarItem` → Group Types; it
    is **not** its own `taxonomyItems` row — it's in `settingsPages.ts`'s `STANDALONE_PAGES` like
    `group-types`). The **index** is a grouped **Overview** (`LanguageUsageOverview`): sectioned by
    `kind`, with a group-by toggle (Usage level ⇄ Language) and expandable rows; clicking a leaf opens
    that language's scoped bookmarks page filtered to the level. **To add/rename/delete a level, use
    the Edit page** `/taxonomies/language-usage-levels/edit` (the `LanguageUsageLevelsManager`
    grouped-card CRUD), reached from the Overview's "Edit levels" button — not a code change. The
    Overview is fed by `GET /api/language-usage-levels/associations` (`listLanguageUsageAssociations`
    in `services/languageUsages.ts` → `useLanguageUsageAssociations`): the distinct (language, level)
    pairs with counts across **all** owners, since languages↔levels only relate *through* owner
    associations. That endpoint is the **only** derived read — it is display-only, never touches
    `invalidateBookmarkCache()`.
- **`language_usages`** — the codebase's **first value-carrying polymorphic association**. Keyed by
  `(ownerType, ownerId)` with **no FK on `ownerId`** (mirrors `taxonomy_images`), plus a surrogate `id`
  and a **`uniqueIndex`** on `(ownerType, ownerId, languageId, usageLevelId)` (a unique *index*, not a
  table `unique()` — the composite-unique rule again). Owners are the API-authoritative
  `LANGUAGE_USAGE_OWNER_TYPES` tuple in `@eesimple/types` (`languageUsages.ts`) = **`["bookmark",
  "website", "youtubeChannel", "person"]`** — the enum the routes validate against. (A separate, wider
  constant of the same name lives in the middleware `schema.ts`, but it is **not** the set the API
  enforces; don't quote it as the owner list.) One shared service (`services/languageUsages.ts`) does it
  all: `loadLanguageUsages(ownerType,
  ownerIds[])` (the batched, denormalized read loader reused by every owner), `setLanguageUsages`
  (replace-all), `deleteLanguageUsagesForOwner`, and `listLanguageUsageAssociations` (the overview
  matrix above).

**Sync points a new owner type (or a schema change) must hit** — none of these are compiler-enforced:
- Because `ownerId` has no FK, **every owner's delete service must call
  `deleteLanguageUsagesForOwner(<ownerType>, id)`** or it orphans rows (see the calls in
  `services/{bookmarks,people,websites,youtubeChannels}.ts`).
- **Bookmarks are the matchable/filterable owner.** `setLanguageUsages`/`deleteLanguageUsagesForOwner`
  call `invalidateBookmarkCache()` **only** for `ownerType === "bookmark"`; the bookmark's usages ride
  on the hydrated `Bookmark` (`bookmarkHydration.ts`) and populate `ConditionInput.languageUsages` in
  `bookmarkCache.ts`. Filtering is a **`language-usage` condition leaf** (autofill + homepage) that
  matches **per association row** — `(languageIds ∅ ∨ row.language ∈ languageIds) ∧ (usageLevelIds ∅ ∨
  row.level ∈ usageLevelIds)` — so English-dub + Spanish-subs does **not** match {English, Subs}.
- The bookmark **search-sidebar** exposes the same per-row predicate as **two multi-selects**
  (`LanguageUsageFilterSection`). It is a **deliberate exception to the `FILTER_FACETS` on-demand
  registry** (`filterable-facet` skill): a dual-vocabulary, self-fetching section that is always shown
  when it has options (both vocabularies are always-seeded built-ins), rather than a single-entity
  facet threaded through the `BookmarkSearchView` routes.

Editing is uniform: each owner's edit surface has a **Languages tab** (auto-save on entities, the
bookmark edit tab) built from the shared `LanguageUsagesEditor`/`View`; only the `kind` prop differs
(`availability` for content, `proficiency` for People).

**No separate primary-language field on bookmarks.** Bookmarks used to carry a single-valued
`bookmark.languageId` primary field alongside `language_usages`, editable via a dedicated General-tab
combobox and a Languages-tab field. That field/column and both components were removed — a bookmark's
main content language is now expressed the same way as Dub/Subtitles/Explanations: an ordinary
availability-kind `language_usages` row. There is no built-in level seeded for this — an operator names
one (e.g. "Primary Language") via the Edit Levels page, the same as any other usage level. Scan/ISBN
auto-detect (`useBookmarkPrimaryLanguage.ts`) looks up an existing availability-kind level named
`"primary language"` (case-insensitive, `PRIMARY_LANGUAGE_LEVEL_NAME` in `bookmarkFormSchema.ts`) and
attaches the detected language to it — silently no-opping until that level exists — instead of writing
a dedicated field; on create it stages the entry into `CreateBookmarkInput.languageUsages` (inserted in
the same create transaction, mirroring `genreMoodIds`), and on edit it merges into the bookmark's
existing usages via `setLanguageUsages`. `Language.bookmarkCount` and
`/taxonomies/languages/$languageSlug` (an entity-scoped bookmarks page) now derive purely from
`language_usages` — there is no more "primary" carve-out to merge in. The page honours a friendly
`?usageLevel=<slug>` search param — narrowing to bookmarks carrying that language at that level, shown
as a clearable chip — kept **out** of the shared `BookmarkSearch` type so the URL stays canonical. Its
breadcrumb name resolves via `useLanguageBySlug` wired into `-appHeaderNames.ts` (the `add-entity`
breadcrumb sync point).

## Genres & Moods & the polymorphic assignment layer

**Genres & Moods** is a single slug-routed hierarchical taxonomy (`/taxonomies/genres-moods`,
`genre_moods` table, `GenreMood` type) that unifies genre- and mood-style classification into one
`parentId` tree — built like a tree taxonomy (Media-Types-shaped scaffold, Tags-style tree + a
Hierarchy tab; no built-ins). Unlike a single-FK taxonomy it attaches to **both bookmarks and any
other taxonomy entity** through the **generic polymorphic assignment layer** — G&M is no longer
special-cased; it is an ordinary taxonomy whose rows ride the same `taxonomy_assignments` table every
custom taxonomy uses:

- **`taxonomy_assignments (taxonomyId → taxonomies, termId → taxonomy_terms, ownerType, ownerId)`** —
  the generic M:M linking any taxonomy term to any owner. Real FKs on the value side
  (`taxonomyId`/`termId`), an unconstrained `ownerId` on the owner side (**no FK**). `ownerType` for a
  G&M attachment is one of **`GENRE_MOOD_OWNER_TYPES`** (`@eesimple/types` `genreMoods.ts`) — the
  **single edit point** for the G&M target set (currently bookmark + category/tag/website/mediaType/
  youtubeChannel/person/group/newsletter/location/language + itself; config entities —
  autofill/card-display-rules/import-rules/saved-filters — are intentionally excluded). The shared
  service is `services/taxonomyAssignments.ts` (`getOwnerTaxonomyTerms` / `setOwnerTaxonomyTerms` /
  `listTermIdsByOwnerType`); `services/genreMoodAssignments.ts` is a thin **legacy shim** that scopes
  those generic calls to the G&M taxonomy id.
- Because `ownerId` has **no cascade FK**, every owner's `delete*` service must clean up its rows via
  **`deleteTaxonomyAssignmentsForOwner(ownerType, id)`** — one call removes *every* taxonomy's rows
  (G&M included) for that owner. Bookmarks do this across **all three** bookmark-delete paths
  (`deleteBookmark`/`bulkDeleteBookmarks`/`deleteOrphanedBookmarks`) via `cleanupGenreMoodAssignments`,
  which deletes the bookmark's `taxonomy_assignments` rows. Bookmark-owner writes call
  `invalidateBookmarkCache()`. **Image cleanup is separate and per-entity**, not a generic owner
  registry: each entity that stores images has its own table + service (`bookmarkImages` / `groupImages`
  / `personImages` / `youtubeChannelImages`; `socialImages` is a fetch-only helper), and its own delete
  path removes its images. There is **no** `deleteTaxonomyImagesForOwner` / `TAXONOMY_IMAGE_OWNER_TYPES`
  / `services/taxonomyImages.ts` — the `taxonomy_images` table exists as a schema pattern, but there is
  no shared taxonomy-image owner-cleanup helper.
- **Bookmarks** carry `genreMoods: BookmarkGenreMood[]` (hydrated via a batched join on
  `ownerType='bookmark'`, linked in the create/update tx like `bookmarkTags`, submitted as
  `genreMoodIds`) and expose a placeable **`genreMoods`** card field (kept in sync in both
  `STANDARD_CARD_FIELDS` and the middleware `STANDARD_CARD_FIELD_KEYS`).
- **Cross-taxonomy UI is one reusable component** — `components/GenreMoodAssignmentSection.tsx` (over
  the generic `components/TaxonomyAssignmentSection.tsx`; `ownerType`/`ownerId` props, auto-saving
  multi-select with inline create) — dropped into **every** owner's edit General form. Adding a new
  owner = add it to `GENRE_MOOD_OWNER_TYPES` and drop the section into that entity's edit form; don't
  hand-roll a per-owner junction table.

Genres & Moods is **display/classification data, not a matchable condition leaf** today (no autofill/
homepage/card-rule Genre condition yet) — a filter facet + condition leaf is the sanctioned follow-up
(see `add-condition-type`/`filterable-facet`).

## Metadata fetching & connectors

The Add Bookmark form auto-fills metadata by scanning a URL/ISBN through a small set of external
"connectors". The pipeline favors keyless, self-hostable sources; the only off-box calls that require
configuration are explicitly opt-in (Tier 2, below).

- **One consolidated scan, not many round-trips.** `GET /api/scan` (`routes/metadata.ts`) resolves
  redirects, then in **one page fetch** returns title + description + image + authors + website lookup
  + duplicate check + an instant favicon URL (`ScanResult` in `@eesimple/types`). The client's
  `performUrlScan` (`useBookmarkFormController.ts`) calls it once and applies the result via the pure
  helpers in `useBookmarkScanHandlers.ts` (`applyScanMetadata` / `applyYouTubeMeta` /
  `applyPeopleFromNames`). **The granular endpoints stay** (`/api/fetch-title`, `/api/fetch-metadata`,
  `/api/resolve-url`, `/api/websites/lookup`, `/api/bookmarks/url-check`) for the per-field manual
  buttons — don't delete them. Scan results are cached in `services/scanCache.ts` (short TTL,
  size-capped). **That cache is display/metadata-only — never wire it into `invalidateBookmarkCache()`**
  (a bookmark write doesn't change a URL's page metadata; stale entries self-heal within the TTL — the
  same carve-out as Card Display Rules).
- **oEmbed is a registry — add a provider in one place.** `OEMBED_PROVIDERS` in
  `packages/types/src/oembed.ts` is the single source of truth for keyless oEmbed providers (Vimeo,
  Spotify, TikTok, …); the middleware `services/oembed.ts` also autodiscovers a `<link rel="oembed">`
  endpoint from the head HTML it already fetched, and the Connectors settings page lists providers by
  mapping over the same registry. Don't hand-list providers anywhere — derive from the tuple. See the
  **`add-connector`** skill.
- **Image capture stays server-side and SSRF-safe.** `fetchAndStoreOgImage` (`services/bookmarkImages.ts`)
  derives the image URL **from the bookmark's own stored URL** (never a client value), branching
  YouTube → oEmbed provider → og:image scrape. The oEmbed/YouTube thumbnail and every third-party
  image/icon URL passes `isPublicHttpUrl` before fetch.
- **ISBN has a keyless fallback chain.** `services/isbn.ts` tries Open Library, then Google Books;
  the route maps the discriminated outcome to 200 / 404 (not found) / 502 (providers unreachable).
- **URL→ISBN autodetect in `/api/scan` is gated per-website.** A pasted bookmark URL is scanned for an
  ISBN **only when** it matches a website that exists in the taxonomy **and** that website's
  **`scanUrlForIsbn`** flag is on (the "Scan URL for ISBN" checkbox on the website's edit General tab —
  a nullable boolean mirroring `redirectResolutionFailure`). When gated on, detection tries, in order:
  the Amazon ASIN (pure, `extractIsbn13FromAmazonUrl`) then its page scrape (`services/amazon.ts`), the
  O'Reilly path (pure, `extractIsbn13FromOreillyUrl`), the honto.jp page scrape (`services/honto.ts`),
  and — for any opted-in site with **no** dedicated connector — a **generic page scrape**
  (`extractIsbnFromHtml` in `packages/types/src/isbnScrape.ts` via `services/isbnScrape.ts`
  `fetchIsbnFromPage`). The detected ISBN rides `ScanResult.isbn`; the client fills the ISBN property
  when empty (`handleAmazonIsbnDetected`, unchanged). **`GET /api/scan` resolves the website first**
  (hoisted out of the metadata `Promise.all`) so the gate is known before any ISBN work is dispatched.
  The gate is **scan-only** — the explicit `GET /api/isbn/from-book-url` (manual per-URL resolve for
  Amazon/honto/O'Reilly) stays **ungated**. Consequence: a deploy with no opted-in website records
  autodetects no ISBNs from a scan by default.
- **A detected value that resolves to a taxonomy entity (not just a display string) is matched or
  created client-side, never inside the scan/ISBN endpoints.** E.g. bookmark language: `services/
  metadata.ts`'s `extractLanguage` (og:locale/`<html lang>`), the YouTube Data API's
  `defaultAudioLanguage`/`defaultLanguage`, and Open Library/Google Books' language fields all land as
  a raw normalized code (`utils/languageCodes.ts`) on `ScanResult`/`FetchIsbnMetadataResult`; the
  client resolves it to a `Language` row via match-or-create in `useBookmarkScanHandlers.ts`/
  `useBookmarkIsbn.ts`, mirroring the pre-existing person (author-name)/group (ISBN publisher-name) name-resolution flow. See the
  **`add-connector`** skill's Case D.
- **Plex-backed media taxonomies pull names + Wikipedia links from Wikidata.** For the five Plex
  taxonomies (Movies/TV Shows/Episodes/Albums/Tracks), `services/wikidataTitle.ts`'s
  `resolveTitleWikidata` resolves the native-script name (→ `name`), the English name (→
  `englishName`, persisted as an English `entity_names` row via `mergeEnglishEntityName`), and
  English + local Wikipedia links — pinned by the Plex item's external IDs
  (IMDb/TMDb/TVDB/MusicBrainz via `haswbstatement`, title-search fallback). **The persisted English
  row stays English regardless of the "Fallback display language" setting (see **Multilingual display
  names** below)** — the value
  literally *is* the English name from Wikidata (`name:en`), the slug source is English for stability,
  and English-Wikipedia resolution sends the English name on purpose; the fallback setting only
  changes which stored row is *shown/sorted*, never what a source-derived name is stored as. It shares the keyless
  Wikidata Action-API client **`services/wikidata.ts`** with the Locations geocoder
  (`wikidataGeocoding.ts`) — the low-level `fetchJson`/`searchEntities`/`getEntities`/`fetchSitelinks`
  plumbing lives there, not in either caller. This is **resolve-only** (`GET
  …/:id/plex-metadata-preview` → `resolvePlexTaxonomyMetadata`; never writes) and surfaced through the
  **"Sync from source"** review modal (the `plex-title` kind — poster + names + links reviewed
  current-vs-source, picked rows persisted by the edit form's per-field auto-save). Display metadata
  only → never `invalidateBookmarkCache()`. See the **`sync-from-source`** skill.
- **Podcasts are the keyless odd one out of the media taxonomies.** The **Podcasts** taxonomy
  (`podcasts` table, `bookmarks.podcastId`; the 8th "Media Property" alongside Books/Movies/…) is
  sourced not from Plex/Kavita but keylessly from **Apple Podcasts (iTunes Search & Lookup API)** and a
  pasted **RSS/XML feed URL** — `services/podcastFeed.ts` (`searchPodcasts`/`lookupPodcastByItunesId`
  via iTunes JSON, `resolvePodcastFeed`/`parsePodcastFeed` via `fast-xml-parser`, `importPodcastArtwork`
  storing the feed/iTunes artwork through the taxonomy-image gallery). A create/edit **search picker**
  (`PodcastSearchPicker`, keyless — always shown) fills name/author/feed/iTunes + artwork on select;
  the edit form registers a **`podcast-feed`** sync kind so **"Sync from source"** re-pulls
  name/author/description (staged) + artwork (immediate) from `GET …/:id/feed-preview`
  (`resolvePodcastFeedPreview`, resolve-only). No env var, no `ConnectorsStatus` gating (an always-on
  card on Settings → Connectors); SSRF-guard every feed/artwork URL with `isPublicHttpUrl`; display
  metadata only → never `invalidateBookmarkCache()`. See the **`add-connector`** + **`sync-from-source`**
  skills.
- **Tier 2 providers are gated (DB value or env var) and default off.** `services/hostedMetadata.ts`
  (`HOSTED_METADATA_ENDPOINT`/`_API_KEY`/`_PROVIDER`, Microlink-compatible) and the YouTube Data API
  path in `services/youtube.ts` (`youtubeApiEnabledAsync`, key from Settings → Connectors or
  `YOUTUBE_API_KEY`) are **active iff a key resolves** — mirror `docsEnabled()` /
  `isObjectStoreConfigured()`. Both **fall back to the keyless path** when unconfigured, so behavior
  is identical out of the box and nothing leaves the box unless an operator opts in. Keys are secrets
  → set via env var, or via **Settings → Connectors**, where they're stored **encrypted at rest**
  when `APP_SECRET` is configured (`getDecryptedHostedApiKey` / `getDecryptedYoutubeApiKey` in
  `services/appSettings.ts`; DB value wins over the env var) — the same pattern as the Kavita
  connector. `GET /api/connectors` (`routes/connectors.ts`) reports their on/off status (no secrets);
  `GET`/`PUT /api/app-settings/connectors` is the authenticated pair that reads/writes the keys
  themselves (never the raw value on GET — only a `*ApiKeySet` boolean). Both are surfaced on the
  **Settings → Connectors** page (`components/ConnectorsSettings.tsx`,
  `components/ConnectorMetadataForms.tsx`).

## Outside-source sync

Any entity that pulls fields from an outside source gets a **header-strip "Sync from source" button**
that opens a **review modal** (current value vs the source's new value, per-row overwrite checkboxes).
It's the single review layer over the scattered one-shot rescan / re-fetch-image actions. **To wire a
new source, see the `sync-from-source` skill** — don't re-implement the modal or header plumbing.

- **Register-on-mount, one place per surface.** A mounted **edit form** publishes a `SyncProvider` into
  `uiStore.syncProvider` via `useRegisterSyncProvider` (mirrors `uiStore.listingPage` /
  `useRegisterBulkSelect`); `syncFromSourceAction` (`components/header/toolbarSyncAction.tsx`) renders
  the button **only while a provider is registered**, so the button appears on edit surfaces with no
  per-entity header code. The modal is a single store-driven `AppSyncModal` (mirrors
  `AppAddBookmarkModal`) opened by the header button, the mobile menu item, and the CMD+K
  `SyncFromSourceCommandItem` — all just flip `uiStore.syncModalOpen`.
- **A provider is two halves.** `descriptorKind` (`bookmark` / `location` / `image-taxonomy`) selects
  the modal-side **fetch hook** (`use{Bookmark,Location,ImageOnlyTaxonomy}SyncSource`, each gated on the
  modal being open); the **registration hook** (`use*SyncRegistration`, in the entity's edit form)
  builds `applyStaged` closing over the live form. Diff-building is a **pure, unit-tested** helper in
  `lib/syncSources/{bookmark,location,imageTaxonomy}Diff.ts` (`fillEmptyDefault` for the checkbox
  default, `rowDiffers` to skip in-sync fields). Types live in `lib/syncSources/syncSourceTypes.ts`.
  Each fetch hook's own pending/error/group-assembly logic is a thin `SyncQuerySlot[]` description
  handed to the shared pure `resolveSyncSourceFetch` (`lib/syncSources/syncSourceQuery.ts`, also
  home to the `strRef`/`numRef` ref-readers) rather than a hand-rolled conditional chain per source.
- **Stage vs immediate.** Text/data rows **stage** into the form and persist through its own save —
  per-field auto-save everywhere now, including bookmarks (the bookmark sync registration threads an
  `onFieldStaged` callback that re-runs the General tab's title/description auto-save after staging).
  **Image rows apply immediately** (`applyImmediately: true`) — every image source stores-on-fetch and
  can't be staged.
  Keep providers referentially stable (memoize the provider, stabilize `applyStaged` via a `useRef` of
  the latest deps) or the register-effect thrashes the store.
- **Locations** get a **default-off re-geocode toggle** (`supportsRegeocode`): off = fill empty fields;
  on = force-overwrite coordinates + boundary via `repullCoordinates` (never sync the name/English
  name — they drive the slug). Respect the `locations-map` skill + `lib/locationLevels.ts` doc block.
- **Image-only taxonomy previews.** Since image sources store-and-apply with no preview, each source
  exposes a **resolve-URL GET** so the modal can show the incoming image: public-URL sources return
  `GET …/image/source-preview` → `{ imageUrl }` (YouTube channel / website / person; the resolver reuses
  the same helpers the store path uses so preview == applied); token-gated Plex streams
  `GET /api/plex/poster?ratingKey=` as bytes. Registered in the three inline general forms + the shared
  `PlexTaxonomyImageTab` (one registration covers all six Plex taxonomies).

## Locations & maps

The Locations map / "Levels" overlay / place-types subsystem is the codebase's most-churned area, so
its state model is **written down**: the top-of-file doc block in
`packages/client/src/lib/locationLevels.ts` is the spec (level groups, the `main`/`location`/`bookmark`
scope + anchors, the `visibleIds = (override ?? default) ∩ populated` layering, the three persistence
tiers, and the two distinct tree-prune operations), and the **`locations-map`** skill maps the whole
subsystem (render pipeline, place-type level groups, geocoding fallback chain) plus the change recipes.
**Read the doc block before touching any `Location*Map*` / `locationLevels` / geocoding file.** Key
seams: the two overlays share `components/locationLevelsShared.tsx` (a row/footer change lands in both
at once); "wrong levels/checkbox" bugs live in the pure helpers (`computeVisibleLevelGroupIds` /
`computePopulatedLevelGroupIds` / `resolveVisibleLevelGroupIds`, tested in `locationLevels.test.ts`),
never the components; and a per-map visibility checkbox is a throwaway local override while the pin/area
toggle beside it is a global server write via `useLocationLevels` — don't conflate the tiers.

## Creators: People & Groups

There is **no "Artists" taxonomy** — it was collapsed into the two creator taxonomies. **Individuals are
People; bands/companies/collectives are Groups** (the taxonomy renamed **Publishers → Groups** on `main`;
use the `Group`/`groups`/`groupId`/`services/groups.ts`/`useGroups`/`groupsApi`/`GroupGeneralForm`
identifiers). Both absorbed the former Artist's Plex-backed creator fields, so **People and Groups each
carry** `sortOrder`, `year`, the Plex link (`plexRatingKey`/`plexItemType`/`plexItemTitle`), and **album
credits** (People additionally keep `mediaPropertyId`; Groups use `groupTypeId` instead — they do **not**
have `mediaPropertyId`). The Plex-link + year + album-credit UI is the shared
`components/CreatorMediaSection.tsx`, wired into both `PersonGeneralForm` and `GroupGeneralForm` (a
person/band Plex-links against the Plex **`artist`** item type — `PlexKind` keeps `"artist"` for this,
even though a bookmark can no longer link an Artist row). Groups has its **own avatar/poster system**
(`group_images` + `services/groupImages.ts` + `/api/groups/:id/image*`), mirroring `person_images`.

- **Albums credit both**: the `album_artists` join was replaced by **`album_people` + `album_groups`**
  (`Album.personIds` / `Album.groupIds`); the album-credit UI is `AlbumCreditsSection.tsx`.
- **Bookmarks credit both**: `bookmark_people` (individual creators, `personIds`, hydrated as
  `Bookmark.people`) **and the new** `bookmark_groups` M:M (group creators, `groupIds`, hydrated as
  `Bookmark.groups`). These are **distinct from** the single `bookmarks.groupId` FK (hydrated as
  `Bookmark.group`), which remains the item's **publishing house** (e.g. an ISBN's publisher). Both
  multi-selects live on the bookmark edit **General** tab (`BookmarkGeneralRelationsSection` — People +
  Groups, each with `useEntityCreateOption` inline-create) and both have a CMD+K quick-edit sub-palette
  (`PeopleSubPalette` / `GroupsSubPalette`, gated in `BookmarkTaxonomiesGroup`). A bookmark no longer has
  an `artistId`, and `"artist"` is **not** one of the six bookmark media-link FKs (`useBookmarkMediaField`
  — book/movie/tvShow/episode/album/track) nor an image-owner (there is no `artist` image table; image
  storage is per-entity — `bookmarkImages` / `groupImages` / `personImages` / `youtubeChannelImages`).
- **Migration**: existing `artists` rows were folded into `people` by name (idempotent `migrate.ts`
  steps copy the rows + bookmark/album links, then drop the artists table). Group bands can't be
  auto-classified, so they land in People — re-credit them to Groups by hand.

## Franchise hub bookmarks

A **franchise / IP grouping** (e.g. "The Lord of the Rings") is modeled as an ordinary **hub bookmark**,
not a taxonomy. This is the replacement for the retired `media_properties` grouping (part of the #1057
Media Property → Media Type reconciliation) — the data migration materializes each old `media_properties`
row into this shape. The convention rides entirely on existing bookmark/relationship infrastructure; the
**only** dedicated piece is the built-in **"Franchise"** media type.

- **Hub shape** — a hub is a plain (usually **URL-less**) bookmark carrying `mediaTypeId = Franchise`
  (the built-in seeded by `ensureBuiltInMediaTypes()` in `services/mediaTypes.ts`). The Franchise media
  type is what makes hubs identifiable and gives a one-click **"show all franchises"** via the ordinary
  Media Type filter facet — don't add a parallel franchise vocabulary. URL-less hubs render via the
  #1070 nullable-`url` support. **Franchise is convention-only, not code-load-bearing** — no code
  resolves it by identity, so it is safe to **hide** (like any built-in; see **Hiding seeded built-in
  vocabularies**), though it stays non-deletable; hiding it only removes it from the media-type pickers,
  and existing hubs keep rendering.
- **Member edges** — a hub links each member via the built-in **directional Parent/child** relationship
  type, **hub = parent, member = child** (in the `BookmarkRelationshipsEditor`, tick "Selected bookmark
  is the parent" on the member so the hub becomes the parent). Storage/direction and rendering are the
  standard relationship stack: `bookmark_relationships` (parent = `bookmark_a_id`), `lib/bookmarkHierarchy.ts`,
  and the "Hierarchy" detail section (`components/bookmarkDetailSections.tsx`). The hierarchy keys off the
  generic **`directional`** flag, **not the Parent/child type's identity**, so Parent/child is likewise
  convention-only — hideable (non-deletable) without breaking hubs or the hierarchy view.
- **Franchise page = the hub bookmark's own detail view** (its Hierarchy/Related sections list the
  members) — this replaces `/taxonomies/media-properties/$slug`. Don't build a dedicated franchise page.
- **Discoverability is intentionally minimal.** Per-franchise browsing is the hub page; global discovery
  is the **Media Type = Franchise** facet plus the coarse **relationship-type** facet/condition leaf
  ("has a Parent/child edge"). The relationship-type facet/leaf are **role-blind** — they can't express
  "only members of franchise Y" — which is an **accepted, documented limitation**, not a gap to close
  here. A role/hub-aware franchise filter is a possible future follow-up.
- **`people.mediaPropertyId`** (vestige of the retired Artists taxonomy) is slated to be **dropped at
  `media_properties` retirement** — a person↔franchise link is expressible post-migration by crediting
  the person on the hub bookmark (`bookmark_people`).

## Favorite (starring) & sidebar flyouts

Every slug-routed entity (and every custom-taxonomy **term**) can be **starred** via a per-row
`isFavorite: boolean("is_favorite").notNull().default(false)` column. Starring surfaces a star toggle on
the entity's **header strip**, its **listing row**, and the **CMD+K palette**, and its starred members
appear in a hover **flyout** off that entity's sidebar item. The whole system is **generalized** — one
hook, one flyout component, one header resolver, one palette-field constant — so adding favorites to an
entity is a handful of sync points, not new components. **See the `entity-favorites` skill for the
recipe.** The load-bearing pieces:

- **`hooks/useFavoriteToggle.ts`** — `useFavoriteToggle(kind)` → `{ toggle(item) }`, registry-driven off
  `ENTITY_PALETTE_CONFIGS[kind]` (`updateFn`/`queryKey`/`extraInvalidateKeys`) with the standard
  Starred/Unstarred toast. `FAVORITABLE_KINDS` is the favoritable-kind set (all except the shortcut
  sub-taxonomies place-type/group-type/location-relation). Custom-taxonomy **terms** aren't registry
  kinds → `useTaxonomyTermFavoriteToggle(taxonomyId)` (`hooks/useTaxonomies.ts`).
- **`components/StarredFlyoutSidebarItem.tsx`** — the single sidebar flyout (subsumed the old per-entity
  `Categories/Tags/Groups/Languages/Locations SidebarItem`s). A `SidebarFlyoutConfig` carries the trigger
  + optional fixed `shortcuts` (sub-taxonomy links like Group Types) + `starred` links; with neither it
  degrades to a plain link. Every taxonomy/customization sidebar item + every custom taxonomy
  (`taxonomy:${id}`) now renders through it via `ExpandableLinkSection.renderItem`.
- **`components/useSidebarFlyoutConfigs.tsx`** — builds the `Record<sidebarItemKey, EntityFlyoutData>`
  from the loaded lists (filter `isFavorite` → map to flyout entries linked to `${item.to}/${slug}`).
  Adding an entity's starred list is one entry in `buildSidebarFlyoutData`.
- **`components/HeaderFavoriteButton.tsx`** + **`hooks/useHeaderFavoriteContext.ts`** — the header star,
  resolved generically from the route (`matchEntityRoute` + the entity's list-query cache); any
  favoritable kind lights up with **no** per-entity header wiring (replaced the old 2-branch
  `resolveFavoriteContext`).
- **`lib/entityPaletteRegistry.ts` `starredPaletteField`** — the shared palette field appended to each
  descriptor's `fields`; `EntityCommandGroup` renders it automatically.
- **Listing toggles:** flat rows use `FavoriteToggleButton` (`StandardListingCard`) via `renderExtra`
  (fragment-combine if occupied); tree entities use the `isFavorite`/`onToggleFavorite` slot pair on
  `TaxonomyTreeRow`. Templates: `CategoryPreviewRow.tsx` (flat), `TagTreeList.tsx` (tree).

**Term-level favorites** (Custom Taxonomies + Genres & Moods): one `taxonomy_terms.isFavorite` column,
surfaced through **both** `services/taxonomyTerms.ts` and `services/genreMoods.ts`; the sidebar reads all
starred terms via `GET /api/taxonomy-terms/favorites` (`listFavoriteTaxonomyTerms` →
`useFavoriteTaxonomyTerms()`), grouped by `taxonomyId`. **`isFavorite` is update-only** — never in a
Create input/body/insert (the Autofill/Import-Rules route bodies that alias `createRuleBody.properties`
must spread instead), and the read-interface field is **optional** (the mapper always sets it) to avoid
breaking construction sites.

## Hiding seeded built-in vocabularies

Four seeded vocabularies — **media types** (`services/mediaTypes.ts`), **relationship types**
(`services/relationshipTypes.ts`), **group types** (`services/groupTypes.ts`), and **language usage
levels** (`services/languageUsageLevels.ts`) — each carry a nullable **`hidden`** boolean column
(null = false, coalesced in the `to*` mapper). A hidden value is **excluded from pickers/facets/condition
editors but stays fully resolvable** by existing data and by identity-lookup code. The mechanism is
**hide, never delete built-ins**: built-ins remain non-deletable (so boot re-seeding and identity
couplings can't break), but any built-in can be **hidden** — the one mutation allowed on a built-in
(rename/delete stay blocked, and the `hidden` toggle sits outside the rename/delete guards in each
`updateX`). **Group types were folded into this model**: they gained a `builtIn` column too (the 4
seeds are marked built-in on boot via `ensureDefaultGroupTypes`'s insert + backfill-by-name), which
also **dissolved their resurrect-on-boot bug** — a removed default is now hidden, never deleted, so
nothing is re-seeded over it. No seeder ever writes `hidden` on an existing row, so a user's hide choice
survives every reboot. The `hidden`/`built_in` columns are **lone nullable columns** = push-safe
additive (no `migrate.ts` step) per **Database schema changes**.

- **Filtering lives at the picker, not the hook/endpoint.** `list*` endpoints and the client hooks
  return **every** row (each carrying `hidden`), so the identity lookups keep resolving:
  the media-type slug `"video"` (`services/bookmarkEnrichment.ts`), the `"Book"` media type
  (`useBookmarkIsbn.ts`/`useBookmarkFormHandlers.ts`), the `"About"` relationship type
  (`BookmarkMediaLinkField.tsx`), and the `"primary language"` usage level (`useBookmarkPrimaryLanguage.ts`)
  — **these four, not Franchise/Parent-child, are the real load-bearing built-ins** (franchise hubs and
  the hierarchy view key off the `mediaTypeId` facet and the generic `directional` flag, not a specific
  value's identity). Each **picker/facet/condition editor** filters `!hidden` at its option-list
  construction. Media types funnel through the shared **`mediaTypeNodesToOptions`** (`lib/comboboxOptions.tsx`),
  which **prunes-and-hoists** a hidden node (splices it out, lifts its visible children up) so hiding a
  parent never vanishes a visible child; the other three filter inline at each call site.
- **UI:** each taxonomy listing card gets a hover **Eye/EyeOff** toggle (`HideToggleButton` in
  `StandardListingCard.tsx`) + a "Hidden" badge; media types toggle via the edit form
  (`MediaTypeGeneralForm.tsx`). `group_types` also gained `deletableIds`/`isSelectable` guards
  (`entities/groupType.tsx`) excluding built-ins from bulk delete/selection.
- **Accepted edge case:** a stored default (e.g. a website's default media type) pointing at a
  now-hidden value renders blank in *its* picker — same as today's deleted-value behavior; unhiding
  restores it. Bookmark cards are unaffected (they render the embedded value, not a picker).

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

- **Truly push-safe additive changes** (a **lone** nullable column on an existing table, or a new
  index, with **no new table in the same release**): just edit `src/db/schema.ts`. `push` applies
  them without prompting. No migration file, no `drizzle-kit generate`.
- **Additive changes that trigger a push prompt** — `drizzle-kit push` runs non-interactively in
  production (non-TTY, stdin = `/dev/null`). Certain additive changes still cause an interactive
  confirmation that crashes the deploy (and `--force` does **not** bypass it):
  - **A NEW TABLE** — against a *populated* database push treats a brand-new table as a
    `pgSuggestions` "truncate?" change, **bails at the prompt while exiting 0**, and **silently
    skips the table *and every additive statement it hadn't applied yet in the same run* — including
    plain nullable `ADD COLUMN`s**. The deploy "succeeds" but the table/column never exists and
    queries 500 with `relation … does not exist` / `column … does not exist`. This is the primary
    "missing column/table" 500 cause (bit `genre_moods` #929, `bookmarks.image_display_preference`
    #930, the `podcasts` #927 and `languages`/`language_usage_levels`/`language_usages` tables).
    **Pre-create every new table and pre-add its companion columns** (e.g. a taxonomy's
    `bookmarks.<x>_id` FK) in `migrate.ts` with idempotent `IF NOT EXISTS` DDL mirroring `schema.ts`.
    Keep it **self-contained — declare FK columns as a plain `uuid`, no `REFERENCES` to a
    push-created base table** (migrate runs *before* push); push adds the FK constraint afterward
    (additive, never prompts). See the `genre_moods` / `podcasts` / language pre-create steps.
  - **Unique constraints added to an existing table with data** — push warns the constraint may
    fail and asks to truncate (the `pgSuggestions` prompt). With no TTY it crashes the push run.
  - **`NOT NULL` columns added to an existing table** (even with a column-level `DEFAULT`) — push
    prompts before applying.
  - **A COMPOSITE `unique()` constraint** (multi-column, e.g. `unique("x").on(t.a, t.b)`) can make
    push **re-propose it on every deploy even when it already exists and matches** — the same
    truncate prompt → non-TTY crash, after which push exits 0 and **silently skips the rest of its
    additive diff** (the classic "missing column/table" 500s, since a later new column never gets
    added). **Declare composite uniques as `uniqueIndex()`, never a table `unique()` constraint** —
    a unique index converges cleanly and applies via `CREATE UNIQUE INDEX IF NOT EXISTS` with no
    prompt. Single-column `unique()` (slugs, names, etc.) is fine and stays a `unique()`. This bit
    `tags_parent_name_unique` and then the `language_usage_levels` / `language_usages` composite
    uniques (#914 repeated the mistake). For an existing table, also add a `migrate.ts` step that
    `DROP CONSTRAINT IF EXISTS` the old constraint and `CREATE UNIQUE INDEX IF NOT EXISTS` (see the
    "migrate … composite uniques from constraints to unique indexes" steps). Note it is *not* every
    composite `unique()` that reproduces this (some converge), but `uniqueIndex()` always does —
    prefer it for any composite unique so the trap can't recur.

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
| `HOSTED_METADATA_ENDPOINT` | middleware / gateway | **Optional, default off.** Tier 2 hosted metadata provider — a Microlink-compatible API endpoint (e.g. `https://api.microlink.io/`, or a self-hosted Microlink). When set, hard pages (JS-rendered, bot-protected) are resolved by the hosted service and merged over the direct scrape; when unset the pipeline behaves identically (direct scrape only). Setting it is what sends URLs off-box — privacy-preserving by default. Surfaced on Settings → Connectors. |
| `HOSTED_METADATA_API_KEY` | middleware / gateway | Optional API key for the hosted metadata provider, sent as the `x-api-key` header. |
| `HOSTED_METADATA_PROVIDER` | middleware / gateway | Optional provider label (e.g. `microlink`) shown on the Connectors settings page; does not affect behavior. |
| `YOUTUBE_API_KEY` | middleware / gateway | **Optional, default off.** Tier 2 — when a key resolves, a YouTube video's duration/publish-date/description come from the YouTube Data API v3 (`videos.list`) instead of the brittle `ytInitialPlayerResponse` watch-page scrape, and a YouTube channel's avatar comes from `channels.list`'s thumbnail instead of scraping the channel page's `og:image` (`fetchChannelAvatarUrlViaApi` in `services/youtube.ts`, used by `services/youtubeChannelImages.ts`) — YouTube increasingly 403s non-browser requests to channel pages, so the scrape alone is unreliable; unset falls back to the scrape. Video title/thumbnail/channel-name stay on keyless oEmbed either way. Surfaced on Settings → Connectors with a link to the Google Cloud Console to create a key. Secret — set via env var, or via Settings → Connectors where it's stored encrypted at rest when `APP_SECRET` is set (the `hostedMetadataApiKey`/Kavita pattern; DB value wins over the env var). |
| `INSTAGRAM_API_KEY` | middleware / gateway | **Optional, default off.** Tier 2 — when set (with `INSTAGRAM_API_ENDPOINT`), an Instagram account's avatar/profile data come from a third-party profile API instead of the keyless public-embed scrape; unset (or on failure) falls back to the keyless scrape, so behavior is identical out of the box. Powers pulling a person's image from a connected Instagram account. Surfaced on Settings → Connectors. Keys are secrets → env vars only. |
| `INSTAGRAM_API_ENDPOINT` | middleware / gateway | Optional URL template for the Instagram profile API, with a `{handle}` placeholder (e.g. `https://provider.example/ig/{handle}`); the endpoint must return JSON carrying `profile_pic_url_hd` / `profile_pic_url`. `INSTAGRAM_API_KEY` is sent as a `Bearer` token. Only used when both vars are set. |
| `ARCHIVEBOX_ENDPOINT` | middleware / gateway | **Optional, default off.** Base URL of a self-hosted [ArchiveBox](https://archivebox.io/) instance. **Link-out only** — when set, bookmarks gain UI (detail header, the placeable `archiveLink` card field, an "Archive now" action) that opens the archived snapshot (`<base>/?q=<url>`) or the add view (`<base>/add?url=<url>`) in a new tab. **No token is sent and the middleware makes no calls to ArchiveBox** — the user's browser opens the links against their own instance. The base URL is non-secret and returned on `GET /api/connectors` so the client can build the links. A DB value (Settings → Connectors) overrides this env var. |
| `KAVITA_ENDPOINT` | middleware / gateway | **Optional, default off.** Base URL of a self-hosted [Kavita](https://www.kavitareader.com/) ebook/manga server (e.g. `http://localhost:5000`). With `KAVITA_API_KEY` set, bookmarks can be **linked to a Kavita series** (searchable picker on the bookmark edit General tab, stored as `kavitaSeriesId`/`kavitaLibraryId`/`kavitaSeriesName`), gain a "View on Kavita" link-out (detail header + the placeable `kavitaLink` card field, opening `<base>/library/<lib>/series/<id>`), can **import the series cover** as the bookmark image, and can **import the book's table of contents** into the built-in Page Sections property ("Import from Kavita" on the edit Properties tab; `GET /api/kavita/toc?seriesId=` — EPUB via Kavita's book-chapters API, PDF by downloading the file and parsing its embedded outline server-side with `pdfjs-dist`; replace-review-save, persisted by the tab's Save). Series searches, cover fetches, and ToC reads are proxied by the middleware (`services/kavita.ts`, `services/pdfToc.ts`, `GET /api/kavita/series`) so the key never reaches the browser. The base URL is non-secret and returned on `GET /api/connectors`. A DB value (Settings → Connectors) overrides this env var. |
| `KAVITA_API_KEY` | middleware / gateway | **Optional, default off.** Kavita API key (from Kavita → User Settings → API Key), exchanged server-side for a plugin JWT (`POST /api/Plugin/authenticate`) and never returned by any endpoint. Secret — set via env var, or via Settings → Connectors where it's stored encrypted at rest when `APP_SECRET` is set (the `hostedMetadataApiKey` pattern; DB value wins over the env var). |
| `PLEX_ENDPOINT` | middleware / gateway | **Optional, default off.** Base URL of a self-hosted [Plex](https://www.plex.tv/) media server (e.g. `http://localhost:32400`). With `PLEX_TOKEN` set, bookmarks can be **linked to a Plex item** — movie/show/music (searchable picker on the bookmark edit General tab, stored as `plexRatingKey`/`plexItemType`/`plexItemTitle`), gain a "View on Plex" link-out (detail header + the placeable `plexLink` card field, opening the item on the configured server's web UI), and can **import the item's poster** as the bookmark image. Item searches and poster fetches are proxied by the middleware (`services/plex.ts`, `GET /api/plex/search`) so the token never reaches the browser; the web-UI deep link uses the server's `machineIdentifier`, read once from Plex's `/identity` (non-secret) and returned on `GET /api/connectors`. A DB value (Settings → Connectors) overrides this env var. |
| `PLEX_TOKEN` | middleware / gateway | **Optional, default off.** Plex authentication token (`X-Plex-Token` — see [Finding an authentication token](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)), sent as the `X-Plex-Token` header on server-side requests and never returned by any endpoint. Secret — set via env var, or via Settings → Connectors where it's stored encrypted at rest when `APP_SECRET` is set (the `hostedMetadataApiKey`/Kavita pattern; DB value wins over the env var). |
| `NOMINATIM_ENDPOINT` | middleware / gateway | **Optional, keyless.** Overrides the OpenStreetMap Nominatim base URL used by the Locations geocoder (`services/geocoding.ts`); default `https://nominatim.openstreetmap.org`. Point at a self-hosted Nominatim to keep place lookups on-box. Non-secret, reported on `GET /api/connectors`. |
| `WIKIDATA_ENDPOINT` | middleware / gateway | **Optional, keyless, default on.** Wikidata base URL for the geocoder's **fallback** (`services/wikidataGeocoding.ts`), used only when Nominatim returns no candidates — i.e. traditional / informal / natural regions with no admin boundary (e.g. 中国地方 / Chūgoku region). Supplies coordinates (`P625`), country (`P17`→`P297`), ancestor chain (`P131`), and an area outline (linked `P402`/`P3896`, else composed from `P150` constituents). Default `https://www.wikidata.org`; point at a self-hosted Wikibase mirror to keep lookups on-box. Non-secret, reported on `GET /api/connectors`. |
| `WIKIMEDIA_MAPS_ENDPOINT` | middleware / gateway | **Optional, keyless.** Base URL of the Kartographer geoshape service the Wikidata fallback uses to fetch a region's *linked* area outline (`<base>/geoshape?getgeojson=1&ids=<QID>`); default `https://maps.wikimedia.org`. Only used when an item links an OSM relation/geoshape; otherwise the area is composed from constituents via Nominatim. |

Bookmark images are compressed to a 1200px WebP and stored in object storage (Garage by default),
served via `GET /api/bookmarks/:id/image`. Without the `S3_*` vars the app runs normally but image
upload/auto-capture returns 503. See `README.md` → "Object storage (Garage)" for the one-time setup.

See `packages/middleware/.env.example`.

## Settings page starring

**Every settings sub-page must be favoritable — and registration is now derived, not hand-listed.**
The header star button, the sidebar Settings favorites flyout, and the persisted favorite
(`favorite_settings_pages` table / `FavoriteSettingsPage`) all key off one registry:
`SETTINGS_PAGES` in `packages/client/src/lib/settingsPages.ts` (`{ path, label, icon }`, resolved by
exact pathname via `findSettingsPage()`). A page not in this list silently gets no star button —
`useSettingsFavorite` and `HeaderSettingsFavoriteButton` only render once `findSettingsPage(pathname)`
returns a match (wired through `ctx.settingsPage` in `routes/-appHeaderToolbar.ts` →
`settingsFavoriteAction` in `components/header/toolbarEntityActions.tsx`). The registry **derives**
from the two nav data modules, so favoritability comes for free:
- A **new tab inside a tabbed settings section** (Display/Automations/Locations/Advanced): add it to
  the section's nav array in `lib/settingsNav.ts` with a `lucide-react` `icon` distinct from its
  siblings — the label derives as `"Section: Tab"`. Section index/parent paths are intentionally
  never registered (they redirect to their first tab and can't be the live pathname).
- A **management/customization listing page** (Categories, Tags, Websites, People, Saved Filters, …):
  its sidebar entry in `lib/sidebarNavItems.ts` *is* the registration (`SIDEBAR_LABEL_OVERRIDES` in
  `settingsPages.ts` covers a label that must differ from the sidebar title, e.g. newsletters).
- Only a page on **neither surface** (e.g. `/settings/extension`, `/taxonomies/place-types`) goes in
  the hand-listed `STANDALONE_PAGES` remainder in `settingsPages.ts`.
`settingsPages.test.ts` asserts the derivation (every sidebar item / settings tab resolves) — extend
it only for standalone pages. The CMD+K palette's Pages/Taxonomies/Settings nav groups derive from
the same modules (`CommandPaletteNavGroups.tsx`), so they also pick the page up automatically.

## CMD+K palette sync

**The CMD+K palette must mirror every header toolbar action.** `buildToolbarActions` in
`packages/client/src/components/header/toolbarActions.tsx` is the canonical list of contextual header
actions. When a new action is added there, also add a corresponding `CommandItem` in the palette.
`CommandPalette.tsx` is only the coordinator — the items live in per-group components beside it:
listing display / filter-location / bulk-select items in `ListingPageCommandGroup.tsx`, the
Actions + Pages/Taxonomies/Settings tail in `CommandPaletteNavGroups.tsx`, the bookmark-detail
"Current Page" actions in `BookmarkViewPageCommandGroup.tsx`, the bookmark taxonomy quick-edits in
`commandPaletteSubPalettes.tsx` (`BookmarkTaxonomiesGroup`), and the drilled-in sub-palette modes in
`CommandPaletteTaxonomyModes.tsx` (state hooks in `useCommandPaletteState.ts`). The **"Sync from
source"** action is mirrored by the store-gated `SyncFromSourceCommandItem` (gated on
`uiStore.syncProvider`; see the **Outside-source sync** section) — not a per-entity item. The four
action categories and their palette hooks:

- **Listing display** (view mode, columns) — reads/writes `uiStore` via `useListingPageContext`;
  gate on `listingCtx.listingPage !== null`.
- **Filter location** — reads/writes server `DisplayPreference` via
  `useListingPageContext.setFilterLocation`; gate on `listingCtx.listingPage?.hasFilters`.
- **Bulk select** — reads/writes `uiStore` via `useListingPageContext`; gate on
  `listingCtx.bulkSelectPageKey !== null`.
- **Bookmark entity fields** (category, tags, media type, people, groups, boolean properties, choices
  properties) — uses `useBookmarkTaxonomyContext`; gate on `bookmarkId !== null`. Boolean properties
  toggle directly; the multi-select creator fields (people, groups) enter a sub-palette
  (`PeopleSubPalette` / `GroupsSubPalette`); choices properties enter a sub-palette
  (`"choices-property"` mode). For a new field type, add an item here or navigate to the edit tab.
- **Slug-routed entity quick-actions** ("Current \<Entity\>" group: boolean toggles, choice
  sub-palettes, View/Edit navigation, Pin/Unpin, New sub-tag/sub-type) — **registry-driven**, one
  generic gated hook for every entity (`useEntityCommandContext` + `EntityCommandGroup`), never a
  per-entity `use<Entity>Context` hook. Route matching derives from `ENTITY_ROUTES`
  (`lib/entityRoutes.ts` — the same data the breadcrumb descriptors derive from); the hand-authored
  data layer is one exhaustive entry per kind in `ENTITY_PALETTE_CONFIGS`
  (`lib/entityPaletteRegistry.ts`), so a missing entry fails `tsc`. **Adding CMD+K wiring for a new
  slug-routed entity = adding its registry entry** — see the **`cmd-k-entity-context`** skill for
  the recipe, field rules (toggle vs sub-palette vs navigate-to-edit), and the gating rationale
  (the palette mounts app-wide; queries must stay gated on `open && matched`).

New toolbar action → new `CommandItem` in the "Current Page" group (`ListingPageCommandGroup.tsx`,
or the "Bookmark Taxonomies" group for bookmark-specific fields). New bookmark entity field →
extend `useBookmarkTaxonomyContext` and add an item to the palette's bookmark section. New
slug-routed entity or entity field → a registry entry / `fields` entry per the
`cmd-k-entity-context` skill.
