---
name: filterable-facet
description: >-
  Make a taxonomy entity usable as a filter facet in the bookmark search sidebar (a multi-select
  like Media Types / YouTube Channels) and add a quick "create an autofill rule with this entity
  preselected" shortcut in eeSimple Bookmarks. Use when asked to "let filters filter on X", "add X
  as a filter facet", "filter bookmarks by X", or "add a quick-create-autofill-rule button to X".
  Mirrors how Media Types and YouTube Channels became facets. The full entity-scoped Autofill Rules
  *tab* is a separate concern — see the `scope-autofill` skill.
---

# Add an entity as a filterable facet

A "facet" is a section in the bookmark search filter rail (`FilterSidebar`) that narrows the visible
bookmarks by a taxonomy entity. **Media Types** and **YouTube Channels** are the canonical
multi-select facets; copy one of them. **Tags** is a different shape (hierarchical tree +
presence toggle, single-select) — don't mirror it for a flat entity.

This skill has two halves:

- **A. Filter-facet plumbing** — make the entity narrow the bookmark list (client-only).
- **B. Quick-create autofill shortcut** — a "New Autofill Rule" button that opens the creation panel
  with the entity preselected.

The full entity-scoped **Autofill Rules tab** (a filtered list of all rules for the entity) is
**out of scope here** — see the **`scope-autofill`** skill. If the entity is a *matching criterion*
inside a rule's conditions rather than an action target, also see **`add-condition-type`**.

## A. Filter-facet plumbing (multi-select, client-only)

Mirror Media Types / YouTube Channels. The entity must already be a fetched taxonomy with a
`use<Entity>s()` hook and an `id`/`name` shape, and bookmarks must carry the relation (e.g.
`bookmark.<entity>`). All edits are in the client.

### 1. `packages/client/src/lib/bookmarkSearch.ts` — four edits in one file
- **Interface**: add `<entity>s?: string[]` to `BookmarkSearch` (mirror `mediaTypes` /
  `youtubeChannels`).
- **`validateBookmarkSearch`**: filter the raw array to strings and assign only when non-empty
  (copy the `mediaTypes` block).
- **`bookmarkMatchesSearch`**: add an exclusion — if the filter is non-empty and the bookmark's
  relation isn't in it, `return false` (copy the `mediaTypes` block; match on `bookmark.<entity>.id`
  and add the relation to the `Pick<Bookmark, …>` param list).
- **`hasAnyActiveFilter`**: add `|| (search.<entity>s?.length ?? 0) > 0`.
- **Helper**: export `with<Entity>s(search, ids): BookmarkSearch` (clear the key when `ids` is empty,
  else set it) — copy `withMediaTypes`.

### 2. `packages/client/src/components/FilterSidebarSections.tsx` — two edits
- Add a private `<Entity>FilterSection` component by copying `MediaTypeFilterSection`: a
  `Collapsible` wrapping a `MultiCombobox` (`options` from the entity list, `values` from
  `search.<entity>s`, `onValuesChange` → `with<Entity>s`) plus the Reset button. Give it a unique
  `group/<entity>` class. Import `with<Entity>s` and the `<Entity>` type at the top.
- In `FilterSections`: add `<entity>s?: <Entity>[]` and `has<Entity>Filter: boolean` to the props,
  render `<Entity>FilterSection` conditionally, and slot a `<Separator />` between it and adjacent
  groups following the existing interleaving (each section emits a separator only when a later
  section is present).

`FilterSidebar` (the caller of `FilterSections`) derives `has<Entity>Filter` from whether the
entity list prop is non-empty — wire the new prop through it the same way `mediaTypes` /
`youtubeChannels` are.

### 3. Route files that render `BookmarkSearchView` (currently two)
`BookmarkSearchView` already accepts optional `mediaTypes?` / `youtubeChannels?` — add `<entity>s?:
<Entity>[]` to its `BookmarkSearchViewProps`, thread it down to `FilterSidebar`, then pass it from
each route:
- `packages/client/src/routes/bookmarks.index.tsx` — call `use<Entity>s()` and pass
  `<entity>s={<entity>s ?? []}`.
- `packages/client/src/routes/categories.$categorySlug.index.tsx` (data via
  `routes/-categoryPageData.ts`) — surface the entity list there and pass it the same way.

## B. Quick-create autofill shortcut

A standalone "New Autofill Rule" button on the entity's view page that opens the creation panel
preseeded with the entity — without the full rules tab.

### 1. Preseed the create form from the URL slug
`CreateAutofillRule` (`packages/client/src/components/panel/AutofillRuleForms.tsx`) already reads
`useParams({ strict: false })` and passes `defaultCategoryId` / `defaultWebsiteDomain` to
`AutofillRuleForm`. Extend it:
- Add the entity's slug param (e.g. `mediaTypeSlug`) to the `useParams` destructure.
- Fetch the entity list (its `use<Entity>s()` hook) and resolve `slug → identifier`.
- Pass a `default<Entity>…` prop to `AutofillRuleForm`.

Then seed it in `AutofillRuleForm` (`packages/client/src/components/AutofillRuleForm.tsx`):
- **Action-based** entity (the rule *sets* it, like category): add `default<Entity>Id?: string` to
  `AutofillRuleFormProps` and use it in the initial form state next to
  `setCategoryId: rule?.setCategoryId ?? defaultCategoryId ?? …`.
- **Condition-based** entity (the rule *matches* it, like website domain): add the default to
  `seedConditions(...)` so it appears in the initial `conditions` tree (see how
  `defaultWebsiteDomain` flows into `seedConditions`). This requires the entity's condition leaf to
  exist — see **`add-condition-type`**.

### 2. Add the button to the entity's view page
On the entity's `_view/general` tab, add a "New Autofill Rule" button:
- `const { openAutofill } = usePanelControls();` then
  `onClick={() => openAutofill(NEW_SENTINEL)}` (`NEW_SENTINEL` from `@/lib/drawerSearch`).
- Place it in a `LabeledSection` (title "Autofill"). Because the entity slug is already in the URL
  path, step B.1's `useParams({ strict: false })` preseeds the panel automatically — no extra args
  needed on `openAutofill`.

The `useNewAutofillRule` hook's "New autofill rule" flow uses this exact `openAutofill(
NEW_SENTINEL)` call (when the sidebar modifier is held) — reference it.

## Verify

```
pnpm --filter=@eesimple/client routeTree
pnpm typecheck
pnpm test
pnpm lint:fix        # always from repo root
```

Then `pnpm dev`:
- The new facet appears in the filter rail on both `/bookmarks` and a category page; selecting an
  option narrows the list and Reset clears it; existing Category / Media Type / YouTube Channel /
  Tag facets still work.
- On the entity's view page, "New Autofill Rule" opens the panel with the entity preselected (the
  set-field or condition leaf is already populated) and a saved rule round-trips.
