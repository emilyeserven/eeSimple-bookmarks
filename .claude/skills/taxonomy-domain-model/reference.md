# Reference: moved from CLAUDE.md

These sections were moved verbatim out of the root `CLAUDE.md` when it was slimmed to an index. Mentions of "CLAUDE.md → <section>" elsewhere (code comments, other skills) refer to the sections below.

## Multilingual display names

An entity (bookmark or taxonomy term) can carry multiple language-labelled names (`entity_names`,
`packages/types/src/entityNames.ts` — a pure module shared by API + browser). Three languages drive
how those names surface, and they are **distinct — do not conflate them**:

- **Interface language** (`interfaceLanguage`, react-i18next / `Intl`) — the UI chrome locale.
- **Secondary display language** (`secondaryLanguageId`, `null` = auto) — which language's name shows
  as the de-emphasized secondary label (breadcrumbs, comboboxes) when there's no primary override.
- **Fallback display language** (`fallbackLanguageId`, **`null` = English**) — the last-resort
  language for the secondary label (and the `preferRomanized` sort fallback) when **no**
  preferred/secondary-language name matches. This is the configurable replacement for the formerly
  hardcoded English. All three live in the **display-preferences** app-settings group (Settings →
  Display → Names) and are mirrored end-to-end (type → `app_settings` column → service → route →
  `useAppSettings` hooks → UI). Read it via `useFallbackDisplayLanguage()` (never returns `null` —
  unset resolves to `{ isoCode: "en" }`) / the app-root `FallbackDisplayLanguageProvider` context
  (`useFallbackDisplayLanguageValue()`, `null` outside the provider), and thread it as the last arg
  of `resolveDisplayNames` / into `resolveNameSortKey`'s opts. **Default deploy is byte-identical** —
  omitting/`null` reduces to the old English fallback inside the pure helpers.

**Only display/sort follow this setting.** Slug derivation (`slugSourceFromNames`, the Locations
`englishName` slug source), Wikidata/Wikipedia link resolution, and the source-derived English
`entity_names` persistence (`mergeEnglishEntityName`) **stay English-anchored** — a source's English
name is stored as English regardless of the display fallback, and slugs stay stable.

## Language usage levels & associations

A **language** can be tagged with a **usage level** on many owner entities — e.g. "English dub",
"Japanese subtitles only", "sparse English explanations", or a person's "native / conversational"
proficiency. Two pieces back this (see the **`add-entity`** / **`add-condition-type`** skills for the
change recipes):

- **`language_usage_levels`** — a user-definable taxonomy (mirrors `place_types`) **grouped by
  `kind`**: `availability` (Dub, Subtitles, Explanations…) qualifies content, `proficiency` (Native,
  Fluent, Learning…) qualifies People. `kind` is free text (add a kind without a migration); built-ins
  are seeded (`ensureBuiltInLanguageUsageLevels`) and non-deletable — but **hideable** from pickers via
  the `hidden` flag (see **Hiding seeded built-in vocabularies**). Its `(kind, name)` uniqueness is a
  **`uniqueIndex`, not a `unique()` constraint** — see the composite-unique rule under **Database
  schema changes** (a composite `unique()` there crashed prod `drizzle-kit push`). `deleteLanguageUsageLevel(id, reassignToId?)` reassigns or drops referencing rows (no
  cascade FK), like `deletePlaceType`.
  - **`/taxonomies/language-usage-levels` is a two-screen surface, reached via a flyout on the
    Languages sidebar item** (`LanguagesSidebarItem`, mirroring `GroupsSidebarItem` → Group Types; it
    is **not** its own `taxonomyItems` row — it's in `settingsPages.ts`'s `STANDALONE_PAGES` like
    `group-types`). The **index** is a grouped **Overview** (`LanguageUsageOverview`): sectioned by
    `kind`, with a group-by toggle (Usage level ⇄ Language) and expandable rows; clicking a leaf opens
    that language's scoped bookmarks page filtered to the level. **To add/rename/delete a level, use
    the Edit page** `/taxonomies/language-usage-levels/edit` (the `LanguageUsageLevelsManager`
    grouped-card CRUD), reached from the Overview's "Edit levels" button — not a code change. The
    Overview is fed by `GET /api/language-usage-levels/associations` (`listLanguageUsageAssociations`
    in `services/languageUsages.ts` → `useLanguageUsageAssociations`): the distinct (language, level)
    pairs with counts across **all** owners, since languages↔levels only relate *through* owner
    associations. That endpoint is the **only** derived read — it is display-only, never touches
    `invalidateBookmarkCache()`.
- **`language_usages`** — the codebase's **first value-carrying polymorphic association**. Keyed by
  `(ownerType, ownerId)` with **no FK on `ownerId`** (mirrors `taxonomy_images`), plus a surrogate `id`
  and a **`uniqueIndex`** on `(ownerType, ownerId, languageId, usageLevelId)` (a unique *index*, not a
  table `unique()` — the composite-unique rule again). Owners are the API-authoritative
  `LANGUAGE_USAGE_OWNER_TYPES` tuple in `@eesimple/types` (`languageUsages.ts`) = **`["bookmark",
  "website", "youtubeChannel", "person"]`** — the enum the routes validate against. (A separate, wider
  constant of the same name lives in the middleware `schema.ts`, but it is **not** the set the API
  enforces; don't quote it as the owner list.) One shared service (`services/languageUsages.ts`) does it
  all: `loadLanguageUsages(ownerType,
  ownerIds[])` (the batched, denormalized read loader reused by every owner), `setLanguageUsages`
  (replace-all), `deleteLanguageUsagesForOwner`, and `listLanguageUsageAssociations` (the overview
  matrix above).

**Sync points a new owner type (or a schema change) must hit** — none of these are compiler-enforced:
- Because `ownerId` has no FK, **every owner's delete service must call
  `deleteLanguageUsagesForOwner(<ownerType>, id)`** or it orphans rows (see the calls in
  `services/{bookmarks,people,websites,youtubeChannels}.ts`).
- **Bookmarks are the matchable/filterable owner.** `setLanguageUsages`/`deleteLanguageUsagesForOwner`
  call `invalidateBookmarkCache()` **only** for `ownerType === "bookmark"`; the bookmark's usages ride
  on the hydrated `Bookmark` (`bookmarkHydration.ts`) and populate `ConditionInput.languageUsages` in
  `bookmarkCache.ts`. Filtering is a **`language-usage` condition leaf** (autofill + homepage) that
  matches **per association row** — `(languageIds ∅ ∨ row.language ∈ languageIds) ∧ (usageLevelIds ∅ ∨
  row.level ∈ usageLevelIds)` — so English-dub + Spanish-subs does **not** match {English, Subs}.
- The bookmark **search-sidebar** exposes the same per-row predicate as **two multi-selects**
  (`LanguageUsageFilterSection`). It is a **deliberate exception to the `FILTER_FACETS` on-demand
  registry** (`filterable-facet` skill): a dual-vocabulary, self-fetching section that is always shown
  when it has options (both vocabularies are always-seeded built-ins), rather than a single-entity
  facet threaded through the `BookmarkSearchView` routes.

Editing is uniform: each owner's edit surface has a **Languages tab** (auto-save on entities, the
bookmark edit tab) built from the shared `LanguageUsagesEditor`/`View`; only the `kind` prop differs
(`availability` for content, `proficiency` for People).

**No separate primary-language field on bookmarks.** Bookmarks used to carry a single-valued
`bookmark.languageId` primary field alongside `language_usages`, editable via a dedicated General-tab
combobox and a Languages-tab field. That field/column and both components were removed — a bookmark's
main content language is now expressed the same way as Dub/Subtitles/Explanations: an ordinary
availability-kind `language_usages` row. There is no built-in level seeded for this — an operator names
one (e.g. "Primary Language") via the Edit Levels page, the same as any other usage level. Scan/ISBN
auto-detect (`useBookmarkPrimaryLanguage.ts`) looks up an existing availability-kind level named
`"primary language"` (case-insensitive, `PRIMARY_LANGUAGE_LEVEL_NAME` in `bookmarkFormSchema.ts`) and
attaches the detected language to it — silently no-opping until that level exists — instead of writing
a dedicated field; on create it stages the entry into `CreateBookmarkInput.languageUsages` (inserted in
the same create transaction, mirroring `genreMoodIds`), and on edit it merges into the bookmark's
existing usages via `setLanguageUsages`. `Language.bookmarkCount` and
`/taxonomies/languages/$languageSlug` (an entity-scoped bookmarks page) now derive purely from
`language_usages` — there is no more "primary" carve-out to merge in. The page honours a friendly
`?usageLevel=<slug>` search param — narrowing to bookmarks carrying that language at that level, shown
as a clearable chip — kept **out** of the shared `BookmarkSearch` type so the URL stays canonical. Its
breadcrumb name resolves via `useLanguageBySlug` wired into `-appHeaderNames.ts` (the `add-entity`
breadcrumb sync point).

## Genres & Moods & the polymorphic assignment layer

**Genres & Moods** is a single slug-routed hierarchical taxonomy (`/taxonomies/genres-moods`,
`genre_moods` table, `GenreMood` type) that unifies genre- and mood-style classification into one
`parentId` tree — built like a tree taxonomy (Media-Types-shaped scaffold, Tags-style tree + a
Hierarchy tab; no built-ins). Unlike a single-FK taxonomy it attaches to **both bookmarks and any
other taxonomy entity** through the **generic polymorphic assignment layer** — G&M is no longer
special-cased; it is an ordinary taxonomy whose rows ride the same `taxonomy_assignments` table every
custom taxonomy uses:

- **`taxonomy_assignments (taxonomyId → taxonomies, termId → taxonomy_terms, ownerType, ownerId)`** —
  the generic M:M linking any taxonomy term to any owner. Real FKs on the value side
  (`taxonomyId`/`termId`), an unconstrained `ownerId` on the owner side (**no FK**). `ownerType` for a
  G&M attachment is one of **`GENRE_MOOD_OWNER_TYPES`** (`@eesimple/types` `genreMoods.ts`) — the
  **single edit point** for the G&M target set (currently bookmark + category/tag/website/mediaType/
  youtubeChannel/person/group/newsletter/location/language + itself; config entities —
  autofill/card-display-rules/import-rules/saved-filters — are intentionally excluded). The shared
  service is `services/taxonomyAssignments.ts` (`getOwnerTaxonomyTerms` / `setOwnerTaxonomyTerms` /
  `listTermIdsByOwnerType`); `services/genreMoodAssignments.ts` is a thin **legacy shim** that scopes
  those generic calls to the G&M taxonomy id.
- Because `ownerId` has **no cascade FK**, every owner's `delete*` service must run the **three
  polymorphic owner-cleanups**: `deleteTaxonomyAssignmentsForOwner(ownerType, ids)` (one call
  removes *every* taxonomy's rows, G&M included), `deleteEntityNamesForOwner(ownerType, ids)`
  (see **Multilingual display names** — `ENTITY_NAME_OWNER_TYPES` in
  `packages/types/src/entityNames.ts`), and — for the four `LANGUAGE_USAGE_OWNER_TYPES` owners —
  `deleteLanguageUsagesForOwner(ownerType, ids)`. All three accept an id **or an id array**
  (batched). **A `parentId`-tree taxonomy's delete must collect the whole subtree's ids *before*
  the cascade delete** (via `utils/parentTree.ts`) and run the cleanups for every subtree id — the
  FK cascade removes descendant rows in-DB but knows nothing about the polymorphic tables. Each
  polymorphic *value* service invalidates the bookmark cache only for
  `ownerType === "bookmark"`, importing from the leaf `bookmarkCacheVersion` module where a direct
  `bookmarkCache` import would be circular (see `services/entityNames.ts`). Bookmarks do this across **all three** bookmark-delete paths
  (`deleteBookmark`/`bulkDeleteBookmarks`/`deleteOrphanedBookmarks`) via `cleanupGenreMoodAssignments`,
  which deletes the bookmark's `taxonomy_assignments` rows. Bookmark-owner writes call
  `invalidateBookmarkCache()`. **Image cleanup is separate and per-entity**, not a generic owner
  registry: each entity that stores images has its own table + service (`bookmarkImages` / `groupImages`
  / `personImages` / `youtubeChannelImages`; `socialImages` is a fetch-only helper), and its own delete
  path removes its images — **reading the stored object key *before* the delete cascade and calling
  `deleteObject` after** (the cascade destroys the row that holds the key; forgetting the ordering
  silently leaks S3 objects). Bookmark-image *writes* are matchable data (`imagePresenceBids` feeds
  the fillable-fields condition) — every `bookmarkImages` mutation calls `invalidateBookmarkCache()`. There is **no** `deleteTaxonomyImagesForOwner` / `TAXONOMY_IMAGE_OWNER_TYPES`
  / `services/taxonomyImages.ts` — the `taxonomy_images` table exists as a schema pattern, but there is
  no shared taxonomy-image owner-cleanup helper.
- **Bookmarks** carry `genreMoods: BookmarkGenreMood[]` (hydrated via a batched join on
  `ownerType='bookmark'`, linked in the create/update tx like `bookmarkTags`, submitted as
  `genreMoodIds`) and expose a placeable **`genreMoods`** card field (both sides derive from the shared
  `packages/types/src/cardFieldKeys.ts` tuple).
- **Cross-taxonomy UI is one reusable component** — `components/GenreMoodAssignmentSection.tsx` (over
  the generic `components/TaxonomyAssignmentSection.tsx`; `ownerType`/`ownerId` props, auto-saving
  multi-select with inline create) — dropped into **every** owner's edit General form. Adding a new
  owner = add it to `GENRE_MOOD_OWNER_TYPES` and drop the section into that entity's edit form; don't
  hand-roll a per-owner junction table.

Genres & Moods is both **filterable and matchable**: the `genreMoods`/`genreMoodPresence` search facet
(a `FILTER_FACETS` registry entry) and the `genre-mood` condition leaf. Every **other** user-created
taxonomy gets the same two capabilities generically — see **Custom-taxonomy filters & conditions**.

## Custom-taxonomy filters & conditions

Every user-created taxonomy is **filterable** (a bookmark-search facet) and **matchable** (a condition
leaf in autofill rules / homepage sections / card display), with no per-taxonomy code. Both surfaces
share one gate: **`hooks/useUserTaxonomies.ts`** — non-hidden, at least one term, and **excluding
Genres & Moods**, which keeps its own bespoke facet + leaf (including it would double the vocabulary).
Add a taxonomy in the UI and it acquires both surfaces automatically.

- **Facet.** `BookmarkSearch.taxonomyTerms` / `.taxonomyTermPresence` are **`Record<taxonomyId, …>`**,
  not flat arrays — one entry per filtered taxonomy. Semantics: **any-of within** a taxonomy, **ANDed
  across** taxonomies, and presence is **scoped per taxonomy** (`"missing"` means "carries no term
  from *this* taxonomy"). Matching is **exact** — a parent term does not imply its children, mirroring
  the Genres & Moods facet. One `BOOKMARK_SEARCH_FACETS` entry covers every taxonomy, so the server
  needs no change (the shared matcher runs in `searchBookmarks`, and the search body is schema-free).
- **Taxonomies are dynamic id-keyed facets — they follow the *custom property* model, not
  `FILTER_FACETS`.** `FilterFacetKey` is a literal union, so a user-defined taxonomy can't be one.
  Like properties, they get parallel helpers (`taxonomyHasActiveSelection` /
  `taxonomySelectionSummary` / `taxonomyVisibilityHint`), a `visibleTaxonomies` slot in
  `computeFilterVisibility`, an `OrderedFilterItem` variant, and a `TaxonomyFilterPill` — so they
  fully participate in filter **ordering**, **on-demand reveal**, and the Display → Filters settings
  list. Don't try to widen `FilterFacetKey` with a template literal; the exhaustive switches over it
  are load-bearing.
- **`FilterSections` (the mobile filter modal) is *at* fallow's cognitive cap**, and fallow scores a
  component's **prop count**, so adding either a prop or a hook there tips it over. `TaxonomyFilterSections`
  is therefore self-fetching *and* self-separating (it owns its leading `<Separator />` and returns
  `null` when empty) and renders after `SeparatedSections` rather than as one of its entries. Keep it
  that way — a "tidy-up" that threads the taxonomy list in as a prop will redden `fallow-audit`.
- **Condition leaf.** `TaxonomyCondition` (`{ type: "taxonomy", taxonomyId, termIds, cascadeTermIds? }`)
  already existed in `@eesimple/types` + the evaluator + the middleware JSON schema; what was missing
  was the client editor. It is **multi-instance** in `conditionsFieldTree.ts` (`taxonomyLeaves`, like
  `propertyLeaves`) — one leaf per taxonomy, keyed by `taxonomyId`, not a single named slot.
  `TaxonomyConditionSections` merges leaves **in place** so a leaf whose taxonomy was later hidden or
  deleted round-trips instead of being dropped when another section is edited. Per-term subtree
  **cascade is opt-in** here (the "+ children" checkbox), unlike the exact-match facet.
- **`useConditionEvaluateOptions` builds `taxonomyTermDescendants` from `useAllTaxonomyTerms()`** —
  the flat `GET /api/taxonomy-terms` list spanning *every* taxonomy, matching how the server's
  `bookmarkCache` builds it. It previously read Genres & Moods alone, which silently no-op'd cascade
  for every other taxonomy's terms. Term ids are globally unique, so one descendant map serves both
  the `taxonomy` leaf and the legacy `genre-mood` leaf.

## Creators: People & Groups

There is **no "Artists" taxonomy** — it was collapsed into the two creator taxonomies. **Individuals are
People; bands/companies/collectives are Groups** (the taxonomy renamed **Publishers → Groups** on `main`;
use the `Group`/`groups`/`groupId`/`services/groups.ts`/`useGroups`/`groupsApi`/`GroupGeneralForm`
identifiers). Both absorbed the former Artist's Plex-backed creator fields, so **People and Groups each
carry** `sortOrder`, `year`, the Plex link (`plexRatingKey`/`plexItemType`/`plexItemTitle`), and **album
credits** (People additionally keep `mediaPropertyId`; Groups use `groupTypeId` instead — they do **not**
have `mediaPropertyId`). The Plex-link + year + album-credit UI is the shared
`components/CreatorMediaSection.tsx`, wired into both `PersonGeneralForm` and `GroupGeneralForm` (a
person/band Plex-links against the Plex **`artist`** item type — `PlexKind` keeps `"artist"` for this,
even though a bookmark can no longer link an Artist row). Groups has its **own avatar/poster system**
(`group_images` + `services/groupImages.ts` + `/api/groups/:id/image*`), mirroring `person_images`.

- **Albums credit both**: the `album_artists` join was replaced by **`album_people` + `album_groups`**
  (`Album.personIds` / `Album.groupIds`); the album-credit UI is `AlbumCreditsSection.tsx`.
- **Bookmarks credit both**: `bookmark_people` (individual creators, `personIds`, hydrated as
  `Bookmark.people`) **and the new** `bookmark_groups` M:M (group creators, `groupIds`, hydrated as
  `Bookmark.groups`). These are **distinct from** the single `bookmarks.groupId` FK (hydrated as
  `Bookmark.group`), which remains the item's **publishing house** (e.g. an ISBN's publisher). Both
  multi-selects live on the bookmark edit **General** tab (`BookmarkGeneralRelationsSection` — People +
  Groups, each with `useEntityCreateOption` inline-create) and both have a CMD+K quick-edit sub-palette
  (`PeopleSubPalette` / `GroupsSubPalette`, gated in `BookmarkTaxonomiesGroup`). A bookmark no longer has
  an `artistId`, and `"artist"` is **not** one of the six bookmark media-link FKs (`useBookmarkMediaField`
  — book/movie/tvShow/episode/album/track) nor an image-owner (there is no `artist` image table; image
  storage is per-entity — `bookmarkImages` / `groupImages` / `personImages` / `youtubeChannelImages`).
- **Migration**: existing `artists` rows were folded into `people` by name (idempotent `migrate.ts`
  steps copy the rows + bookmark/album links, then drop the artists table). Group bands can't be
  auto-classified, so they land in People — re-credit them to Groups by hand.

## Franchise hub bookmarks

A **franchise / IP grouping** (e.g. "The Lord of the Rings") is modeled as an ordinary **hub bookmark**,
not a taxonomy. This is the replacement for the retired `media_properties` grouping (part of the #1057
Media Property → Media Type reconciliation) — the data migration materializes each old `media_properties`
row into this shape. The convention rides entirely on existing bookmark/relationship infrastructure; the
**only** dedicated piece is the built-in **"Franchise"** media type.

- **Hub shape** — a hub is a plain (usually **URL-less**) bookmark carrying `mediaTypeId = Franchise`
  (the built-in seeded by `ensureBuiltInMediaTypes()` in `services/mediaTypes.ts`). The Franchise media
  type is what makes hubs identifiable and gives a one-click **"show all franchises"** via the ordinary
  Media Type filter facet — don't add a parallel franchise vocabulary. URL-less hubs render via the
  #1070 nullable-`url` support. **Franchise is convention-only, not code-load-bearing** — no code
  resolves it by identity, so it is safe to **hide** (like any built-in; see **Hiding seeded built-in
  vocabularies**), though it stays non-deletable; hiding it only removes it from the media-type pickers,
  and existing hubs keep rendering.
- **Member edges** — a hub links each member via the built-in **directional Parent/child** relationship
  type, **hub = parent, member = child** (in the `BookmarkRelationshipsEditor`, tick "Selected bookmark
  is the parent" on the member so the hub becomes the parent). Storage/direction and rendering are the
  standard relationship stack: `bookmark_relationships` (parent = `bookmark_a_id`), `lib/bookmarkHierarchy.ts`,
  and the "Hierarchy" detail section (`components/bookmarkDetailSections.tsx`). The hierarchy keys off the
  generic **`directional`** flag, **not the Parent/child type's identity**, so Parent/child is likewise
  convention-only — hideable (non-deletable) without breaking hubs or the hierarchy view.
- **Franchise page = the hub bookmark's own detail view** (its Hierarchy/Related sections list the
  members) — this replaces `/taxonomies/media-properties/$slug`. Don't build a dedicated franchise page.
- **Discoverability is intentionally minimal.** Per-franchise browsing is the hub page; global discovery
  is the **Media Type = Franchise** facet plus the coarse **relationship-type** facet/condition leaf
  ("has a Parent/child edge"). The relationship-type facet/leaf are **role-blind** — they can't express
  "only members of franchise Y" — which is an **accepted, documented limitation**, not a gap to close
  here. A role/hub-aware franchise filter is a possible future follow-up.
- **`people.mediaPropertyId`** (vestige of the retired Artists taxonomy) is slated to be **dropped at
  `media_properties` retirement** — a person↔franchise link is expressible post-migration by crediting
  the person on the hub bookmark (`bookmark_people`).

## Hiding seeded built-in vocabularies

Four seeded vocabularies — **media types** (`services/mediaTypes.ts`), **relationship types**
(`services/relationshipTypes.ts`), **group types** (`services/groupTypes.ts`), and **language usage
levels** (`services/languageUsageLevels.ts`) — each carry a nullable **`hidden`** boolean column
(null = false, coalesced in the `to*` mapper). A hidden value is **excluded from pickers/facets/condition
editors but stays fully resolvable** by existing data and by identity-lookup code. The mechanism is
**hide, never delete built-ins**: built-ins remain non-deletable (so boot re-seeding and identity
couplings can't break), but any built-in can be **hidden** — the one mutation allowed on a built-in
(rename/delete stay blocked, and the `hidden` toggle sits outside the rename/delete guards in each
`updateX`). **Group types were folded into this model**: they gained a `builtIn` column too (the 4
seeds are marked built-in on boot via `ensureDefaultGroupTypes`'s insert + backfill-by-name), which
also **dissolved their resurrect-on-boot bug** — a removed default is now hidden, never deleted, so
nothing is re-seeded over it. No seeder ever writes `hidden` on an existing row, so a user's hide choice
survives every reboot. The `hidden`/`built_in` columns are **lone nullable columns** = push-safe
additive (no `migrate.ts` step) per **Database schema changes**.

- **Filtering lives at the picker, not the hook/endpoint.** `list*` endpoints and the client hooks
  return **every** row (each carrying `hidden`), so the identity lookups keep resolving:
  the media-type slug `"video"` (`services/bookmarkEnrichment.ts`), the `"Book"` media type
  (`useBookmarkIsbn.ts`/`useBookmarkFormHandlers.ts`), the `"About"` relationship type
  (`BookmarkMediaLinkField.tsx`), and the `"primary language"` usage level (`useBookmarkPrimaryLanguage.ts`)
  — **these four, not Franchise/Parent-child, are the real load-bearing built-ins** (franchise hubs and
  the hierarchy view key off the `mediaTypeId` facet and the generic `directional` flag, not a specific
  value's identity). Each **picker/facet/condition editor** filters `!hidden` at its option-list
  construction. Media types funnel through the shared **`mediaTypeNodesToOptions`** (`lib/comboboxOptions.tsx`),
  which **prunes-and-hoists** a hidden node (splices it out, lifts its visible children up) so hiding a
  parent never vanishes a visible child; the other three filter inline at each call site.
- **UI:** each taxonomy listing card gets a hover **Eye/EyeOff** toggle (`HideToggleButton` in
  `StandardListingCard.tsx`) + a "Hidden" badge; media types toggle via the edit form
  (`MediaTypeGeneralForm.tsx`). `group_types` also gained `deletableIds`/`isSelectable` guards
  (`entities/groupType.tsx`) excluding built-ins from bulk delete/selection.
- **Accepted edge case:** a stored default (e.g. a website's default media type) pointing at a
  now-hidden value renders blank in *its* picker — same as today's deleted-value behavior; unhiding
  restores it. Bookmark cards are unaffected (they render the embedded value, not a picker).
