---
name: filterable-facet
description: >-
  Make a taxonomy entity usable as a filter facet in the bookmark search sidebar (a multi-select
  like Media Types / YouTube Channels) and add a quick "create an autofill rule with this entity
  preselected" shortcut in eeSimple Bookmarks. Use when asked to "let filters filter on X", "add X
  as a filter facet", "filter bookmarks by X", or "add a quick-create-autofill-rule button to X".
  Also covers maintaining facets — "rename/remove the X filter", "the X facet shows when empty", "change a facet's label".
  Mirrors how Media Types and YouTube Channels became facets. The full entity-scoped Autofill Rules
  *tab* is a separate concern — see the `scope-autofill` skill.
---

# Add an entity as a filterable facet

A "facet" is a section in the bookmark search filter rail (`FilterSidebar`) that narrows the visible
bookmarks by a taxonomy entity. **Media Types** and **YouTube Channels** are the canonical
multi-select facets; copy one of them. **Tags** is a different shape (hierarchical tree +
presence toggle, single-select) — don't mirror it for a flat entity.

**Language usage** is a sanctioned **exception** to the `FILTER_FACETS` on-demand registry below:
`LanguageUsageFilterSection` is a *dual-vocabulary* facet (two multi-selects — languages + usage
levels — matched with per-row AND semantics) whose vocabularies are always-seeded built-ins, so it
**self-fetches** both lists and is shown via `sectionShown(true, …)` (returning `null` only when both
are empty) instead of being registered in `FILTER_FACETS` / `computeFacetData`. Don't force a new
single-entity facet into that shape; and don't "fix" language-usage into the registry — registering it
would require modeling its data-presence (always true → breaks the `hasFilters` empty-state) or
threading both vocabularies through every `BookmarkSearchView` route.

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

### 1. `packages/client/src/lib/bookmarkSearch.ts` — six edits in one file
- **Interface**: add `<entity>s?: string[]` and `<entity>Presence?: "has" | "missing" | "exclude"`
  to `BookmarkSearch` (mirror `youtubeChannels` + `youtubeChannelPresence`).
- **`validateBookmarkSearch`**: validate the id list with `validStringList` **and** the presence
  mode with `validPresence(search.<entity>Presence)` (copy the `youtubeChannels` /
  `youtubeChannelPresence` pair).
- **`bookmarkMatchesSearch`**: use the **presence/exclusion pair pattern** — exclude mode routes
  through `passesIdFilterExclude`; include/presence modes use `passesIdFilter` (include) +
  `passesPresence` (has/missing). Copy the YouTube channel block:
  ```ts
  && (search.<entity>Presence === "exclude"
    ? passesIdFilterExclude(search.<entity>s, bookmark.<entity>?.id)
    : passesIdFilter(search.<entity>s, bookmark.<entity>?.id)
      && passesPresence(search.<entity>Presence, Boolean(bookmark.<entity>)))
  ```
  Add the entity's relation to the `Pick<Bookmark, …>` param list.
- **`hasAnyActiveFilter`**: add
  `|| (search.<entity>s?.length ?? 0) > 0 || !!search.<entity>Presence`.
- **Id helper**: export `with<Entity>s(search, ids): BookmarkSearch` — clear when empty, else set.
  Copy `withYouTubeChannels`.
- **Presence helper**: export `with<Entity>Presence(search, mode): BookmarkSearch` — copy
  `withYouTubeChannelPresence` (setting `"missing"` also clears the id list; `"exclude"` keeps it).

### 2. `packages/client/src/components/FilterSidebarSections.tsx` — two edits
- Add a private `<Entity>FilterSection` component by copying `YouTubeChannelFilterSection`
  (the presence/exclude pattern is already there). Key elements:
  - A `FacetPresenceToggle` next to the section header (`value={search.<entity>Presence}`,
    `onChange={mode => onSearchChange(with<Entity>Presence(search, mode))}`).
  - Conditionally show the `MultiCombobox` + `FacetChips` when `search.<entity>Presence !== "missing"`.
  - A Reset button when `filterActive` (ids or presence mode is set), calling
    `with<Entity>Presence(with<Entity>s(search, []), undefined)`.
  - Give it a unique `group/<entity>` class on the `Collapsible`.
- In `FilterSections`: add `<entity>s?: <Entity>[]` to the props, render
  `<Entity>FilterSection` conditionally (omit when the list is undefined/empty), and slot a
  `<Separator />` between it and adjacent groups following the existing interleaving.

**Do not** copy `MediaTypeFilterSection` — it lacks the presence/exclusion controls. Mirror
`YouTubeChannelFilterSection` or `WebsiteFilterSection` instead.

`FilterSidebar` (the caller of `FilterSections`) no longer derives visibility inline — it calls
`computeFilterSidebarVisibility` (`packages/client/src/lib/filterSidebarVisibility.ts`), which
combines data presence with the on-demand reveal state. Wiring a new facet therefore means:
add the entity list to `FilterFacetInputs` + `computeFacetData` there, add the facet's
`{ key, label }` to `FILTER_FACETS` and its arm to `facetHasActiveSelection`
(`lib/filterFacets.ts`), and read `facetVisible["<key>"]` in `FilterSidebar` — the same way
`channels` is wired. `filterSidebarVisibility.test.ts` covers the reveal rules; extend it for the
new facet.

### 3. Route files that render `BookmarkSearchView`
`BookmarkSearchView` already accepts optional `mediaTypes?` / `youtubeChannels?` — add `<entity>s?:
<Entity>[]` to its `BookmarkSearchViewProps`, thread it down to `FilterSidebar`, then pass it from
each route. Current `BookmarkSearchView` routes (add the prop to all of them):
- `packages/client/src/routes/bookmarks.index.tsx` — call `use<Entity>s()` and pass
  `<entity>s={<entity>s ?? []}`.
- `packages/client/src/routes/categories.$categorySlug.index.tsx` — data from
  `routes/-categoryPageData.ts`; add the entity to that bundle if not already there.
- `packages/client/src/routes/tags.$tagSlug.index.tsx` — same `-categoryPageData.ts` bundle.
- `packages/client/src/routes/taxonomies.websites.$websiteSlug.index.tsx`
- `packages/client/src/routes/taxonomies.media-types.$mediaTypeSlug.index.tsx`
- `packages/client/src/routes/taxonomies.youtube-channels.$channelSlug.index.tsx`
- `packages/client/src/routes/taxonomies.newsletters.$newsletterSlug.issues.$issueId.tsx`

(Run `grep -rn "BookmarkSearchView" packages/client/src/routes/` to get the current list.)

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

## Maintaining an existing facet

- **Rename the label**: one edit in `FILTER_FACETS` (`lib/filterFacets.ts`) — the rail section
  heading, the Add-filter menu, and Settings → Display → Filters all derive from it.
- **Never rename a facet `key`**: it is persisted in `DisplayPreferenceSettings.onDemandFilters`
  and in saved-filter URLs; a renamed key silently orphans users' on-demand configuration.
- **Remove a facet**: delete its `FILTER_FACETS` entry + `facetHasActiveSelection` arm, its
  `FilterFacetInputs`/`computeFacetData` field (`lib/filterSidebarVisibility.ts`), its
  `FilterSections` row, and its `BookmarkSearch` params in `lib/bookmarkSearch.ts`. Old URLs
  carrying the retired params must be ignored, not crash search-param validation.
- **"Shows when empty" bugs** live in `computeFilterSidebarVisibility` — extend
  `filterSidebarVisibility.test.ts` with the failing case before fixing.
