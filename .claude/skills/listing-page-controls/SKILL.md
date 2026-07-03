---
name: listing-page-controls
description: >-
  Add display controls to an entity listing page in eeSimple Bookmarks: a
  quick-filter search bar, an adjustable column count, accurate filtered/total
  counts, and sidebar item counts. Use when asked to "add a search bar to a
  listing page", "make column count adjustable on X", "show counts on listing
  pages", "fix inaccurate counts", "add display controls to a listing page", or
  "show counts in the sidebar". Covers the patterns used by the Categories,
  Websites, Media Types, YouTube Channels, Groups, Group Types, People, Newsletters, Place Types,
  Relationship Types, and Saved Filters listing pages.
---

# Listing-page display controls

The entity listing pages (Categories, Websites, Media Types, YouTube Channels)
share a small set of display affordances that every new listing page should
have from the start, and that existing pages should gain consistently:

1. **Quick-filter search bar** — client-side, instant, no network round-trip.
2. **Adjustable column count** — remembered per-page in `uiStore`.
3. **Accurate count display** — total entity count in the page header; "Showing
   X of Y" below the search bar when a query is active.
4. **Sidebar item counts** — entity count badge next to each nav link.

Current gap: all four taxonomy pages already have a search bar but none have
adjustable columns, an accurate filtered count, or sidebar badges.

---

## Shared primitives (already exist — reuse them)

| Component / export | File | Notes |
|---|---|---|
| `ListingDisplayControls` | `packages/client/src/components/ListingDisplayControls.tsx` | Rendered by the app-header toolbar for the registered listing page (never inline in the page); register via `useSetListingPage(pageKey, …)` from `hooks/useListingPage.ts`. |
| `COLUMN_CLASS` | `packages/client/src/lib/bookmarkColumns.ts` | Maps column count to responsive Tailwind grid classes. |
| `useBookmarkColumns(pageKey)` | same | Reads chosen column count from `uiStore`. |
| `SidebarMenuBadge` | `packages/client/src/components/ui/sidebar.tsx` | Exported alongside the other sidebar primitives. |
| `useSidebar` | same | `state === "collapsed"` — hide badges in icon mode. |
| `Badge` | `packages/client/src/components/ui/badge` | Already used for the page-header count. |
| `Input` | `packages/client/src/components/ui/input` | Already used for the search field. |
| `useHeaderSearchFilter(items, matches)` | `packages/client/src/hooks/useHeaderSearchFilter.ts` | The global header-search query + per-entity filter hook. Returns `{ rawQuery, hasQuery, filtered }`; the `matches(item, query)` predicate receives the already-trimmed/lowercased query. Reuse instead of re-deriving `q`/`filtered` inline. |
| `ListingStatusMessages` | `packages/client/src/components/ListingStatusMessages.tsx` | The shared "Showing X of Y" / loading / error / empty / no-match block. Reuse instead of re-inlining the five conditionals — that duplication, and the per-page complexity it caused, is exactly what this component removed. |

---

## 1. Quick-filter search bar

### Pattern

These pages bind to the **global header search** (`useRegisterHeaderSearch()` +
the `uiStore` `headerSearchQuery`), so reach for `useHeaderSearchFilter` for the
query/filter wiring and `ListingStatusMessages` for the status row rather than
re-deriving `q`/`filtered` and re-inlining the five status conditionals. (A
self-contained, page-local `Input` is still fine for a one-off page that isn't
wired into the header search.)

```tsx
import { useHeaderSearchFilter } from "../hooks/useHeaderSearchFilter";
import { ListingStatusMessages } from "./ListingStatusMessages";

export function WidgetsListing() {
  const { data: allWidgets, isLoading, error } = useWidgets();
  const widgets = allWidgets ?? [];
  const { rawQuery, hasQuery, filtered } = useHeaderSearchFilter(
    widgets,
    (w, query) => w.name.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-4">
      {/* optional add-form here */}

      <ListingStatusMessages
        isLoading={isLoading}
        error={error}
        totalCount={widgets.length}
        filteredCount={filtered.length}
        rawQuery={rawQuery}
        hasQuery={hasQuery}
        loadingLabel="Loading widgets…"
        entityPlural="widgets"
        emptyMessage={<p className="text-muted-foreground">No widgets yet.</p>}
      />

      {/* list — see step 2 for the grid version */}
      <ul className="space-y-2">
        {filtered.map(w => <li key={w.id}><WidgetListItem widget={w} /></li>)}
      </ul>
    </div>
  );
}
```

**Reference implementations:** `WebsitesListing`, `YouTubeChannelsListing`, and
`CategoriesListingPage` all render their status row through
`ListingStatusMessages` and filter through `useHeaderSearchFilter`.

---

## 2. Adjustable column count

### Register the page; the switcher renders in the app header

The column-count control no longer sits next to the search bar — it lives in the
**app-header toolbar** (`ListingDisplayControls` inside
`components/header/toolbarListingActions.tsx`, collapsing into the
`DisplayOptionsPopover` on small screens). A listing page gets it by
**registering itself** with `useListingPage` (`hooks/useListingPage.ts`), which
sets `uiStore.listingPage`; the page body only *reads* the chosen count:

```tsx
import { useSetListingPage } from "../hooks/useListingPage";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";

// inside the component:
useSetListingPage("widgets-listing"); // stable key — see table below; an options object adds cards/filters/create affordances
const columns = useBookmarkColumns("widgets-listing");

return (
  <div className="space-y-4">
    <Input
      placeholder="Search by name…"
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="max-w-sm"
    />

    {/* …status messages… */}

    <div className={`grid gap-2 ${COLUMN_CLASS[columns]}`}>
      {filtered.map(w => <WidgetListItem key={w.id} widget={w} />)}
    </div>
  </div>
);
```

The `<ul>` / `<li>` wrapper is dropped: each list item becomes a direct grid
child. `RowCard` (used by list items) is already `block`-level so it fills its
grid cell naturally.

### Stable `pageKey` values

Assign one string per listing page and never change it — the key is persisted
in `uiStore`.

| Page | `pageKey` |
|---|---|
| Categories | `"categories-listing"` |
| Websites | `"websites-listing"` |
| Media Types | `"media-types-listing"` |
| YouTube Channels | `"youtube-channels-listing"` |
| Tags | `"tags-listing"` |
| Custom Properties | `"custom-properties-listing"` |
| Property Groups | `"property-groups-listing"` |
| Autofill Rules | `"autofill-rules-listing"` |

---

## 3. Accurate count display

### Page-header badge (total, not filtered)

The route keeps showing the **total** entity count in its header — the Badge
is a quick orientation cue, not a search result counter:

```tsx
// in the route component — unchanged from current pattern
{allWidgets
  ? <Badge variant="secondary">{allWidgets.length}</Badge>
  : null}
```

### "Showing X of Y" label when filtering

Inside the Manager component, show a results line **below** the search bar
when the query is active and the filtered count differs from the total:

```tsx
{q && filtered.length < (allWidgets?.length ?? 0)
  ? (
    <p className="text-sm text-muted-foreground">
      Showing {filtered.length} of {allWidgets!.length}
    </p>
  )
  : null}
```

Place this immediately after the `<Input>`,
before the status messages.

### Bookmark count per entity (list items)

The existing `MediaTypeListItem`, `WebsiteListItem`, `YouTubeChannelListItem`,
and `CategoryPreviewCard` (row variant) already render `entity.bookmarkCount`
as a `<Badge variant="secondary">` when the field is defined. Ensure the API
route for each entity includes `bookmarkCount` in its response — check the
middleware route's `SELECT` / join. New list items should follow the same
conditional-badge pattern:

```tsx
{entity.bookmarkCount !== undefined
  ? <Badge variant="secondary">{entity.bookmarkCount}</Badge>
  : null}
```

---

## 4. Sidebar item counts

`SidebarMenuBadge` renders an absolute-positioned badge at the right edge of a
`SidebarMenuItem`. Hide it when the sidebar is in icon (collapsed) mode.

### In `app-sidebar.tsx`

Fetch entity lists at the top of `AppSidebar` (React Query deduplicates these
with the same calls made on the listing pages — no extra network cost):

```tsx
const { data: allWebsites } = useWebsites();
const { data: allMediaTypes } = useMediaTypes();
const { data: allChannels } = useYouTubeChannels();
// categories is already fetched for the categories collapsible section
```

Add counts to the nav links via the shared `SidebarCountBadge`
(`packages/client/src/components/SidebarCountBadge.tsx` — renders nothing when
the count is null or the sidebar is icon-collapsed). `AppSidebar` renders the
`taxonomyItems` / `customizationItems` arrays through its `ExpandableLinkSection`
(still in `app-sidebar.tsx`), which already places a `SidebarCountBadge` per
item; the static top nav lives in `SidebarPrimaryNav.tsx` and the Categories /
Saved Filters sections in `SidebarCategoriesSection.tsx` /
`SidebarSavedFiltersSection.tsx`. So a new nav item only needs a `count` on its
`LinkSidebarItem` — no badge markup.

### In `app-sidebar.tsx`

Add an optional `count` to the nav item arrays, then render a `SidebarMenuBadge`
inside the existing `SidebarMenuItem` map (hidden in icon/collapsed mode):

```tsx
import { SidebarMenuBadge, useSidebar } from "@/components/ui/sidebar";

const { state } = useSidebar();

const taxonomyItems = [
  { key: "categories", title: "Categories", to: "/categories", icon: Folder, count: categories?.length },
  { key: "websites", title: "Websites", to: "/taxonomies/websites", icon: Globe, count: allWebsites?.length },
  // …Media Types, YouTube Channels, etc.
];

// inside the existing map over the items:
<SidebarMenuItem key={item.key}>
  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
    <Link to={item.to}>
      <item.icon />
      <span>{item.title}</span>
    </Link>
  </SidebarMenuButton>
  {item.count !== undefined && state !== "collapsed"
    ? <SidebarMenuBadge>{item.count}</SidebarMenuBadge>
    : null}
</SidebarMenuItem>
```

---

## Apply to existing pages

Work through these four pages; each needs steps 1–3. Step 4 is a single
cross-cutting change to the sidebar.

| Page | Route index file | Manager component | Missing |
|---|---|---|---|
| Categories | `routes/categories.index.tsx` | (inline in route) | columns, filtered count |
| Websites | `routes/taxonomies.websites.index.tsx` | `WebsiteManager.tsx` | columns, filtered count |
| Media Types | `routes/taxonomies.media-types.index.tsx` | `MediaTypeManager.tsx` | columns, filtered count |
| YouTube Channels | `routes/taxonomies.youtube-channels.index.tsx` | `YouTubeChannelManager.tsx` | columns, filtered count |

Categories is different: its listing lives directly in the route file (not a
reusable Manager), so call `useSetListingPage` and add the filtered-count label there
directly.

---

## Verify

```
pnpm typecheck
pnpm lint:fix          # always from repo root
pnpm test
pnpm dev               # then manually check each listing page
```

Manual checks on each listing page:
- Type a search term — list filters, "Showing X of Y" appears, header Badge
  stays at total.
- Clear the search — "Showing X of Y" disappears.
- Change column count — grid responds, preference survives page navigation.
- Collapse and expand the sidebar — badges appear only when expanded.
- Bookmark counts appear on each list item (verify the API includes the field).
