---
name: add-entity
description: >-
  Scaffold a new slug-routed entity end to end in eeSimple Bookmarks — add a new table / taxonomy /
  content type with detail and edit pages, a service with slug generation, CRUD routes, shared
  types, the client route quartet, a manager component, and right-panel registration. Use when
  asked to "add a new entity/table/taxonomy/content type", "give X detail and edit pages",
  "make X slug-routed", or "register a panel content type". Mirrors how categories, websites,
  custom-properties, autofill, media-types, youtube-channels, tags, and property-groups were each
  built.
  Also the map for maintaining an entity — renaming it, adding fields, or removing it (each step below is a sync point; see the sibling skills it links for field-level changes).
---

# Add a slug-routed entity

Every browsable entity in this repo touches the same surface in the same order. Build them by
copying an existing, complete entity rather than from scratch. **Reference entity:
`media-types`** (or `youtube-channels`) — the most recent, fully-formed examples of the whole
pattern, including the route quartet and panel registration.

Work back-to-front: middleware → types → client. Build order is types → middleware → client, so
keep the shared types compiling first.

## Checklist

### 1. Middleware — schema (`packages/middleware/src/db/schema.ts`)
- Add the table. Include a `slug text` column (and a UNIQUE constraint where slugs must be unique).
- Export the inferred row type (e.g. `export type MediaTypeRow = typeof mediaTypes.$inferSelect`).
- **Gotcha:** if the table will already have rows in production and you add a UNIQUE or NOT NULL
  column, `drizzle-kit push` can't apply it non-interactively. Add an idempotent step to
  `src/db/migrate.ts` first — see CLAUDE.md → "Database schema changes" and the worked examples
  already in `migrate.ts`.

### 2. Middleware — service (`packages/middleware/src/services/<entity>.ts`)
Copy `services/mediaTypes.ts`. It provides the canonical shape:
- `list*`, `get*`, `get*BySlug`, `create*`, `update*`, `delete*`.
- Import slug helpers from `@/utils/slug` — **do not re-implement**:
  `slugify(name)` and `uniqueSlug(name, await takenSlugs())` (pass the id to exclude on update).
- **For `takenSlugs`**, use `takenSlugsOf()` from `@/utils/taxonomySlugs` — **do not copy
  the query inline**. The one-liner form used by every slug-routed service is:
  ```ts
  import { takenSlugsOf } from "@/utils/taxonomySlugs";
  const takenSlugs = (excludeId?: string) =>
    takenSlugsOf(myTable, myTable.slug, myTable.id, excludeId);
  ```
  Copying the inline `select slug … where id != excludeId` block from `mediaTypes.ts` adds to
  the fallow duplication budget (already near its ceiling) and caused a CI failure when a fourth
  service duplicated it.
- A `backfill*Slugs()` / `ensure*()` boot helper for existing rows.
- **If the entity is matchable data** — i.e. it appears in the bookmark cache's `ConditionInput`
  (a bookmark column like `categoryId`/`mediaTypeId`/`youtubeChannelId`, a join table like
  `bookmark_relationships`, tags, or custom-property values) — every write that changes that data
  **must call `invalidateBookmarkCache()`**, *including `delete*`*: a delete that FK-set-nulls or
  reassigns a bookmark column, or cascades join rows away, changes match results just like an
  update does (this was missed on categories/media-types/channels/relationship-types once). Gate it
  on rows-affected, mirroring `services/tags.ts`. Display-only entities (card display rules) skip this.

### 3. Middleware — routes (`packages/middleware/src/routes/<entity>.ts`)
Copy `routes/mediaTypes.ts`; register the plugin in `src/app.ts` alongside the others.

### 4. Middleware — boot step (`packages/middleware/src/index.ts`)
If you added a `backfill*`/`ensure*` helper, call it in the boot block **after** `app.listen()`
(the listen-before-boot ordering is intentional — see CLAUDE.md → Deployment).

If the boot step seeds a **built-in custom property** that is a post-creation detail property
(progress/range/sections/rating), also hide it from the Add Bookmark form: export a `*_SLUG`
constant in `packages/client/src/components/bookmarkFormSchema.ts` and add it to `hiddenSlugs` in
`RevealedCustomFields.tsx` (see CLAUDE.md → "Built-in custom properties and the Add Bookmark form";
`chapters`/`url-sections` were once seeded without this and leaked into the create form).

### 5. Shared types (`packages/types/src/index.ts`)
Add the row + `Create*Input` / `Update*Input` types. **Intra-package imports/re-exports need
explicit `.js` extensions** (ESM) — e.g. `export * from "./conditions.js"`.

### 6. Client — data hook (`packages/client/src/hooks/use<Entity>.ts`)
Copy `hooks/useMediaTypes.ts`: `use<Entities>`, `useCreate*`, `useUpdate*`, `useDelete*`
(TanStack Query, with `onSuccess` invalidation).

**Only add `use<Entity>BySlug`** if the breadcrumb system will actually resolve this entity's
name from a slug. Check `TAXONOMY_DESCRIPTORS` in `packages/client/src/routes/-appHeader.tsx` —
if you're registering the entity there (step below), you'll need the hook. If the entity doesn't
appear in breadcrumbs (e.g. it's only used as a relation or filter facet), skip the slug lookup
hook; an unused export adds dead-code overhead that the fallow audit flags.

### 6a. Wire inline create in existing comboboxes

Any `<Combobox>`, `<MultiCombobox>`, or `<TreeMultiCombobox>` elsewhere in the app that already
picks this entity type must also get a `createOption` pointing to the new `Add<Entity>Modal`. Check
the **`combobox-new-entity-creation`** skill for the full list of which pickers are required vs.
exempt, and the **`inline-create-modal`** skill for building the modal wrapper.

### 7. Client — route quartet (`packages/client/src/routes/`)
File-based routing. Copy the five `taxonomies.media-types.*` files, renaming:
- `<area>.<entity>.tsx` — layout with `<Outlet/>`
- `<area>.<entity>.index.tsx` — searchable listing
- `<area>.<entity>.$<entity>Slug.tsx` — detail layout
- `<area>.<entity>.$<entity>Slug.index.tsx` — detail view
- `<area>.<entity>.$<entity>Slug.edit.tsx` — edit page

`routeTree.gen.ts` is generated — do not hand-edit. Run
`pnpm --filter=@eesimple/client routeTree` (or let the Vite plugin regenerate it on `dev`/`build`).

### 8. Client — manager component (`packages/client/src/components/<Entity>Manager.tsx`)
Copy `MediaTypeManager.tsx`. The **edit** UI is the auto-save **`<Entity>GeneralForm`** you build for
the edit tab (see the `tabbed-pages` / `toast-notifications` skills), and the read-only **view body**
is a small **`<Entity>GeneralView`** (or the inline `<dl>` you lift into the workbench). Both surfaces
render these — do **not** create a panel-only `<Entity>Row` inline editor, a panel-only view card, or
reuse the submit create form for edit (right-panel parity invariant in CLAUDE.md).

### 9. Workbench descriptor + panel registration
- **Workbench descriptor** (`packages/client/src/components/workbench/<entity>.tsx`): copy
  `workbench/mediaType.tsx`. Export an `EntityWorkbench<Entity>` (typed by `workbench/types.ts`):
  `useBySlug`/`useById` loaders, `name`/`isBuiltIn`/`canDelete`, a `useDelete` control, and a `tabs`
  array where each tab has a `view` and/or `edit` `WorkbenchPane` (title + description + a body
  component). This is the **single source** both the main pane and the panel render.
- **Main-pane routes**: each `_view.*` / `edit.*` route body is a one-line `WorkbenchRouteTab`
  (`workbench={<entity>Workbench}` + `tabKey` + `mode` + `slug`) — see `routes/taxonomies.media-types.*`.
- **Panel registration** (`packages/client/src/components/panel/contentTypes.ts`):
  - Add the type string to the `DrawerContentType` union **and** `DRAWER_CONTENT_TYPES` array in
    `packages/client/src/lib/drawerSearch.ts`.
  - Add a `use<Entity>List` adapter and `View`/`Edit` that each render
    `<EntityWorkbenchPanel workbench={<entity>Workbench} id={id} mode="view"|"edit" />` — **never** a
    `<Entity>Row`, a panel-only view card, or the submit create form. Then append an entry to
    `PANEL_CONTENT_TYPES` with `type`, `label`, `singular`, a `lucide-react` `icon`, `useList`,
    `View`, `Edit`. Create flows (the `NEW_SENTINEL` path) keep their submit form.

### 10. Registries that derive from the sidebar entry

Adding the listing page to the sidebar (`lib/sidebarNavItems.ts` — `taxonomyItems` or
`customizationItems`) is also what registers it elsewhere; **don't** hand-register these:
- **Favoritable settings page** (header star + Settings favorites flyout): `SETTINGS_PAGES` in
  `lib/settingsPages.ts` derives from the sidebar items. Only a listing page on **no** sidebar
  (e.g. Place Types) needs a `STANDALONE_PAGES` entry there.
- **CMD+K nav groups**: the palette's Pages/Taxonomies/Settings groups (`CommandPaletteNavGroups.tsx`)
  derive from the same modules.

### 11. Route data + CMD+K quick-actions

Add the entity to `ENTITY_ROUTES` in `lib/entityRoutes.ts` (`kind`, `prefix`, `slugIndex`, labels,
optional breadcrumb `switcher`, `flatCrumbs`) — the breadcrumb `TAXONOMY_DESCRIPTORS` derive from
it — and add its exhaustive-record entry to `ENTITY_PALETTE_CONFIGS` in
`lib/entityPaletteRegistry.ts` (tsc fails until you do). That gives the entity breadcrumbs and the
palette's "Current \<Entity\>" View/Edit quick-actions; add boolean/choice `fields` only where
useful. See the **`cmd-k-entity-context`** skill.

## Verify

```
pnpm --filter=@eesimple/client routeTree   # regenerate route tree (or rely on dev/build)
pnpm typecheck
pnpm test
pnpm lint:fix                              # always from repo root
pnpm exec fallow dupes --format json --quiet   # duplication must stay ≤ 6.25%
```

If the fallow duplication check exceeds the budget, look for a shared utility rather than
copying code — the most common culprit is the `takenSlugs` query (use `takenSlugsOf()`; see
step 2) or the condition multi-select component (use `EntityMultiSelectCondition`; see
`add-condition-type` skill).

Then check manually that the entity:
- has working list / detail / edit pages at its slug routes, and
- appears in the right panel's type tiles and is browsable there — the panel's `View`/`Edit` render
  the **same** tabbed bodies + responsive shell as the main pane via `EntityWorkbenchView` (from the
  `<entity>Workbench` descriptor), not a panel-only editor or view card. Drag the docked drawer narrow
  to confirm the tab nav collapses to the horizontal strip.

## Maintaining an existing entity

The checklist above is the sync-point map; for changes, jump to the sibling skill that owns the
change kind rather than re-running the whole scaffold:

- **Expose or edit a field** → `surface-entity-field`; **new tab** → `tabbed-pages`; **palette
  fields** → `cmd-k-entity-context`; **listing affordances** → `listing-page-controls` /
  `listing-table-view` / `bulk-listing-actions` / `standard-listing-card`.
- **Rename an entity**: label sources are centralized — `crumbLabel()`/`LABEL_OVERRIDES` in the
  breadcrumb helpers, `TAXONOMY_DESCRIPTORS`, `lib/sidebarNavItems.ts`, and `ENTITY_ROUTES` — but
  slugs are persisted; keep route prefixes and `pageKey`s stable even if display names change.
- **Remove an entity**: reverse the checklist. The exhaustive registries
  (`ENTITY_PALETTE_CONFIGS`, workbench descriptors, panel content types) fail `tsc` on leftovers —
  chase compile errors, then drop the table via an idempotent `migrate.ts` step (never a bare
  schema edit; push must stay additive).
