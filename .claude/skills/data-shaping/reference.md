# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Data shaping: middleware vs. client

**Default rule:** API endpoints return *render-ready* shapes. Heavy joins, aggregation, grouping,
tree-building, counting, and condition/relationship derivation belong in the middleware's
`services/`, **not** in React components/hooks. If a component is joining across query results,
grouping, aggregating, or building a tree from a flat list, that shape should come from an endpoint
instead.

**Patterns to mirror** (the middleware already does the heavy lifting — follow these):

- **Counts** — `computeTagBookmarkCounts` (subtree + own counts) in `services/tags.ts` and its
  locations twin, both thin wrappers over the generic `parentId`-tree helpers in
  `utils/parentTree.ts` (children map, subtree ids, subtree bookmark counts — reuse these for any
  new tree taxonomy); the category bookmark-count subquery in `services/categories.ts`; the saved-filter
  sidebar counts (`listSavedFilters` computes `bookmarkCount` over the bookmark cache with the
  shared search predicates). The client
  renders the number; it doesn't tally rows.
- **Trees** — `buildTagTree` / the media-type tree returned by `/api/tags/tree` and
  `/api/media-types/tree`. The client only flattens for indentation.
- **Batched hydration** — `hydrateBookmarkRows` (`services/bookmarkHydration.ts`) joins
  website/mediaType/channel/tags/property-values/images into a render-ready `Bookmark` with no N+1.
- **Plex media taxonomy CRUD is a factory** — `createPlexTaxonomyService`
  (`services/plexTaxonomyService.ts`) generates the list/create/update/delete/bulkDelete/
  backfillSlugs set for movies/tvShows/episodes/tracks (albums stays custom for its People/Group
  credit transactions). A new Plex-shaped taxonomy service should be a thin factory wrapper, not a
  copy of a sibling file; the client table columns for these come from `plexMediaColumns` in
  `components/tables/columnHelpers.tsx` the same way.
- **"Load once → evaluate the shared predicate in-memory → hydrate matches"** —
  `listHomepageSectionBookmarks` (`services/homepageSections.ts`) and `previewAutofillMatches`
  (`services/autofill.ts`) both load via the **bookmark cache** (below) and run the **shared**
  `evaluateConditions` from `@eesimple/types`. Server-side processing that shares logic with the
  client must call the same `@eesimple/types` function — never a re-implementation or a parallel SQL
  translation of the same predicate. The autofill **last-writer merge** follows the same rule:
  `mergeMatchingAutofillRules` / `urlTitleConditionInput` live in `@eesimple/types`
  (`autofillMerge.ts`) and are the single implementation behind both the client form prefill
  (`lib/autofill.ts`) and server-side creation (`suggestAutofillForBookmark`).
- **The bookmark listing search is the paginated instance of the same pattern** —
  `POST /api/bookmarks/search` (`services/bookmarkSearchService.ts` `searchBookmarks`) evaluates the
  entity **scope** (`bookmarkMatchesScope`), the URL facet filters (`bookmarkMatchesSearch` over the
  `BOOKMARK_SEARCH_FACETS` table), the free-text quick search (`bookmarkMatchesText` — title/names/
  url/description/section names), and the sort (`sortBookmarks`) — **all shared `@eesimple/types`
  functions** — over a per-version **hydrated-bookmark cache**, then slices the page and freshly
  re-hydrates only the page rows (so display-only writes, which don't bump the cache version, never
  serve stale data). Every listing surface (the `/bookmarks` page + all entity-scoped listings) goes
  through `useBookmarkSearchView` → `useBookmarkServerSearch` — the client holds **one page**, not
  the whole set. The response also carries `total` (the pager) and `numberBounds` (the filter
  sliders' whole-scope data bounds, read via `NumberBoundsContext`). The body's nested
  `search`/`scope` objects are deliberately schema-free and narrowed by the shared
  `validateBookmarkSearch`/`validateBookmarkSearchScope` — see the `removeAdditional` guard test
  `tests/bookmarkSearchSchema.test.ts` before "tightening" them.

**Sanctioned exceptions that stay client-side** (don't "fix" these by adding endpoints):

- **The `BookmarkSearch` type + facet matcher live in `@eesimple/types`, not the client.** The
  listing filter/search state is still URL-driven, but its evaluation moved **server-side** (the
  bullet above) — `packages/client/src/lib/bookmarkSearch*.ts` are now re-export shells over
  `@eesimple/types` (`bookmarkSearch.ts` / `bookmarkSearchMatch.ts` / `bookmarkSortEngine.ts` /
  `bookmarkTextSearch.ts` / `bookmarkSearchScope.ts`), keeping only the i18n-dependent
  `summarizeBookmarkSearch` + sort-label helpers client-side. `bookmarkMatchesSearch` and
  `hasAnyActiveFilter` stay thin `.every()`/`.some()` iterations over one `BOOKMARK_SEARCH_FACETS`
  table — adding a facet is one table entry (see the **`filterable-facet`** skill), and it works on
  both sides because there is exactly one implementation.
- **Presentation formatting** — `lib/bookmarkFormat.ts` (number/boolean/date-time display).
- **Derivations that are O(n) over data the page already loaded** — slug lookups (`use*BySlug`)
  and "which rules target this entity" (`lib/autofillRulesFilter.ts`). These are free because the
  list is already in cache; an endpoint would only duplicate logic. (Facet slider bounds are the
  exception that *did* move: `effectiveBounds` now prefers the search response's `numberBounds`,
  since the client no longer holds the whole set.)
- **The enumerated heavy derivations** — `lib/bookmarkHierarchy.ts` (relationship tree),
  `lib/bookmarkGraph.ts` + `useBookmarkGraph` (pairwise related-bookmark scoring — the acknowledged
  heaviest; first candidate for a server endpoint if it grows), `lib/relationshipTypeCards.ts`,
  `lib/locationRelationCards.ts`, `useRelatedBookmarks`, `useBookmarksSharingMediaSource`. **This
  list is exhaustive** — a module may call itself "a sanctioned client-side derivation" in a
  docstring only if it is named here, and adding one is a CLAUDE.md edit. Relatedly, plain
  whole-cache `useBookmarks()` reads on non-listing surfaces (palette data, previews, basket) are
  tolerated at current scale, but a *count* or *filter* over the whole set that an endpoint already
  computes must use the endpoint — the saved-filter pin counts were the reference violation.
- **Card Display resolution** — `lib/cardDisplayRules.ts` (`resolveCardDisplay` +
  `useResolveCardDisplay`) evaluates the shared `evaluateConditions` against each rendered bookmark in
  the listing grid (`BookmarkListPane`) to decide that card's **per-section** visibility (each
  `CardDisplaySection.visibleIf`) + image presentation. It runs client-side because cards render
  client-side over the already-cached config/tags; there is **no** server bookmark endpoint for the
  config. The config service (`services/cardDisplayRules.ts`) is therefore CRUD-only, and it never
  touches `invalidateBookmarkCache()` (display-only, not matchable data).

**Caching / growth path.** When work must move server-side but the logic is shared with the client
(filtering, condition matching), prefer the **middleware in-memory cache + shared predicate** over
translating predicates to SQL. `services/bookmarkCache.ts` holds the bookmark rows + per-bookmark
`ConditionInput`s + tag-descendant resolver, rebuilt on a version bump; it is coherent because the
gateway runs a single middleware child. **Every write that changes a bookmark's matchable data (the
bookmark row, its tags, or its custom-property values) — or the tag tree — must call
`invalidateBookmarkCache()`** (see the calls in `services/bookmarks.ts`, `services/tags.ts`, and
`services/customProperties.ts`). This keeps one source of truth for the predicate while moving the
work off the client. SQL-level filtering is the last resort, reserved for genuinely large datasets.
