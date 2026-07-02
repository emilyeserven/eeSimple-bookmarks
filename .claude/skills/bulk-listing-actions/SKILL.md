---
name: bulk-listing-actions
description: >-
  Add multi-select + bulk actions (select rows, "Select all N", bulk delete) to an entity listing
  in eeSimple Bookmarks, backed by the shared selection hook, the contextual BulkActionBar, and the
  generic loop-and-report bulk-delete route/service. Use when asked to "add bulk select/delete to a
  listing", "let me select multiple X and delete them", "add a bulk action bar to X", "wire up
  multi-select on a manager", or "add bulk editing to a listing page". Mirrors how the Bookmarks page
  and every taxonomy listing (Categories, Websites, Media Types, YouTube Channels, Tags, Property
  Groups, Relationship Types, Custom Properties, Autofill, Publishers, Authors, Newsletters, Place
  Types, Saved Filters) got bulk select + delete.
  Also covers maintaining bulk actions — "add another bulk action to X's bar", "bulk select is broken on X".
---

# Bulk listing actions

The Bookmarks page and **every** taxonomy listing share one multi-select + bulk-action model. A row
gets a `<Checkbox>`; a contextual `BulkActionBar` appears above the list once ≥1 row is selected,
showing the count, a "Select all N" shortcut, the action controls, and a Clear button. Don't
re-implement selection state or a bespoke action bar — wire the shared pieces below.

## The shared pieces

**Client**
- `lib/useListSelection.ts` — `useListSelection(pageKey, allSelectableIds)` returns a `ListSelection`
  (`selectedIds`, `isSelected`, `toggle`, `selectAll`, `clear`, `count`, `allSelected`). Selection is
  persisted per `pageKey` in `uiStore.selection`. `allIds` is the visible **selectable** set, so
  `selectAll` / `allSelected` exclude non-deletable items (built-ins).
- `components/bulk/BulkActionBar.tsx` — the presentational bar (count + "Select all N" + `children`
  actions + Clear). Renders nothing when `count === 0`.
- `components/bulk/TaxonomyBulkBar.tsx` — drop-in bar for a taxonomy listing: pairs `BulkActionBar`
  with `TaxonomyBulkActions` (a confirm-then-delete control). Props: `selection`, `totalSelectable`,
  `bulkDelete` (the mutation), `noun: [singular, plural]`.
- `components/bulk/BookmarkBulkActions.tsx` — the **richer** action set for the Bookmarks page (set
  category / add tags / delete), used instead of `TaxonomyBulkActions` via a plain `BulkActionBar`.
- `hooks/useBulkDeleteEntity.ts` — `useBulkDeleteEntity(api.bulkDelete, invalidate)`: a generic
  mutation that deletes the ids, runs `invalidate`, and fires **one** summarizing toast via
  `lib/bulkResults.ts` `notifyBulkResult` ("3 deleted, 1 skipped (built-in)"). Per-entity hooks
  (`useBulkDeleteCategories`, …) wrap it so a Manager only imports the hook.

**Middleware**
- `services/bulkDelete.ts` — `bulkDeleteEntities(ids, deleteOne, isBuiltInError?)`: loops the entity's
  existing single-item delete, returning a per-item `BulkDeleteResult[]` (`deleted` / `not-found` /
  `skipped-built-in` / `error`) **without aborting the batch**. It reuses each entity's own
  `deleteX` so cascades and built-in guards are never bypassed.
- `routes/bulkDeleteRoute.ts` — `registerBulkDelete(app, basePath, tag, bulkDeleteX)` mounts
  `POST <basePath>/bulk-delete` with a `{ ids: uuid[] }` body returning `BulkDeleteResult[]`.

## Recipe — add bulk delete to a taxonomy listing

1. **Service** (`services/<entity>.ts`): add
   `export const bulkDelete<Entity> = (ids) => bulkDeleteEntities(ids, deleteOne, isBuiltInError)`,
   reusing the entity's existing `delete<Entity>` and its built-in guard (if any).
2. **Route** (`routes/<entity>.ts`): `registerBulkDelete(app, "/api/<entities>", "<tag>", bulkDelete<Entity>)`.
3. **Client API** (`lib/api/<entity>.ts`): add `bulkDelete(ids): Promise<BulkDeleteResult[]>` posting
   to `/api/<entities>/bulk-delete`.
4. **Client hook** (`hooks/use<Entity>.ts`):
   `export function useBulkDelete<Entity>() { return useBulkDeleteEntity(<entity>Api.bulkDelete, use<Entity>Invalidation()); }`.
5. **Manager** (`components/<Entity>Manager.tsx`):
   - `const deletableIds = items.filter(isDeletable).map(i => i.id);`
   - `const selection = useListSelection("<entity>-listing", deletableIds);`
   - `const bulkDelete = useBulkDelete<Entity>();`
   - render `<TaxonomyBulkBar selection={selection} totalSelectable={deletableIds.length} bulkDelete={bulkDelete} noun={["<entity>", "<entities>"]} />` above the list;
   - add a `<Checkbox checked={selection.isSelected(item.id)} onCheckedChange={() => selection.toggle(item.id)} />` to each row (omit/disable for non-deletable built-ins).

For the **Bookmarks page**, swap step 5's `TaxonomyBulkBar` for a `BulkActionBar` wrapping
`BookmarkBulkActions` (richer set-category / add-tags / delete actions).

## Rules

- **One toast per batch.** The summarizing `notifyBulkResult` toast is the only feedback — don't add
  per-item toasts.
- **Never bypass guards.** Bulk delete loops the entity's own `deleteOne`; built-in/cascade
  protection comes for free. Don't write a bulk SQL `DELETE`.
- **Selectable ⊂ visible.** Pass only deletable ids to `useListSelection` so "Select all" and
  `allSelected` ignore built-ins.
- **Keep selection keyed.** Use a stable `pageKey` per listing; selection survives navigation via
  `uiStore`.

## Maintaining existing bulk actions

- **Add another action to an existing bar**: extend that entity's `*BulkActions` component beside
  the shared `BulkActionBar` — reuse the confirm-dialog + `notifyBulkResult` pattern; every bulk
  endpoint stays loop-and-report (partial success reports counts, never throws midway).
- **Keep `pageKey`s stable**: selection state and the bar's registration key off the listing
  `pageKey`; renaming one orphans persisted listing prefs.
- **"Bulk select is broken on X"**: check the listing still registers via `useRegisterBulkSelect`
  and that row cards pass the selection props — the shared hook and bar rarely regress; the wiring
  does.
