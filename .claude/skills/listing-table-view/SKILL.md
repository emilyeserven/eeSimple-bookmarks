---
name: listing-table-view
description: >-
  Add the Table view mode to an entity listing page in eeSimple Bookmarks — a sortable/resizable
  data table that the user can toggle to instead of the Cards/tree view, backed by a per-entity
  column-definition file under `components/tables/`. Use when asked to "add a table view to X",
  "give the X listing a data table", "let me switch X between cards and a table", "add column
  definitions for X", or "wire X into the DataTable". Mirrors how Categories, Websites, Media Types,
  YouTube Channels, Tags, Custom Properties, Property Groups, Autofill rules, Authors, Publishers,
  Relationship Types, Newsletters, and Place Types got their table views.
---

# Listing table view — DataTable + per-entity columns

Every slug-routed/taxonomy listing page can render in two modes, remembered per page in `uiStore`:
a **Cards** (or tree) view and a **Table** view. The Table view is a generic TanStack-Table
renderer (`DataTable`) driven by a per-entity column-definition file. This skill adds that table
view to a listing that doesn't have one yet, or scaffolds the column file for a new entity.

## The moving parts

| Piece | Location | Role |
|---|---|---|
| `DataTable<T>` | `packages/client/src/components/ui/data-table.tsx` | Generic renderer over the shadcn table primitives. Props: `columns`, `data`, `sortable?`, `resizable?`, `columnSizing?`/`onColumnSizingChange?`, `getSubRows?` (tree data), `onRowClick?`, `emptyMessage?`. |
| `use<Entity>Columns()` | `packages/client/src/components/tables/<entity>Columns.tsx` | Returns `ColumnDef<T>[]` via `useMemo`. One per entity. |
| Shared cell components | `packages/client/src/components/tables/cells.tsx` | `ImageCell`, `EditActionCell`, `TreeExpandToggle` (components only — fast-refresh safe). |
| Shared column factories | `packages/client/src/components/tables/columnHelpers.tsx` | `bookmarkCountColumn<T>()`, `categoryPillColumn<T>()` (non-component helpers — keep them out of `cells.tsx`). |
| `useViewMode(pageKey)` | `packages/client/src/lib/bookmarkColumns.ts` | Reads the current `"cards" | "table"` for a page key (default `"cards"`). |
| View toggle UI | `packages/client/src/components/DisplaySettingsControls.tsx` | The Cards/Table `ToggleGroup` that calls `setViewMode(pageKey, …)`. Already rendered by the listing's display controls — no per-entity work needed. |
| Panel click helpers | `packages/client/src/components/panel/useEditPanelClick.ts` | `useEditPanelClick` / `useViewPanelClick` — wire name links and the edit-action cell so a modifier-click opens the right panel. |

## 1. Add the column file

Create `packages/client/src/components/tables/<entity>Columns.tsx` exporting a
`use<Entity>Columns(): ColumnDef<Entity>[]` hook. Reuse the shared pieces rather than re-rendering
their markup:

- **Name column** — link to the entity's view route via `useViewPanelClick`; for tree entities
  prefix the cell with `<TreeExpandToggle row={row} />` and indent with
  `paddingLeft: ${row.depth * 1.25}rem`. Add `<ImageCell>` for entities with a favicon/avatar and a
  `<Badge variant="outline">Built-in</Badge>` for built-ins.
- **Bookmarks column** — `bookmarkCountColumn<Entity>()` from `columnHelpers`.
- **Category column** — `categoryPillColumn<Entity>()` from `columnHelpers` (sources only).
- **Actions column** — `<EditActionCell to=… params=… label=… onClick={e => editClick(e, "<type>", id)} />`.

Mirror the closest existing file: `categoryColumns.tsx` (flat + actions), `mediaTypeColumns.tsx` /
`tagColumns.tsx` (tree), `websiteColumns.tsx` / `youtubeChannelColumns.tsx` (image + category).

## 2. Render it from the listing/manager

In the listing page or `<Entity>Manager`, read the view mode and the columns, and branch:

```tsx
const viewMode = useViewMode("<entity>-listing");
const entityColumns = use<Entity>Columns();
// …
{rows.length > 0 && viewMode === "table"
  ? <DataTable columns={entityColumns} data={rows} getSubRows={node => node.children} />
  : null}
{rows.length > 0 && viewMode !== "table"
  ? <CardsOrTreeView … />
  : null}
```

- Use the **same `pageKey`** the page already passes to `useBookmarkColumns` / the display controls
  (e.g. `"media-types-listing"`, `"categories-listing"`) so the toggle and the render agree.
- Pass the **already-filtered** rows to `data` (the quick-filter search applies before the table).
- Only pass `getSubRows` for tree entities (Tags, Media Types).
- Pass `resizable` + a persisted `columnSizing`/`onColumnSizingChange` only if the page persists
  widths; otherwise omit (local state).

## 3. Verify

- `pnpm --filter=@eesimple/client exec vitest run src/components/ui/data-table.test.tsx`
- `pnpm lint:fix` (from the repo root), `pnpm typecheck`.

## Gotchas

- **Keep non-component column factories out of `cells.tsx`.** `cells.tsx` exports React components,
  so `react-refresh/only-export-components` rejects a non-component export (a `ColumnDef`-returning
  factory) living beside them. Put factories in `columnHelpers.tsx`.
- **Mark interactive cells `data-no-row-click`** (or use `<button>`/`<a>`) so an `onRowClick` on the
  `DataTable` doesn't fire when the user clicks a control inside the row — see `isInteractiveTarget`.
