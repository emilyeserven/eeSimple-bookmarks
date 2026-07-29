# Conventions Audit — July 2026

A full-codebase sweep of the conventions documented in `CLAUDE.md` (and the hand-authored skills),
cataloging (1) code that violates an established convention, (2) documentation that has drifted from
the code, and (3) recurring patterns that deserve a written convention but don't have one. Six audit
passes covered: middleware, the types package, client UI structure, client data/state, the
hand-maintained registries, and testing/i18n/lint discipline.

Severity legend: 🔴 behavior-affecting bug · 🟠 convention violation · 🟡 doc/dead-surface drift.

> **Status (2026-07-29): addressed on this branch.** Every 🔴/🟠 finding and the doc/dead-surface
> drift below was fixed in the follow-up commits on `claude/app-conventions-audit-8lsl8h`, and the
> §13 proposed conventions were recorded in CLAUDE.md (with the supporting primitives —
> `useCollectionAutoSave`, `imageGrabErrorReply`, `toastSpies`, `registerReset`, the shared
> `cardFieldKeys` tuple, the derived `taxonomyEditLink` — implemented). Deliberately deferred, as
> documented decisions rather than code changes: the six uiStore server-migration candidates (§4),
> the enumerated client-side heavy derivations (§5 — now a closed sanctioned list), the shared
> `BackLink`/`EmptyState`/skeleton primitives (C-13 — idioms documented instead), and
> `UpdateHomepageFilterInput` (endpoint no longer exists; left for a dead-surface pass).

---

## 1. Behavior-affecting findings (fix first)

| # | Finding | Where |
|---|---------|-------|
| 🔴 1.1 | **`tableColumnWidths` is documented (JSDoc + CLAUDE.md) as persisted but is missing from `partialize`** — table column widths are silently lost on reload. | `packages/client/src/stores/uiStore.ts:124` vs the `partialize` block (~L526–550) |
| 🔴 1.2 | **Two of the three bookmark-delete paths orphan `language_usages` rows.** `bulkDeleteBookmarks` and `deleteOrphanedBookmarks` never call `deleteLanguageUsagesForOwner("bookmark", …)`; only `deleteBookmark` does. CLAUDE.md explicitly requires all three. | `packages/middleware/src/services/bookmarkBulk.ts:82`, `services/bookmarkOrphans.ts:20` |
| 🔴 1.3 | **Tree-taxonomy deletes orphan polymorphic rows for descendants.** `parentId` cascades delete descendants in-DB, but `deleteTaxonomyAssignmentsForOwner` / `deleteEntityNamesForOwner` run only for the deleted id — every descendant's rows are orphaned. Affects tags, locations, media types, taxonomy terms, genre-moods. | `services/tags.ts:434`, `services/locations.ts:606`, `services/mediaTypes.ts:402`, `services/taxonomyTerms.ts:203`, `services/genreMoods.ts:207` |
| 🔴 1.4 | **`services/bookmarkImages.ts` never calls `invalidateBookmarkCache()`**, yet the cache builds `imagePresenceBids` from `bookmark_images` and feeds it to the extension-fill `hasFillableFields` condition — every image add/set/remove leaves matchable data stale. | writes at `services/bookmarkImages.ts:392–699`; cache read at `services/bookmarkCache.ts:477` |
| 🔴 1.5 | **`deletePerson` / `deleteGroup` / `deleteTaxonomy` skip `invalidateBookmarkCache()`** despite cascading `bookmark_people` / `bookmark_groups` / `taxonomy_assignments` away (all matchable: presence bids + `taxonomyTermIds`). | `services/people.ts:387`, `services/groups.ts:396`, `services/taxonomies.ts:180` |
| 🔴 1.6 | **`updateGroup` throws a plain `Error` for a missing group → 500 `internal` instead of 404.** Should be `NotFoundError("Group")`. | `services/groups.ts:336` |
| 🔴 1.7 | **A place-type rename leaves stale names on cached locations** — `useUpdatePlaceType` invalidates only `PLACE_TYPES_KEY`, while delete/bulk-delete correctly also invalidate `["locations"]`. | `packages/client/src/hooks/usePlaceTypes.ts:38–52` |
| 🔴 1.8 | **Languages are the one favoritable kind whose listing rows can't be starred** — `LanguageCard` passes no `renderExtra`/`FavoriteToggleButton`; no `useFavoriteToggle("language")` call exists anywhere. Breaks the "header strip + listing row + CMD+K" contract (15/16 kinds comply). | `packages/client/src/components/LanguageCard.tsx:31–96` |
| 🔴 1.9 | **Five live settings routes aren't in `SETTINGS_PAGES`** → silently unstarrable: `/settings/custom-properties`, `/settings/websites`, `/settings/media-types`, `/settings/youtube-channels`, `/settings/relationships`. Register in `STANDALONE_PAGES` or convert the four fallback listings to redirects like their siblings. | `routes/settings.{custom-properties,websites,media-types,youtube-channels,relationships}.tsx` |

---

## 2. API error envelope (CLAUDE.md → `api-errors` skill)

- 🟠 **Untranslatable domain error**: `PUT /api/entity-names/:ownerType/:ownerId` wraps the service in
  try/catch and hand-builds `reply.status(400).send({ message })` — no `code`, no `statusCode`. Root
  cause: `services/entityNames.ts:164` throws a plain `Error` instead of `ValidationError`.
  (`routes/entityNames.ts:82`)
- 🟠 **Non-envelope shapes on metadata routes**: `/api/fetch-title` sends `{ message, reason }`
  (`routes/metadata.ts:421`); the ISBN 404/502 paths send `{ message, detail }` with no `code` at all,
  plus an `as unknown as` cast (`routes/metadata.ts:518,523`).
- 🟠 **Image-grab result kinds leak into the `code` slot** (`no_image`, `bad_image`, `blocked`,
  `server_error`, `fetch_error`) from 5 routes; none are in the `ErrorCode` union or
  `errorMessages.ts`, so they always render raw English. (`routes/people.ts:266`, `routes/groups.ts:268`,
  `routes/websites.ts:249`, `routes/bookmarkImageRoutes.ts:99`, `routes/youtubeChannels.ts:300,308`)
- 🟠 **Envelope inconsistency among the sanctioned discriminated-result routes**: four omit
  `statusCode`; youtube-channels includes it *and* adds a non-envelope `detail` key.
- 🟠 **`conflict` is thrown 6× but missing from `errorMessages.ts`**, and it's not on the file's
  "deliberately unmapped" list — an undeclared gap, always raw English.
- 🟡 `utils/errorHandler.ts:29` emits `code: "error"`, which isn't in the `ErrorCode` union (the
  client's doc comment already anticipates it — the server type is behind).
- 🟡 CLAUDE.md says a new code needs an "`ErrorCode` union entry" — the union lives in
  `middleware/src/utils/errors.ts:24`, not `@eesimple/types`, and the client re-declares `ErrorParams`
  separately (`client/src/lib/errorMessages.ts:14`).

Clean: all ~45 `AppError` subclasses use the union correctly; one `setErrorHandler`; success status
codes consistent.

## 3. Edit-tab auto-save & toast standard

- 🟠 **A Save button survives on the bookmark Related edit tab** (`BookmarkRelationshipsEditor.tsx:259`)
  — CLAUDE.md says the Image tab's is the only one left — and the same form persists with **no toast
  at all** (`:140`).
- 🟠 **Silent server-side saves** (persist without any toast): the five inline card-edit saves in
  `useBookmarkCardSaves.ts:28–73`; the view-tab boolean/section toggles in
  `BookmarkPropertyLayoutFields.tsx:111–130`; inline renames in `PlaceTypesCard.tsx:65` and
  `LocationRelationsCard.tsx:58` (contrast `LanguageUsageLevelsManager.tsx:191`, the identical UI,
  which toasts).
- 🟡 **Undocumented exception**: `LocationAncestorsSection.tsx:81` has a "Save ancestors" button
  (self-documented rationale, does toast) — absent from CLAUDE.md's exception list.
- 🟡 **A second auto-save engine exists**: `hooks/useSectionAutoSave.ts` (used once, by
  `PropertyScopeEditForms.tsx`) alongside the documented "single implementation"
  `useFieldAutoSave.ts`. Document or fold in.

Clean: no `<form onSubmit>` on entity edit tabs (except the sanctioned Image tab), zero
`requireDirty` call sites, 53 files correctly using `notifyFieldSaved`, no local-only uiStore write
fires a toast.

## 4. uiStore vs `app_settings` classification

Beyond 1.1 (`tableColumnWidths`), candidates for the server-side move, strongest first:
`hideLocationMapAdminBorders` (`uiStore.ts:192` — global map pref while a server location-display
group exists), `bookmarkGraphSpacing` (`:130` — split-brain: the graph's weights/maxRelated sync,
its spacing doesn't), `selectedDisplayPreset` (`:121` — pointer to a server-side entity),
`hiddenCardFields` (`:116`), and the three un-page-keyed sort modes
(`locationSortMode`/`categorySortMode`/`websiteSortMode`, `:162–168`). The dormant drawer-era
orphans are correctly absent from the store.

## 5. Data shaping (middleware vs client)

- 🟠 **Sidebar saved-filter pins tally counts over the whole bookmark set**
  (`useSidebarPins.tsx:147,252` — `bookmarkMatchesSearch(...).length` over `useBookmarks()`), while
  every other pin kind reads a server-supplied `bookmarkCount`. This is what forces the whole-set
  `useBookmarks()` into the sidebar. Should be a count on the saved-filters endpoint.
- 🟠 **`lib/mediaTypeTree.ts` builds a media-type tree client-side** for the filter sidebar
  (`FilterSidebarSectionBodies.tsx:178`) even though `/api/media-types/tree` exists and CLAUDE.md
  names it as the pattern to mirror.
- 🟡 **Six modules self-declare "a sanctioned client-side derivation — see CLAUDE.md"** for
  derivations CLAUDE.md's sanctioned list never mentions: `lib/bookmarkHierarchy.ts:124`,
  `lib/bookmarkGraph.ts` + `useBookmarkGraph.ts:29` (pairwise scoring over the whole set — the
  heaviest, strongest endpoint candidate), `lib/relationshipTypeCards.ts:91`,
  `lib/locationRelationCards.ts:19`, `useRelatedBookmarks.ts:15`,
  `useBookmarksSharingMediaSource.ts:42`. Either extend the documented list or add endpoints — today
  the doc and code disagree.

Clean: zero ad-hoc `fetch` bypassing `lib/api/`; the search/sort/scope re-export shells are as
documented; shared-logic rule fully clean (evaluateConditions, autofill merge, search/sort/text all
resolve to the single `@eesimple/types` implementation).

## 6. Derived-tuple rule (types)

The four documented tuples are cleanly derived everywhere. Adjacent violations:

- 🟠 `SectionFillEntryType` in `packages/types/src/extensionFill.ts:206` is a hand-mirrored copy of
  `SECTION_ENTRY_TYPES` — inside the types package itself.
- 🟠 `lib/bookmarkAiUpdateReview.ts:441` hand-mirrors the same four entry types as a fallback array.
- 🟠 `RevealedCustomFields.tsx:20–27` hand-mirrors `BOOKMARK_FORM_DETAIL_SLUGS` (and
  `lib/bookmarkAddForm.ts:58` documents the mirror instead of importing it).
- 🟠 `BooleanLabelPreset` has **no tuple** and its six members are hand-listed in three places
  (`types/src/index.ts:2231`, `client/components/propertyFormSchema.ts:76`,
  `middleware/routes/customProperties.ts:140`) — exactly the PR-#341 drift shape.
- 🟡 `lib/inboxPreFill.ts:4` hand-lists a subset of `CUSTOM_PROPERTY_TYPES` (type-checked, but
  additive drift is silent).

Clean: `.js` extensions in `packages/types` (0/60 files violate), no deep imports of
`@eesimple/types/src|dist` anywhere, barrel complete.

## 7. Content hierarchies & UI structure

- 🟠 **Detail/edit content in card boxes**: `BookmarkAiUpdateTab.tsx:173–253` (4 `<Card>`s on the
  bookmark edit `aiUpdate` field), `TagReparentTab.tsx:121–227` (5 `<Card>`s on the tag view *and*
  edit `reparent` field), `LanguageUsageLevelsManager.tsx:120` (whole edit page is one `<Card>`),
  `TranslationSourcesManager.tsx:76` (taxonomy listing wrapped in a settings-panel `<Card>`).
- 🟠 **Hand-rolled `RowCard` classes** (`rounded-lg border bg-card`) instead of `<RowCard>` in 8
  places: `extensionFill/SortableFillRuleRow.tsx:63`, `extensionFill/WebsiteBuiltInFillRules.tsx:72`,
  `cardDisplaySectionBoard/SectionCard.tsx:54`, `SortableLevelGroupRow.tsx:26`,
  `NotificationsBellPopover.tsx:89`, `HomepageSectionCard.tsx:80` (hand-rolls the `<Card>` token for
  a board row), `AddBookmarkCollapsible.tsx:32`, `LocationMapSection.tsx:124`.
- 🟡 **A third, undocumented card use** — both full-page create routes wrap their form in a
  hand-rolled card box (`routes/taxonomies.locations.new.tsx:37`, `routes/custom-properties.new.tsx:50`).
  Convert to flat stacks or document "create page form box" as a sanctioned use.
- 🟠 **Three "Add X" modals re-implement the InlineCreateModal chrome**: `AddYouTubeChannelModal.tsx`
  (name + one extra field — exactly the supported `extraFields` shape), `AddWebsiteModal.tsx`,
  `AddCustomPropertyModal.tsx`.

Clean: breadcrumbs single-sourced (one `ui/breadcrumb` consumer); `TabbedEntityLayout` settings-only;
`VerticalTabbedLayout` settings-sections-only; zero duplicate Radix primitives and zero `@radix-ui/*`
imports outside `ui/`; all 21 workbench descriptors carry `layoutKind`/`fields`/`defaultLayout` with
exhaustive `satisfies`, thin tabs, no pane `render`, no hooks-in-renderers; Hierarchy-tab rule fully
clean (including the taxonomy-term `showIf: hierarchical` gate); `_hub` pattern clean with zero
`/bookmarks?filter=` redirects; `taxonomyViewLink`/`viewDetailsAction` fully gone.

## 8. Registry & palette sync

### CMD+K palette ↔ header toolbar

- 🟠 **`taxonomyEditLink` is a hand-written 13-case switch shadowing the 19-entry derived
  `ENTITY_ROUTES`** (`components/header/toolbarActionTypes.tsx:67–228`). Location-relations,
  custom-properties, autofill, import-rules, saved-filters, and custom-taxonomy term pages get no
  header Edit button (the palette covers all of them — the palette is *ahead* of the toolbar).
  CLAUDE.md's "no per-entity branch" claim is wrong. Highest-value fix: derive it from
  `ENTITY_ROUTES`.
- 🟠 **"New sub-term" is header-only** — `addChildAction` supports `taxonomyTerm` but the palette's
  `AddChildModal` is typed `"tag" | "mediaType"` only (`EntityCommandGroup.tsx:107–109`,
  `CommandPalette.tsx:285–292`).
- 🟠 **`CREATE_ITEMS` drift**: `CreateKind` declares 10 kinds but the palette's Actions group lists
  9 — `group` has a wired modal and no row (`CommandPaletteNavGroups.tsx:47–85`,
  `commandPaletteModals.tsx:16–26`). Nine further listing pages register a header create button with
  no palette "New X" (autofill, genres-moods, group-types, groups, location-relations,
  relationship-types, languages, custom-taxonomy terms, import-rules).
- 🟠 **Pin scope mismatch**: palette `PINNABLE_KINDS` includes `saved-filter` + `location`; the
  header `resolvePinContext` if-chain doesn't (`EntityCommandGroup.tsx:28–36` vs
  `routes/-appHeaderData.ts:119–146`).
- 🟠 **`homepage-settings` toolbar action has no palette mirror** (`toolbarEntityActions.tsx:134`).
- 🔴 **CLAUDE.md documents a "Filter location" palette category that does not exist** —
  `setFilterLocation` greps to zero hits, and `listingPage.hasFilters` is written but never read
  (dead field: `stores/uiStore.ts:206,218`, `toolbarActionTypes.tsx:36`).
- 🟡 Dead type surface: the `ToolbarMobile` `{ kind: "standalone" }` variant has no producer.

### Favorites

- 🟠 **Custom-taxonomy terms get 1 of the 3 promised starring surfaces** (listing row only — no
  header star, no CMD+K, because `taxonomy-term` isn't an `EntityRouteKind`).
  (`useTaxonomyTermFavoriteToggle` has exactly one call site.)
- Plus 1.8 (languages) above. The other 15 kinds are verified complete across all four legs.

### Sync-from-source

- 🟡 **Two orphaned diff builders**: `lib/syncSources/podcastDiff.ts` and
  `lib/syncSources/plexTitleDiff.ts` are exported, unit-tested, and imported by nothing but their
  tests — no `SyncDescriptorKind`, no fetch hook, no registration (Plex/podcast sync is served via
  the *bookmark* provider's diff groups). Wire or delete.

Clean registries (verified programmatically): `ENTITY_DESCRIPTORS` → routes/palette/breadcrumb
derivation (19/19, all name resolvers present); `LAYOUTABLE_ENTITY_KINDS` ↔
`LAYOUT_DRIVEN_ENTITIES` (21↔21); `STANDARD_CARD_FIELDS` ↔ `STANDARD_CARD_FIELD_KEYS` (25↔25,
same order); `BOOKMARK_SEARCH_FACETS` ↔ filter sidebar (16 facets ↔ 14 sections, exceptions
documented).

## 9. Testing conventions

- 🟠 **Factory bypasses** (inline/shadow literals of types that have a factory):
  `RelationshipTypeManager.stories.tsx:11`, `conditions/RelationshipTypeConditionEditor.stories.tsx:12`,
  `lib/autofillRulesFilter.test.ts:14`, `HomepageSectionsSettings.stories.tsx:12` (shadows
  `makeHomepageSection`), `lib/languageOptions.test.ts:11` (an `as Language` cast).
- 🟠 **Missing factories** for shared types constructed in tests: `EntityLayout` (9 sites — most
  urgent), `SavedFilter` (3 stories), `PlaceType`, `PlaceTypeLevelGroup`, `InboxItem`/`ImportItem`,
  `MediaObject`, `ConnectorsStatus`.
- 🟠 **21 of 48 mocking test files mock the toast stack via three different seams**
  (`vi.mock("../lib/autoSave")` ×13, `vi.mock("../lib/notifications")` ×5, `vi.mock("sonner")` ×4).
  Consolidate on one seam (or assert on the real `notificationStore`) — this alone would push the
  mock-free ratio (currently 82%) meaningfully higher.
- 🟡 **Non-zustand module singletons have no reset path**: `resetStores.ts` only accepts zustand
  shapes, but `lib/notificationPage.ts:12`, `lib/pwa.ts:32–34`, `lib/locationMapMarkers.tsx:20`, and
  `BookmarkRelationshipsEditor.tsx:36` (`draftCounter`) are module-level mutable state. The affected
  tests are safe only because they happen to call `vi.mock` (→ isolated project) — which contradicts
  the "prefer mock-free" guidance. Widen `resetAllStores()` or amend the doc.
- 🟡 Two pure-data tests likely qualify for the `node` pragma:
  `lib/bookmarkFormConditionInput.test.ts`, `lib/entityRoutes.test.ts` (verify the transitive
  registry import first). The 18 other pragma-less `.test.ts` files are documented-correct.

Clean: zero `fallow-ignore` comments in code; import-cap exemptions exactly the two sanctioned
files; `emilyConfigWithCap` intact; 60/60 conventional commit subjects; generated files pristine
(fallow skill in sync).

## 10. i18n & Storybook

- 🟠 Three hardcoded user-facing strings: `PropertyImageFileOptions.tsx:34,55`,
  `PropertyBooleanOptions.tsx:100`. (Otherwise coverage is genuinely consistent — these are the only
  misses found.)
- 🟡 `ja.json` health: 765 orphaned keys; 6 stale keys carry real Japanese and reference removed
  features (`"Open in drawer"`, `"Display Rules"`, …) — reconcile with the owner before deleting.
- 🟡 **192 non-Default story exports (~22%) lack the JSDoc caption** the `storybook-story` skill
  mandates. At that rate the rule isn't being held — either promote it to CLAUDE.md with a check, or
  relax the skill.
- 🟡 `groupType.tsx` tab `label: "General"` un-wrapped in `i18n.t()` (every sibling wraps it).

## 11. Dead / orphaned surface (candidates for deletion)

- The `CardDisplayRule` trio (`types/src/index.ts:3417,3454,3468`) — zero references, and the
  interface still documents the removed layered-merge model (actively misleading). A stale comment
  in `middleware/services/entityLayouts.ts:64` references the nonexistent
  `ensureDefaultCardDisplayRule`.
- The shadow `LANGUAGE_USAGE_OWNER_TYPES` in `middleware/src/db/schema.ts:482` — 11 entries, zero
  references, self-contradicting doc comment (says "six", lists eleven, prose names a third set).
  CLAUDE.md documents the duplicate; it has drifted further and can simply be deleted.
- `AutofillField` / `AutofillOperator` (`types/src/index.ts:3093,3096`) — "retained for existing
  references" with zero existing references. `isCardBodyZone` (`:2274`) — dead helper.
- `AttachOrphanInput`, `PromoteTagInput`, `DemoteTaxonomyInput`, `UpdateHomepageFilterInput` —
  payload types for *live* endpoints whose routes hand-declare inline schemas instead of importing
  them (see proposed convention C-9).
- Three dormant drawer-era app-settings slices plumbed end-to-end with zero UI consumers:
  `panelPinned`, `drawerUnpinnedBreakpoints`, `sidebarOpenModifier` (each = DB column + schema enum +
  service + hook default). CLAUDE.md calls them "dormant orphans"; they're full vertical slices.
- `listingPage.hasFilters` (written, never read) and the `ToolbarMobile` `"standalone"` variant.
- `AutofillRuleForm`'s submit path is now story-only (no production consumer).

## 12. CLAUDE.md corrections (doc drifted from code)

1. **"Filter location" palette category** (L~1441) — feature doesn't exist; delete the bullet.
2. **`_hub` strip** — documented as `Bookmarks | Gallery | Media | Info`; no hub has a Media tab and
   no `_hub.media.tsx` exists (also fix the `ListingHubLayout.tsx:20` docblock).
3. **`BOOKMARK_ADD_FORM_STANDARD_FIELDS` contents** — doc lists `languageId`/`groupId` (not in the
   tuple) and omits `secondaryUrl`; "the six default to Hidden" no longer matches the 14-entry tuple.
4. **Layout-kind count** — "21 workbench kinds + bookmark" should be "19 workbench kinds +
   `bookmark` + `taxonomy-term` = 21" (also in `types/src/entityLayouts.ts:22`; the test file has it
   right).
5. **File pointers**: `breadcrumbsForPath()` is in `routes/-appHeaderCrumbs.tsx` (not
   `-appHeader.tsx`); `FAVORITABLE_KINDS` is in `lib/favoriteEntityConfig.ts` (not
   `useFavoriteToggle.ts`); `starredPaletteField` is in `lib/starredPaletteField.ts` (not
   `entityPaletteRegistry.ts`); `STANDARD_CARD_FIELDS` is in `lib/bookmarkCardFieldDefs.ts` (not
   `bookmarkCardFields.ts` — also fix `middleware/services/cardDisplayDefaults.ts:6`).
6. **`taxonomyEditLink`** — soften "a new entity gets it from the length-based guard, no per-entity
   branch"; it is a per-entity `case` (or better: fix the code per §8 and keep the claim).
7. **`ErrorCode` union location** — it lives in the middleware, not `@eesimple/types`.

### Stale skill content

`add-condition-type` (dead `components/panel/AutofillRulePanel.tsx`), `scope-autofill` +
`filterable-facet` (dead `panel/AutofillRuleForms.tsx`; `usePanelControls`/`lib/drawerSearch` gone;
`filterSidebarVisibility.ts` renamed to `filterVisibility.ts` — also stale in
`decompose-over-cap` ×2), `listing-table-view` + `standard-listing-card` (dead
`panel/useEditPanelClick.ts`; drawer-era instructions), `surface-entity-field` (`lib/api.ts` doesn't
exist — it's `lib/api/<entity>.ts`), `what-not-to-test` + `vitest-node-environment` (cite the
removed `bookmarkDetailSections` test as a live precedent), `listing-header-create` ("Right Drawer
Toggle / PanelRight" no longer in the live toolbar).

---

## 13. Conventions that need establishing

Recurring, real patterns (3+ occurrences) with no written rule — proposed additions:

**C-1. Tuple-backed unions as the default (highest value).** The derived-tuple rule covers 4 tuples;
~37 other exported string unions are literal `"a" | "b"` types whose wire schemas hand-repeat the
members (~25 confirmed mirror pairs — `BooleanLabelPreset`, `ConditionMatchField/Operator`, the six
`CardZone*` unions, `HomepageContentWidth`, `SortDirection`, `ImportRuleAction` ×2 client copies, …).
Rule: *any string union crossing a package boundary is an `as const` tuple + `typeof T[number]`;
wire schemas spread the tuple.*

**C-2. The three polymorphic owner-cleanups.** CLAUDE.md names two (`deleteLanguageUsagesForOwner`,
`deleteTaxonomyAssignmentsForOwner`); `deleteEntityNamesForOwner` is a third, called in 8+ delete
services, undocumented. Also write down the `if (ownerType === "bookmark") invalidateBookmarkCache()`
idiom (uniform across all three polymorphic value services) and the `bookmarkCacheVersion`
circular-import dodge. And add the **descendant rule** from finding 1.3: a cascade delete of a tree
must run the owner-cleanups for the whole subtree, not just the root.

**C-3. One shared image-grab error helper.** Five routes copy-paste near-identical
`IMAGE_GRAB_ERROR_MESSAGES` maps with three envelope shapes among them. A shared
`imageGrabErrorBody(kind, noun)` emitting the full envelope fixes the shape drift and the
`ErrorCode` leak at once.

**C-4. S3 object-key read-before-cascade ordering.** Three delete services carry private comments
re-explaining "read the image key before the cascade, deleteObject after". Write it down once.

**C-5. A collection auto-save primitive.** Three near-identical hand-rolled "debounced
whole-collection save with a `JSON.stringify` savedRef" implementations
(`useBookmarkPropertiesForm`, `LanguageUsagesTab`, `EntityNamesTab`) plus two more variants
(`useSectionAutoSave`, `useDebouncedSettingsForm`). Extract `useCollectionAutoSave` and give it the
same CLAUDE.md standing `useFieldAutoSave` has.

**C-6. When a whole-bookmark-cache read is acceptable.** 22 `useBookmarks()` call sites on
non-listing surfaces with no rule governing them; plus three independent whole-list → bookmark-picker
implementations (`BookmarkRelationshipsEditor`, `BookmarkMediaLinkField`, `settings.relationships`)
that deserve one shared component/endpoint.

**C-7. An explicit sanctioned-derivation list.** Six modules self-grant the "sanctioned client-side
derivation" exception (§5). Give the exception an enumerated list or a criterion, or the phrase will
keep spreading.

**C-8. Settings-manager mutations always toast.** Same inline-rename UI, opposite behavior
(`LanguageUsageLevelsManager` toasts; `PlaceTypesCard`/`LocationRelationsCard` don't).

**C-9. Route body types come from `@eesimple/types` or don't get declared there.** Five payload
types describe live endpoints that never import them — the mechanism that manufactures type orphans.

**C-10. New types go in a domain module; `index.ts` is a barrel.** `types/src/index.ts` is 4,013
lines (24% of the package) and is where every orphan found lives; the domain-split files are
near-clean. (Card display alone would be a natural `cardDisplay.ts`.)

**C-11. Registry completeness tests.** The clean-today registries are clean by discipline only. Add
set-equality tests for the cross-package pairs (`LAYOUT_DRIVEN_ENTITIES` ↔
`LAYOUTABLE_ENTITY_KINDS`, `STANDARD_CARD_FIELDS` ↔ `STANDARD_CARD_FIELD_KEYS`), a
`satisfies Record<SidebarItemKey, …>` on `useSidebarFlyoutConfigs`, key-coverage assertions for
`-appHeaderNames` prefixes, and — after deriving `taxonomyEditLink` from `ENTITY_ROUTES` — the
three-way pin/create lists (`PINNABLE_KINDS` ↔ `resolvePinContext`, `CREATE_ITEMS` ↔ `CreateKind`
↔ listing `createLabel`s, both already drifted). Also a route-tree walk asserting every live
`/settings/**` leaf resolves via `findSettingsPage` (the blind spot behind 1.9).

**C-12. Promote the i18n toolchain into CLAUDE.md.** A 4,213-key surface with three scripts
(`i18n:extract`/`status`/`check-stale`), a dedicated advisory CI job, and the owner-authored-
translation rule — currently documented only in a skill, mentioned once in CLAUDE.md in passing.
The "CI is advisory, nothing fails on a missed `t()`" fact is why the §10 misses shipped.

**C-13. UI micro-primitives.** Hand-rolled with no shared component: "← Back to X" links (30×, in
tension with the breadcrumbs rule), inline `"Loading…"` text (49× while `ui/skeleton` has 2
consumers), inline empty states (24×), "X not found" fallbacks (43× in two shapes), and a third
card token (`rounded-md border bg-card` drag-chip, 5×) that CLAUDE.md's two-use card taxonomy
doesn't cover.

**C-14. Deprecation sunset.** `@deprecated … retained for existing references` with zero references
(2 confirmed): rule = verify refs are 0, then delete.

**C-15. One toast-mock seam in tests.** Pick the seam (spy helper or the real `notificationStore`)
and migrate the 21 files mocking three different layers.

---

## Clean bill of health

For the record, these documented conventions were audited and found fully intact: composite
uniques as `uniqueIndex()` (with exemplary inline comments), `migrate.ts` single-statement rule
(58/58), boot ordering (`listen` before data-steps), all three `removeAdditional` schema
spot-checks (the `CardFieldPlacement` `satisfies` guard being the strongest), `.js` extensions and
barrel discipline in `@eesimple/types`, the shared-logic rule, breadcrumb single-sourcing, workbench
descriptor discipline (all 21 + bookmark), the Hierarchy-tab rule, the `_hub` pattern, the edit-icon
rule, the import cap and its exemption list, conventional commits (60/60), generated-file
discipline, and the `ja.json` never-machine-translate rule.
