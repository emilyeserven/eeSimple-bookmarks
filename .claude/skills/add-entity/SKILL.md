---
name: add-entity
description: >-
  Scaffold a new slug-routed entity end to end in eeSimple Bookmarks — add a new table / taxonomy /
  content type with detail and edit pages, a service with slug generation, CRUD routes, shared
  types, the client route quartet, and a manager component. Use when
  asked to "add a new entity/table/taxonomy/content type", "give X detail and edit pages",
  or "make X slug-routed". Mirrors how categories, websites,
  custom-properties, autofill, media-types, youtube-channels, tags, property-groups, and genres-moods
  (the cross-taxonomy polymorphic-assignment case) were each built.
  Also the map for maintaining an entity — renaming it, adding fields, or removing it (each step below is a sync point; see the sibling skills it links for field-level changes).
---

# Add a slug-routed entity

Every browsable entity in this repo touches the same surface in the same order. Build them by
copying an existing, complete entity rather than from scratch. **Reference entity:
`media-types`** (or `youtube-channels`) — the most recent, fully-formed examples of the whole
pattern, including the route quartet.

Work back-to-front: middleware → types → client. Build order is types → middleware → client, so
keep the shared types compiling first.

## Checklist

### 1. Middleware — schema (`packages/middleware/src/db/schema.ts`)
- Add the table. Include a `slug text` column (and a UNIQUE constraint where slugs must be unique).
- Export the inferred row type (e.g. `export type MediaTypeRow = typeof mediaTypes.$inferSelect`).
- **Pre-create the table (and its `bookmarks.<x>_id` FK column) in `migrate.ts` — required, not
  optional.** A new table is silently **skipped** by `drizzle-kit push` in the non-TTY deploy (it
  reads as a "truncate?" prompt, push bails exiting 0), so the table never gets created and every query
  500s with `relation … does not exist` — the exact bug that hit `genre_moods` (#929) and `podcasts`.
  Add idempotent `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS
  "<x>_id" uuid` steps, **self-contained (no FK to a push-created table** — declare FK columns as plain
  `uuid` and let push add the constraint). Mirror the `genre_moods` / `bookmarks.podcast_id` steps at
  the end of `migrate.ts`. Same rule for a UNIQUE/NOT NULL column on an already-populated table. See
  the **`db-schema-change`** skill's silent-skip caveat, and verify against a real Postgres.

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
  - **Seeded built-ins that support hiding** (media types, relationship types, group types, language
    usage levels — see CLAUDE.md → **Hiding seeded built-in vocabularies**) carry a nullable `hidden`
    flag. The `ensure*` seeder **must respect a stored `hidden` flag — no resurrect-on-boot**: insert
    missing rows with `onConflictDoNothing` (or a presence check) and **never write `hidden` on an
    existing row**, so a user's hide choice survives every reboot. Because built-ins are hidden, never
    deleted, a removed built-in is never re-seeded over. (Group types learned this the hard way — their
    old name-keyed seeder resurrected deleted defaults on every boot until they were folded into the
    built-in-and-hideable model.)
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
(progress/range/sections/rating), also hide it from the Add Bookmark form: add its slug to
`BOOKMARK_FORM_DETAIL_SLUGS` in `packages/types/src/bookmarkAddForm.ts` — that single edit seeds it
**hidden** by default and adds a configurable row under Settings → Display → Bookmark Add Form (see
CLAUDE.md → "Add Bookmark form field placement" and the `bookmark-add-form` skill; `chapters`/
`url-sections` were once seeded without this and leaked into the create form).

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

### 7. Client — route files (`packages/client/src/routes/`)
File-based routing. The shape depends on whether the entity is a **listing entity** (its bare
`$slug` renders a `BookmarkSearchView` of that term's bookmarks) or an **info-only entity** (no
bookmarks listing).

**Listing entity** — copy the `taxonomies.media-types.*` files, renaming:
- `<area>.<entity>.tsx` — layout with `<Outlet/>`
- `<area>.<entity>.index.tsx` — searchable listing
- `<area>.<entity>.$<entity>Slug.tsx` — entity layout with `<Outlet/>`
- `<area>.<entity>.$<entity>Slug._hub.tsx` — the `ListingHubLayout` shell (header + the
  `Bookmarks | Gallery | Media | Info` strip)
- `<area>.<entity>.$<entity>Slug._hub.{index,gallery,media}.tsx` — the three listing panes, each
  rendering the shared `routes/-<entity>Listing.tsx` body with an `activeView` prop
- `<area>.<entity>.$<entity>Slug._hub.info.tsx` — the Info page (`EntityInfoView`)
- `<area>.<entity>.$<entity>Slug.edit.tsx` (+ `edit.index.tsx` redirect + `edit.<tab>.tsx`) — the edit
  pages, **outside** `_hub`

**Info-only entity** — copy the `autofill.*` files, renaming:
- `<area>.<entity>.tsx` / `<area>.<entity>.index.tsx` — layout + listing
- `<area>.<entity>.$<entity>Slug.tsx` — entity layout with `<Outlet/>`
- `<area>.<entity>.$<entity>Slug.index.tsx` — a `beforeLoad` **redirect** to `…/info`
- `<area>.<entity>.$<entity>Slug.info.tsx` — the Info page (`EntityInfoView` with a `header` prop)
- `<area>.<entity>.$<entity>Slug.edit.tsx` (+ `edit.index.tsx` redirect + `edit.<tab>.tsx`) — edit

There is **no** `_view.tsx` / `_view.<tab>.tsx` subtree — the read-only view tabs are derived from the
workbench descriptor by `EntityInfoView` (vertical rail, `?tab=` search param). See the
**`tabbed-pages`** skill for the full View/Edit route story.

`routeTree.gen.ts` is generated — do not hand-edit. Run
`pnpm --filter=@eesimple/client routeTree` (or let the Vite plugin regenerate it on `dev`/`build`).

### 8. Client — manager component (`packages/client/src/components/<Entity>Manager.tsx`)
Copy `MediaTypeManager.tsx`. The **edit** UI is the auto-save **`<Entity>GeneralForm`** you build for
the edit tab (see the `tabbed-pages` / `toast-notifications` skills), and the read-only **view body**
is a small **`<Entity>GeneralView`** (or the inline `<dl>` you lift into the workbench). These render
via the workbench descriptor — do **not** reuse the submit create form for edit.

### 9. Workbench descriptor
- **Workbench descriptor** (`packages/client/src/components/workbench/<entity>.tsx`): copy
  `workbench/mediaType.tsx`. Export an `EntityWorkbench<Entity>` (typed by `workbench/types.ts`):
  `useBySlug` loader, `name`/`isBuiltIn`/`canDelete`, a `useDelete` control, and a `tabs`
  array where each tab has a `view` and/or `edit` `WorkbenchPane` (title + description + a body
  component). This is the **single source** the main-app pages render.
- **Main-pane surfaces**: the **Info** page (`…$slug.info.tsx` / `…$slug._hub.info.tsx`) renders
  `<EntityInfoView workbench={<entity>Workbench} …>` — the vertical rail derives its view tabs from the
  descriptor, so there's no route file per view tab. Each **edit** tab route (`edit.<tab>.tsx`) is a
  one-line `WorkbenchRouteTab` (`workbench={<entity>Workbench}` + `tabKey` + `mode="edit"` + `slug`) —
  see `routes/taxonomies.media-types.*`.

### 10. Registries that derive from the sidebar entry

Adding the listing page to the sidebar (`lib/sidebarNavItems.ts` — `taxonomyItems` or
`customizationItems`) is also what registers it elsewhere; **don't** hand-register these:
- **Favoritable settings page** (header star + Settings favorites flyout): `SETTINGS_PAGES` in
  `lib/settingsPages.ts` derives from the sidebar items. Only a listing page on **no** sidebar
  (e.g. Place Types) needs a `STANDALONE_PAGES` entry there.
- **CMD+K nav groups**: the palette's Pages/Taxonomies/Settings groups (`CommandPaletteNavGroups.tsx`)
  derive from the same modules.

### 11. Route data + CMD+K quick-actions

Build the entity's `EntityDescriptor` (`entities/<name>.tsx`) — its `route` (`kind`, `prefix`,
`slugIndex`, labels, optional breadcrumb `switcher`, `flatCrumbs`) and its `palette`
(`EntityPaletteConfig`) — then add **one line** to `ENTITY_DESCRIPTORS` in `entities/registry.ts`.
Both `ENTITY_ROUTES` (`lib/entityRoutes.ts`, which the breadcrumb `TAXONOMY_DESCRIPTORS` derive from)
and `ENTITY_PALETTE_CONFIGS` (`lib/entityPaletteRegistry.ts`) now **derive** from that registry — the
`satisfies Record<EntityRouteKind, …>` on `ENTITY_DESCRIPTORS` fails `tsc` until you add the line.
That gives the entity breadcrumbs and the palette's "Current \<Entity\>" View/Edit quick-actions; add
boolean/choice `fields` only where useful. See the **`cmd-k-entity-context`** skill.

## Bookmark-linked entity (optional)

Skip this section unless bookmarks reference the entity **directly** via a top-level FK column
(like `mediaTypeId`, `groupId`, and `languageId` — as opposed to a many-to-many join table like
tags or authors). This wiring is separate from the checklist above and easy to under-scope: it
touches the bookmark's own record, not just the entity's pages. Worked examples: media type
(existing) and language (`services/languages.ts` + `bookmarkHydration.ts`, added for issue-free
autofetch support).

1. **Schema** (`packages/middleware/src/db/schema.ts`): add `bookmarks.<x>Id`, nullable,
   `onDelete: "set null"` — mirror `mediaTypeId`.
2. **Hydration** (`packages/middleware/src/services/bookmarkHydration.ts`): add the field to the
   `BookmarkExtras` interface, `EMPTY_EXTRAS`, and `toBookmark()`; add a `<x>ById()` batch loader
   (mirror `mediaTypesById`/`languagesById`); wire it into `extrasByBookmarkId`'s per-row default
   *and* `hydrateBookmarkRows`'s id-collection → `Promise.all` → per-row map. Four separate spots —
   missing one either breaks the build (TS) or silently hydrates `null` forever.
3. **Shared types** (`packages/types/src/index.ts`): a lightweight `Bookmark<X> = Pick<X, …>` wire
   shape, `Bookmark.<x>: Bookmark<X> | null`, and `CreateBookmarkInput.<x>Id?: string | null` (covers
   `UpdateBookmarkInput` too — it's `Partial<CreateBookmarkInput>`).
4. **Bookmarks service** (`packages/middleware/src/services/bookmarks.ts`): thread `<x>Id` through
   `createBookmark`'s insert values *and* both `Pick<BookmarkRow, …>` patch types used by the update
   path (`scalarBookmarkPatch`'s `ScalarBookmarkPatch` type, and the inline `Pick<>` in the
   transaction body) — two separate lists, easy to update only one.
5. **Bookmarks route schema** (`packages/middleware/src/routes/bookmarks.ts`): add the property to
   `createBookmarkBody.properties` (JSON Schema, `type: ["string", "null"], format: "uuid"`) —
   `updateBookmarkBody` reuses `createBookmarkBody.properties` by reference, so this one edit covers
   both create and update; skipping it makes Fastify's `additionalProperties: false` schema silently
   drop the field from incoming requests.
6. **Add Bookmark form**, only if the field should be user-pickable at creation (skip if it's
   purely autofetched/edited later): add `bookmarkSchema`, `SAMPLE_DEFAULT_VALUES`, and
   `buildBookmarkDefaultValues` entries in `bookmarkFormSchema.ts`, and a `BookmarkAdvanced<X>Field.tsx`
   (mirror `BookmarkAdvancedGroupField.tsx`). Then make it a **placeable standard field** (the form no
   longer hardcodes fields into `BookmarkAdvancedSection.tsx`): add its key to
   `BOOKMARK_ADD_FORM_STANDARD_FIELDS` in `packages/types/src/bookmarkAddForm.ts` (+ its placement in
   `DEFAULT_STANDARD_FIELD_PLACEMENTS` → `DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.standardFieldPlacements`;
   default a brand-new relation to `"hidden"`), a `BOOKMARK_ADD_FORM_STANDARD_LABELS` entry in
   `useBookmarkAddFormSettingsPage.ts`, a distinct `STANDARD_FIELD_ICONS` entry in
   `DisplayBookmarkAddSettings.tsx`, and a render entry in the exhaustive `FIELD_RENDERERS` dispatch in
   `bookmarkAddFormFields.tsx` (all three `Record<…>` maps **fail `tsc`** on a missing entry); the zone
   is rendered by `BookmarkRevealedFields.tsx`. Thread the entity's list through `useBookmarkFormData.ts`
   → `useBookmarkFormController.ts`, and the `<x>Id` value through `useBookmarkFormHandlers.ts`'s
   `submitForm` and `useBookmarkGeneralForm.ts`'s `onSubmit` payloads. (See the `bookmark-add-form` skill.)
7. **Test factory**: add the field's default to `makeBookmark` in
   `packages/client/src/test-utils/factories.ts` (see CLAUDE.md → "Shared test factories") and add a
   `make<X>` factory for the entity itself if tests/stories will construct one.
8. **Gotcha — `BookmarkForm.test.tsx`**: it `vi.mock()`s every hook module the form touches. A new
   `use<Entity>` hook needs its own `vi.mock("../hooks/use<Entity>s", () => ({ use<Entities>: () =>
   ({ data: [] }), useCreate<Entity>: () => ({ mutateAsync: vi.fn() }) }))` entry or every test in
   that file fails at render with `Error: No QueryClient set, use QueryClientProvider to set one`
   (the real hook runs instead of the mock and hits `useQueryClient()` with no provider mounted).

If the entity is *also* something users detect from a scanned page/ISBN/YouTube video (not just
manually picked), see the **`add-connector`** skill's "detected field → taxonomy match-or-create"
case.

## Cross-taxonomy "applies to bookmarks AND other taxonomies" entity (optional)

Reach for this **instead** of the bookmark-linked wiring above when a new taxonomy must attach to
**both** bookmarks and **other taxonomy entities** (not a single-FK on the bookmark row, and not a
per-owner junction table). The worked example is **Genres & Moods** (`genre_moods` +
`genre_mood_assignments`). Use **one polymorphic assignment table**, mirroring `taxonomy_images`:

1. **Schema**: the value table (tree taxonomy), plus `<x>_assignments (<x>Id → <x> CASCADE,
   ownerType text, ownerId uuid)` with a composite PK + `(ownerType, ownerId)` index. `ownerId` has
   **no FK** — deletes are cleaned up in the service layer, not by cascade.
2. **Shared types**: an `<X>_OWNER_TYPES` `as const` tuple (`"bookmark" | <taxonomies> | itself`) —
   the **single edit point** for the target set — and `Bookmark.<x>s: Bookmark<X>[]`.
3. **Service**: CRUD/tree service (counts come from the assignment table where `ownerType='bookmark'`,
   not a bookmark column) + an assignment service (`getOwner<X>s` / `setOwner<X>s` replace-in-place /
   `delete<X>AssignmentsForOwner`). `invalidateBookmarkCache()` on bookmark-owner writes.
4. **Bookmark side**: hydrate via a batched join on `ownerType='bookmark'` (a `<x>sByBookmarkId`
   loader in `bookmarkHydration.ts`, added to `BookmarkExtras`/`EMPTY_EXTRAS`/`toBookmark`/the
   `Promise.all`), a `link<X>s` in `bookmarkWrites.ts` wired into create + delete-then-reinsert on
   update, a `<x>Ids` field on `CreateBookmarkInput` + the bookmarks route schema + the form, and a
   `cleanup<X>Assignments` call in **every** bookmark-delete path (single/bulk/orphan).
5. **Owner cleanup**: call `delete<X>AssignmentsForOwner` from each owner taxonomy's `delete*` service.
6. **Cross-taxonomy UI**: one reusable `<X>AssignmentSection` (`ownerType`/`ownerId` props,
   auto-saving multi-select with inline create) dropped into **every** owner's edit General form.

See CLAUDE.md → "Genres & Moods & the polymorphic assignment layer" for the full map.

## Outside-source sync (optional)

If the entity **pulls fields from an outside source** — a linked source image (avatar/favicon/poster),
a geocode, a URL scan — give it the header-strip **"Sync from source"** button + review modal by
registering a `SyncProvider` from its **edit** form (`useRegisterSyncProvider`). No header edit is
needed (the button appears automatically once a provider registers) and no per-entity CMD+K item (the
store-gated palette item already mirrors it). A single source image reuses the generic
`useImageTaxonomySyncRegistration` + an `…/image/source-preview` endpoint. See the
**`sync-from-source`** skill for the fetch-hook + pure-diff-builder + registration recipe.

## Verify

```
pnpm --filter=@eesimple/client routeTree   # regenerate route tree (or rely on dev/build)
pnpm typecheck
pnpm test
pnpm lint:fix                              # always from repo root
pnpm exec fallow dupes --format json --quiet   # duplication must stay ≤ 6.25%
pnpm exec fallow dead-code --regression-baseline .fallow/dead-code-baseline.json \
  --fail-on-regression --tolerance 0            # must not regress (see the baseline note below)
```

If the fallow duplication check exceeds the budget, look for a shared utility rather than
copying code — the most common culprit is the `takenSlugs` query (use `takenSlugsOf()`; see
step 2) or the condition multi-select component (use `EntityMultiSelectCondition`; see
`add-condition-type` skill).

**A new entity trips the dead-code regression gate — regenerate the baseline.** The `fallow-audit`
CI job runs `fallow dead-code` against `.fallow/dead-code-baseline.json` with **tolerance 0**, so
*any* increase in unused exports fails the PR. A scaffolded entity's `entities/<name>.tsx`
`<entity>Descriptor` aggregate is an **unused export by convention** — the registries import the
individual pieces (`<ENTITY>_ROUTE`, `<ENTITY>_PALETTE`, `<entity>ListingConfig`, `<entity>Workbench`)
directly, never the bundle — so every sibling descriptor already sits in the baseline. Adding one
increments the count by 1. **First delete any *genuinely* removable unused exports** (a convenience
service fn no route calls, a query hook nothing consumes — `fallow dead-code --format json` lists
them by file), then **regenerate the baseline for the descriptor** that legitimately remains:
`pnpm exec fallow dead-code --save-regression-baseline .fallow/dead-code-baseline.json`, and commit
the updated JSON. This is what the Genres & Moods entity (#916) did. Don't blanket-baseline to dodge
real dead code — only the `<entity>Descriptor` is the accepted-unused case.

Then check manually that the entity:
- has working list / detail / edit pages at its slug routes — the Info page and edit tabs render
  from the `<entity>Workbench` descriptor via `EntityInfoView` / `WorkbenchRouteTab`. Narrow the
  window to confirm the edit tab nav collapses to the horizontal scrolling strip.

## Maintaining an existing entity

The checklist above is the sync-point map; for changes, jump to the sibling skill that owns the
change kind rather than re-running the whole scaffold:

- **Expose or edit a field** → `surface-entity-field`; **new tab** → `tabbed-pages`; **palette
  fields** → `cmd-k-entity-context`; **listing affordances** → `listing-page-controls` /
  `listing-table-view` / `bulk-listing-actions` / `standard-listing-card`.
- **Rename an entity (label-only, the default):** label sources are centralized —
  `crumbLabel()`/`LABEL_OVERRIDES` in the breadcrumb helpers, `TAXONOMY_DESCRIPTORS`,
  `lib/sidebarNavItems.ts`, and `ENTITY_ROUTES` — but slugs are persisted; keep route prefixes and
  `pageKey`s stable even if display names change. This is the low-risk path (no migration, no broken
  deep-links) — prefer it unless a full rename is explicitly requested.
- **Rename an entity (full: routes + API + identifiers + DB).** A much larger, migration-bearing change
  that alters bookmarkable URLs — do it only when explicitly asked. The Authors→People rename (PR #907)
  is the worked reference. Recipe:
  1. **Scripted content rename with metadata-protecting lookaheads.** Run one ordered `perl -i -pe`
     over `packages/*/src/**/*.{ts,tsx}` (plural→singular, PascalCase→PascalCase, all-caps→all-caps):
     `s/Olds/News/g; s/Old(?![a-z]|Name|Url)/New/g; s/OLD/NEW/g; s/olds/news/g;
     s/old(?!Name|Url|_name|[a-z])/new/g;`. The `(?!…)` lookaheads are what make a blanket rename safe —
     they protect **metadata fields** that share the stem (`authorName(s)`/`authorUrl`/`author_name`,
     `extractAuthorNames`) and **English words** (`authored`/`Authorization`/`authority`) from being
     renamed. **Exclude** files where the bare plural stem is *metadata, not the entity* (here
     `services/isbn.ts`, `hostedMetadata.ts`, their tests) and `routeTree.gen.ts` + `migrate.ts`; revert
     any remaining metadata-field spots by hand (the ISBN result's `authors: string[]`).
  2. **`git mv`** every entity-named file to its new name by applying the *same* rules to the path — the
     scripted rename already rewrote the import-path strings, so the filenames must match.
  3. **DB rename in `migrate.ts`, not a bare `schema.ts` edit.** Append idempotent `ALTER … RENAME`
     steps (one `DO $$…$$` block per `db.execute`, guarded by `to_regclass` / `information_schema.columns`
     / `pg_constraint`) for every table, `*_id` column, and named constraint — the `newsletter_* → imports`
     block is the template. Then update `schema.ts`'s `pgTable("…")`/`uuid("…")` **string names** to match,
     so push's diff against the renamed schema is empty. FK constraint names auto-reconcile — don't rename
     them. See CLAUDE.md → "Database schema changes".
  4. **Regenerate** `routeTree.gen.ts`, rebuild types, then **chase `tsc`** — the exhaustive registries
     surface any missed spot. Keep bookmark-*metadata* field names (`authorNames`, oEmbed `authorName`,
     ISBN `authors[]`) unchanged: only the taxonomy is renamed.
- **Remove an entity**: reverse the checklist. The exhaustive registries
  (`ENTITY_PALETTE_CONFIGS`, workbench descriptors) fail `tsc` on leftovers —
  chase compile errors, then drop the table via an idempotent `migrate.ts` step (never a bare
  schema edit; push must stay additive).
