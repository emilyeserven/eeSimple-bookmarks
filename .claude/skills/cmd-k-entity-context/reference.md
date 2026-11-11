# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

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
