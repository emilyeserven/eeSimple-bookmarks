---
name: standard-listing-card
description: >-
  Standardize an entity listing page's row/card onto the shared StandardListingCard look +
  interaction model in eeSimple Bookmarks: image far-left, vertically centered, a card-body link to
  the term's own page (its own bookmarks page or, for non-listable entities, its detail page), hover
  Edit (pencil) + Info buttons, an always-visible bookmark-count badge, and zero-count de-emphasis.
  Use when asked to "standardize a listing card", "make X's listing match the others", "add the
  standard hover Edit/Info buttons to a listing", "make a listing card link to the term's own page",
  "add a count badge / de-emphasize empty items on a listing", or when adding a new listing page that
  should adopt the standard. Mirrors Categories, Websites, YouTube Channels, Media Types, Tags,
  Property Groups, Relationship Types, Publishers, People, Autofill, and Saved Filters.
---

# Standard listing card

Every entity listing page (Categories, Tags, Websites, Media Types, YouTube Channels, Property
Groups, Relationship Types, Autofill) renders its rows with the **same** card look + interaction
model. New listing pages adopt it from the start; existing ones must not drift back to bespoke rows.

## The standard (6 invariants)

1. **Image/icon always far left**, then an info column (Name + optional subtitle).
2. **Vertically centered** — the icon and the hover controls sit at the row's vertical middle even
   on tall/wrapping cards (`flex items-center`, **not** absolute positioning).
3. **Card-body click → the term's own page** — **never** the global `/bookmarks?…=id` filter list.
   Two cases, decided by whether the entity has its own per-term bookmarks page:
   - **Listable entities** (Categories, Tags, Websites, YouTube Channels, Media Types) link the body
     to their **own `$slug` index route** — `/categories/$slug`, `/tags/$slug`,
     `/taxonomies/websites/$slug`, etc. — which renders that term's bookmarks under a term-specific
     header. A **plain `<Link>`** (no `viewClick`): there's no panel content type for a bookmark list.
   - **Non-listable entities** (Property Groups, Relationship Types, Publishers, People, Autofill,
     Custom Properties) have no per-term bookmarks page, so the body links to the entity's **General
     detail tab** (`<Link to="/<entity>/$slug/general">`) and **is** panel-aware (`viewClick`).
   Don't reintroduce a `<Link to="/bookmarks" search={withX(...)}>` body link — `withX` now backs only
   the filter sidebar facets, not listing cards.
4. **Hover reveals Edit (pencil) + Info buttons** on every item. Edit → the entity's edit page,
   Info → its **General view tab** (`<Link to="/<entity>/$slug/general">`). Both are panel-aware
   (modifier-click opens the right panel). **The Info link must point at `…/$slug/general`, never the
   bare index `…/$slug`** — for Tags, Websites, YouTube Channels, and Media Types the bare index route
   renders a *bookmarks* `BookmarkSearchView` (the listable body destination), not the detail page; and
   even where the index `redirect`s to `/general` (Property Groups, Relationship Types, Publishers,
   People) you should link directly to `/general`.
5. **Always-visible count badge** = bookmarks where the item is applied.
6. **Zero-count items are de-emphasized** (`opacity-60`) but stay clickable.

## Shared primitives (reuse — don't re-implement)

| Export | File | Role |
|---|---|---|
| `StandardListingCard` | `components/StandardListingCard.tsx` | The card shell. Props below. |
| `HoverIconButton` | same | Ghost icon button with the hover-opacity classes; wrap a typed `<Link>`. |
| `withCategories` / `withTags` / `withWebsites` / `withMediaTypes` / `withYouTubeChannels` / `withRelationshipTypes` | `lib/bookmarkSearch.ts` | Build a `/bookmarks` filter — used by the **filter sidebar facets** (`FilterSidebarSections.tsx`), **not** listing-card body links anymore. |
| `useEditPanelClick` / `useViewPanelClick` | `components/panel/useEditPanelClick.ts` | Panel-aware `onClick={e => editClick(e, ct, id)}` for the hover Edit/Info links. |
| `useUiStore(s => s.sidebarOpenModifier)` + `SIDEBAR_MODIFIER_LABELS` | `stores/uiStore`, `lib/sidebarModifier` | The "(hold ⌥ to open in the sidebar)" title hint. |
| `CategoryIcon` | `lib/icons.tsx` | Lucide icon by stored name; falls back to a Tag glyph when null. |
| `useEntityImage` | `hooks/useEntityImage.ts` | Favicon/avatar `<img>` with fallback (websites, channels). |
| `Pencil`, `Info`, plus a per-entity glyph (`Layers`, `Link2`, `Wand2`) | `lucide-react` | Hover-button + fixed icons. |

## The component

```ts
interface StandardListingCardProps {
  icon?: ReactNode;            // far-left icon/image (caller builds the wrapper span + fallback)
  title: string;
  subtitle?: string;
  titleAdornment?: ReactNode;  // inline next to the title, e.g. a "Built-in" Badge
  count?: number;              // always-visible badge; 0 => de-emphasized; undefined => no badge, not muted
  renderPrimaryLink: (className: string, children: ReactNode) => ReactNode; // PLAIN body nav
  renderEdit: () => ReactNode;     // panel-aware hover pencil (HoverIconButton + Link + editClick)
  renderInfo?: () => ReactNode;    // panel-aware hover Info; OMIT => no Info button (Autofill)
  footer?: ReactNode;          // optional row below (e.g. a CategoryPill)
}
```

Two body click models (by entity, per invariant 3): a **listable** entity's body is a plain `<Link
to="/<entity>/$slug">` to its own bookmarks page (no `viewClick`); a **non-listable** entity's body
is a panel-aware `<Link to="/<entity>/$slug/general">` with `onClick={e => viewClick(e, ct, id,
slug)}`. The **Edit/Info** hover links are always `HoverIconButton`-wrapped typed `<Link>`s with
`onClick={e => editClick(e, ct, id)}` / `viewClick`. The body builds the icon + title via the
`renderPrimaryLink` children; the cluster (`renderEdit()`, `renderInfo?.()`, count badge) is a sibling
`items-center` group, so it stays vertically centered. `count === 0` toggles `opacity-60` on the whole
card.

## Per-entity recipe

```tsx
<StandardListingCard
  icon={<CategoryIcon name={category.icon} className="size-5 shrink-0" />}
  title={category.name}
  titleAdornment={category.builtIn ? <Badge variant="secondary">Built-in</Badge> : undefined}
  subtitle={category.description ?? undefined}
  count={category.bookmarkCount ?? 0}
  renderPrimaryLink={(className, children) => (
    // Listable entity → plain link to its OWN bookmarks page (not /bookmarks?…). No viewClick.
    <Link to="/categories/$categorySlug" params={{ categorySlug: category.slug }}
      title={`View ${category.name}`} className={className}>
      {children}
    </Link>
  )}
  renderEdit={() => (
    <HoverIconButton>
      <Link to="/categories/$categorySlug/edit/general" params={{ categorySlug: category.slug }}
        title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
        onClick={e => editClick(e, "category", category.id)}>
        <Pencil className="size-4" /><span className="sr-only">Edit {category.name}</span>
      </Link>
    </HoverIconButton>
  )}
  renderInfo={() => (
    <HoverIconButton>
      <Link to="/categories/$categorySlug/general" params={{ categorySlug: category.slug }}
        title={`Info (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
        onClick={e => viewClick(e, "category", category.id)}>
        <Info className="size-4" /><span className="sr-only">View {category.name}</span>
      </Link>
    </HoverIconButton>
  )}
/>
```

| Entity | File | Icon | Body link | Count |
|---|---|---|---|---|
| Categories | `CategoryPreviewCard.tsx` (row branch) | `CategoryIcon` | own page `/categories/$slug` (plain) | `bookmarkCount` |
| Websites | `WebsiteListItem.tsx` | favicon `imageUrl`→`Globe` | own page `/taxonomies/websites/$slug` (plain) | `bookmarkCount` |
| YouTube Channels | `YouTubeChannelListItem.tsx` | avatar `imageUrl`→`MonitorPlay` | own page `/taxonomies/youtube-channels/$slug` (plain) | `bookmarkCount` |
| Tags (tree) | `TagTreeList.tsx` | `CategoryIcon` (none → Tag glyph) | own page `/tags/$slug` (plain) | `bookmarkCount` |
| Media Types (tree) | `MediaTypeTreeList.tsx` | `CategoryIcon name={node.icon}` | own page `/taxonomies/media-types/$slug` (plain) | `bookmarkCount` |
| Property Groups *(detail)* | `PropertyGroupListItem.tsx` | `Layers` | detail `…/$slug/general` (`viewClick`) | `propertyCount` |
| Relationship Types *(detail)* | `RelationshipTypeManager.tsx` | `Link2` | detail `…/$slug/general` (`viewClick`) | `bookmarkCount` |
| Publishers *(detail)* | `PublisherManager.tsx` | `BookOpen` | detail `…/$slug/general` (`viewClick`) | `bookmarkCount` |
| People *(detail)* | `PersonManager.tsx` | `UserRound` | detail `…/$slug/general` (`viewClick`) | `bookmarkCount` |
| Autofill *(detail, no Info)* | `AutofillRuleListItem.tsx` | `Wand2` | info `/autofill/$slug` (`viewClick`), no Info button | `matchCount` |
| Saved Filters *(detail, no count)* | `SavedFilterCard.tsx` | `ListFilter` | detail `…/$slug/general` (`viewClick`) | — (footer keeps the viewable-online checkbox) |

## Tree taxonomies (Tags, Media Types)

`TaxonomyTreeRow.tsx` is shared by both and keeps the recursion + the "No Child" own-count
sub-row; the row content itself (icon, chevron, links, badges, hover actions) lives in
`TaxonomyTreeRowInner.tsx`. The row renders the icon **first** (`CategoryIcon name={node.icon ?? null}`), then the
chevron/spacer, the name link, the hover Edit + Info ghost buttons, and the count badge; each row
mutes independently (`node.bookmarkCount === 0 → opacity-60`). The wrappers supply three render
props: `renderNameLink` (the plain link to the term's **own bookmarks page** — `/tags/$slug`,
`/taxonomies/media-types/$slug`), `renderEditLink`, and `renderInfoLink`
(the **General view tab** `…/$slug/general`, `viewClick` — never the bare index). `TaxonomyTreeNode`
carries an optional `icon?: string | null` (Media
Types thread `node.icon`; flat Tags get the Tag-glyph fallback).

## Non-listable entities + other notes

- **Property Groups / Publishers / People** — no per-term bookmarks page exists, so the body links
  to the entity's **General detail tab** (`…/$slug/general`, panel-aware `viewClick`). Property
  Groups' badge counts member **properties** (`propertyCount`); the others use `bookmarkCount`. Edit +
  Info are still shown (Info also → `…/general`).
- **Autofill** — the body links to the rule's **info page** (`/autofill/$slug`, `viewClick`); there is
  **no Info button** (`renderInfo` omitted). The badge is `matchCount` (bookmarks the rule matches).
- **Tree "No Child" sub-row** — the parent-only `ownBookmarkCount` bucket keeps its `Badge
  variant="outline"` row; that's a tree-only extra, not part of the flat card.

## Server-side counts (cache-derived)

Bookmark/match counts come from the **list endpoint**, computed off the in-memory bookmark cache —
no SQL join, no migration:

- **Relationship Types** (`services/relationshipTypes.ts` `listRelationshipTypes`): tally
  `getBookmarkEvaluationData().conditionInputs` per-bookmark `relationshipTypeIds` set →
  `bookmarkCount`. (Keep `relationshipCount`, the edge count, distinct.)
- **Autofill** (`services/autofill.ts` `listAutofillRules`): for each rule, count `baseRows` where
  `evaluateConditions(rule.conditions, conditionInputs.get(id), { tagDescendants })` → `matchCount`.
  **List-only** — don't add it to single-rule reads.

Add the field to the entity's shared type (`packages/types/src/index.ts`) as an optional number, and
mirror it in the entity's **Table-view** column file (`components/tables/*Columns.tsx`) so the table
matches the card.

## pageKeys

Reuse the `listing-page-controls` keys (`categories-listing`, `websites-listing`,
`media-types-listing`, `youtube-channels-listing`, `tags-listing`, `property-groups-listing`,
`autofill-rules-listing`) plus `relationship-types-listing` for any column/view-mode state.

## When a listing entity has no detail/edit pages

Relationship Types had none — the hover Edit/Info buttons need them. Scaffold the slug-routed View +
Edit pages first with the **`tabbed-pages`** and **`add-entity`** skills (route quintet +
`createTabWrapper` + a `RelationshipTypeDetail` view body + a `RelationshipTypeGeneralForm` auto-save
edit form per **`toast-notifications`**), register a panel content type
(`lib/drawerSearch.ts` union + `panel/contentTypes.tsx`), and add the breadcrumb descriptor in
`routes/-appHeader.tsx`. Then convert the inline manager row to `StandardListingCard`.

## Cross-links

- **`listing-page-controls`** — search bar, adjustable columns, filtered counts, sidebar badges.
- **`listing-header-create`** — the header `+` "New X" button.
- **`listing-table-view`** — the parallel Table view + its count column.
- **`add-entity`** / **`tabbed-pages`** — when the listing entity lacks detail/edit pages.

## Reference implementations

`CategoryPreviewCard.tsx` (flat, full props), `WebsiteListItem.tsx` / `YouTubeChannelListItem.tsx`
(image icon + footer pill), `PropertyGroupListItem.tsx` + `AutofillRuleListItem.tsx` (the two
exceptions), `TaxonomyTreeRow.tsx` + `TagTreeList.tsx` / `MediaTypeTreeList.tsx` (tree).

## Verify

```
pnpm --filter=@eesimple/client routeTree   # if new routes were added
pnpm typecheck
pnpm test
pnpm lint:fix                              # always from repo root
pnpm dev                                   # then check each listing page
```

Per page: body click → **the term's own page** — its own bookmarks page for listable entities
(Categories, Tags, Websites, YouTube Channels, Media Types), or its General detail tab for
non-listable ones (Property Groups, Relationship Types, Publishers, People, Autofill) — and **never**
the global `/bookmarks?…=id` list; icon far-left; a tall/wrapping card centers the icon + buttons;
hover shows Edit (+ Info except Autofill); the **Info icon lands on the entity's General detail tab
(`…/$slug/general`), not a bookmarks list**; modifier-click on Edit/Info opens the right panel; for a
listable entity the plain body link does not open the panel, while a non-listable entity's body link
does (it's `viewClick`); the count badge is always visible; a zero-count item is muted but clickable.
