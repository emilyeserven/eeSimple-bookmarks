---
name: cmd-k-entity-context
description: Wire a slug-routed entity's detail/edit pages into the CMD+K palette in eeSimple Bookmarks — the registry-driven "Current <Entity>" quick-action group (boolean toggles, choice sub-palettes, View/Edit navigation, Pin, New sub-child). Use when asked to "add CMD+K actions for X", "let the palette toggle X's field", "add a quick-action to the entity palette", "add a per-field knob to CMD+K", or when adding a new slug-routed entity (the add-entity skill points here). Replaces the old one-hook-per-entity useSavedFilterContext pattern.
---

# CMD+K entity context (registry-driven)

When the palette opens on a slug-routed entity's detail/edit page, it shows a **"Current
\<Entity\>"** group: boolean quick-toggles, single-select choice sub-palettes, View/Edit
navigation (plus extra edit tabs), Pin/Unpin for pinnable kinds, and New sub-tag/sub-type for
hierarchy taxonomies. One generic hook drives all entities — **never** write a per-entity
`use<Entity>Context` hook (the old `useSavedFilterContext` was deleted in favor of this; a clone
per entity would fetch every list on every page).

## Architecture — three layers, one entry each

   Both layers below now **derive** from `ENTITY_DESCRIPTORS` (`entities/registry.ts`) — the aggregate
   registry over every entity's `EntityDescriptor`. You add the entity's `route` + `palette` to its
   `entities/<name>.tsx` descriptor and register the descriptor with **one line** in
   `entities/registry.ts`; you don't edit `ENTITY_ROUTES`/`ENTITY_PALETTE_CONFIGS` directly.

1. **Route matching** — `ENTITY_ROUTES` + `matchEntityRoute` in `lib/entityRoutes.ts`, `ENTITY_ROUTES`
   derived as `Object.values(ENTITY_DESCRIPTORS).map(d => d.route)`. Each `route` is
   `{ kind, prefix, slugIndex, listLabel, singular, switcher?, flatCrumbs }`. This is the same data
   the breadcrumb `TAXONOMY_DESCRIPTORS` derive from (`routes/-appHeaderCrumbs.tsx`), so an entity
   registered here gets breadcrumbs *and* palette matching. The palette's `viewPath` / `editPath`
   derive as `<prefix>/<slug>/info` / `<prefix>/<slug>/edit/general` (`useEntityCommandContext.ts`) —
   the View quick-action opens the entity's **Info** page, Edit opens its General edit tab.
2. **Data layer** — `ENTITY_PALETTE_CONFIGS` in `lib/entityPaletteRegistry.ts`, derived from each
   descriptor's `palette`. The `satisfies Record<EntityRouteKind, …>` on `ENTITY_DESCRIPTORS` is
   **exhaustive**, so registering a new kind without its `palette` fails `tsc`. Each `palette` supplies
   only what can't be derived:
   - `queryKey` + `listFn` — **reuse the entity's existing list query key** (e.g. `["categories"]`
     + `categoriesApi.list`) so the palette shares the app cache instead of adding a fetch.
   - `updateFn` — the entity's `*Api.update`, wrapped to cast the patch to its `Update*Input`.
   - `extraInvalidateKeys` — keys beyond the entity's own (usually `["bookmarks"]` when the field
     affects card rendering or matching).
   - `getName` — only when the display name isn't `entity.name` (e.g. websites use `siteName`).
   - `extraEditTabs` — extra `…/edit/<tab>` nav items (autofill: conditions/prefill; card display
     rules: conditions/display; import rules: conditions).
   - `fields` — the quick-action fields (below).
3. **Hook + rendering** — `components/useEntityCommandContext.ts` (mounted once by
   `useCommandPaletteData`, its list query gated on `open && matched`) and
   `components/EntityCommandGroup.tsx` (`EntityCommandGroup` + `EntityChoiceSubPalette`). You
   normally never touch these when adding an entity or field.

## Field rules — toggle vs sub-palette vs navigate

- **Boolean field** (`type: "boolean"`): a direct toggle CommandItem. Provide `key` (the
  `Update*Input` prop), `label` (also the toast wording — saves fire the standard
  `notifyFieldSaved(label)`), `getValue`, and `isEditable` to hide it on guarded rows (e.g.
  relationship types' `directional` is hidden for `builtIn`). Only add a toggle whose PATCH is a
  simple single-field update.
- **Choice field** (`type: "choice"`): a single-select sub-palette with a None option. `options`
  names the flat list (`"categories"` or `"media-types"` — extend `EntityChoiceOptions` +
  `useEntityCommandContext` if a new source is ever needed), `getValue` returns the current id.
  Used for a website's / channel's Category and Default Media Type.
- **Anything needing typed input** (text, number, conditions): don't build palette UI — the
  View/Edit navigation items are the floor, and `extraEditTabs` can deep-link the right tab.

## Adding CMD+K support for a new entity

1. Add the entity's `route` to its `EntityDescriptor` (you're already doing this for breadcrumbs —
   see `add-entity`).
2. Add its `palette` to the same descriptor and register the descriptor with one line in
   `entities/registry.ts` (tsc forces this via the `satisfies Record<EntityRouteKind, …>`). Start
   nav-only (no `fields`); add toggles/choices only where genuinely useful from anywhere.
3. Nothing else — the palette picks it up. Pin/Unpin appears automatically iff the kind is in
   `PINNABLE_KINDS` (`EntityCommandGroup.tsx`), which must mirror `PinnedSidebarEntityType`;
   New sub-tag/sub-type appears for the tag/media-type kinds.

## Gotchas

- **Gating is the whole point.** The hook's queries run only while the palette is `open` **and**
  the pathname matches an entity route. Don't add an ungated `useQuery`/`use<Entity>s()` call
  anywhere in the palette's hook chain — `CommandPalette` mounts app-wide, so an ungated fetch
  runs on every page (this is exactly why the per-entity-hook pattern was retired).
- **Toasts**: `saveField` already fires `notifyFieldSaved` / `notifyFieldSaveError` with the field
  label — don't add your own.
- Bookmarks stay bespoke (`useBookmarkTaxonomyContext`) — they're id-routed and have a much richer
  action set. Don't fold them into the registry.
- **The "Sync from source" palette item is NOT a registry `fields` entry.** It's a single
  store-gated item (`CommandPalette` → `SyncFromSourceCommandItem`, gated on `uiStore.syncProvider`)
  that mirrors the header Sync button for whatever entity registered a provider. Don't add a
  per-entity sync action here — see the **`sync-from-source`** skill.

## Verify

1. `pnpm typecheck` — a missing config entry or a bad field key fails here.
2. Open the entity's detail page → CMD+K: the "Current <Entity>" group lists the fields, View/Edit
   items, and Pin (for pinnable kinds). Toggle a boolean — a field-named toast fires and the page
   reflects the change without reload. Enter a choice field — options list with the current one
   checked; None clears.
3. Open CMD+K on `/` — no entity group, and the network tab shows no entity list fetch.
