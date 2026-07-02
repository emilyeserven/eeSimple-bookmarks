---
name: locations-map
description: >-
  Understand and safely change the Locations map subsystem in eeSimple Bookmarks — map rendering, the
  "Levels" overlay (which location levels show and how each renders), place-type level groups, and the
  geocoding fallback chain. Use when asked to "fix the location map / Levels overlay", "change which
  levels show on a map", "add/rename/remove a level group control", "the map shows the wrong
  levels/checkboxes", "a level checkbox is disabled/enabled wrongly", "dedupe the map tree", "change
  how place types map to levels", "add a geocoding source / fix a boundary lookup", or before touching
  any `Location*Map*` / `locationLevels` / `*eocod*` file. Distills the model behind the corrective PRs
  (#794/#804/#811/#813/#814/#815/#832) so a change checks against the spec instead of re-deriving it.
  Also covers maintaining the subsystem — "the two Levels overlays disagree", "a per-map toggle
  persists globally by mistake", "the overlay is stale on mobile".
---

# Work on the Locations map subsystem

This is the codebase's most-churned area, historically fixed one symptom at a time because the state
model was never written down. **The spec now lives in the top-of-file doc block of
`packages/client/src/lib/locationLevels.ts` — read it first**; this skill is the map of where each part
lives and the recipes/gotchas for changing it. Everything here is faithful to that doc block; if the
two ever disagree, the doc block wins (fix this file).

The subsystem is cleanly layered:

- **Pure logic** — `packages/client/src/lib/locationLevels.ts` (levels/anchors/visibility, unit-tested
  in `locationLevels.test.ts`) and the shared types + resolvers in `packages/types/src/locations.ts`.
- **Stateful hooks** — `hooks/useLocationLevels.ts` (the server read/write hub), `hooks/useMapLevelMode.ts`
  (the "Show" mode), `hooks/useLocationMapLevelControls.ts` (assembles per-map controls).
- **Container** — `components/LocationMapSection.tsx`.
- **Overlays** — `components/LocationLevelsOverlay.tsx` (mobile popover) + `components/LocationLevelsMapPanel.tsx`
  (desktop floating panel), sharing `components/locationLevelsShared.tsx`.
- **Renderer** — `components/LocationMap.tsx` (Leaflet).
- **Geocoding (middleware)** — `services/geocoding.ts` → `services/nominatimGeocoding.ts` /
  `services/wikidataGeocoding.ts`.

## A. The Levels-overlay state model

Four concepts; the doc block in `locationLevels.ts` is the authority.

- **Level group** (`PlaceTypeLevelGroup`, `@eesimple/types`): a named, ordered (`sortOrder`, **lower =
  broader**) bucket of normalized `placeType` keys, with `displayMode` (pin/area), `color`, `visible`
  ("visible by default"), `showOnMainMap`, `levelMode` (above/current/below). The array is persisted on
  the `app_settings` singleton and is the single source of truth. **Never hand-list place types or
  invent a parallel level ordering** — groups + `sortOrder` are it.
- **Scope** (`LevelScope`): `main` | `location{currentPlaceType}` | `bookmark{placeTypes}`. A non-`main`
  scope resolves **anchor** groups (`resolveAnchorGroups` / `findAnchorGroup`) — the group(s) owning the
  viewed/tagged place type(s) — and expands each up/down per **its own** `levelMode`
  (`expandAnchorsByOwnMode`). No anchor ⇒ show all groups. This is `computeVisibleLevelGroupIds`.
- **Visibility layering** — `visibleIds = (overrideIds ?? defaultVisibleIds) ∩ populatedIds`, composed by
  the pure `resolveVisibleLevelGroupIds`. `defaultVisibleIds` = `computeVisibleLevelGroupIds` minus
  `visible:false` groups; `overrideIds` = temporary per-map checkbox tweaks; `populatedIds` =
  `computePopulatedLevelGroupIds` (a group with a plotted node of its type **plus its broader
  ancestors**). A group not in `populatedIds` is disabled and can never show — this is the rule
  #811/#814 kept re-touching; change it only in `computePopulatedLevelGroupIds` and extend its tests.
- **Three persistence tiers** (the subtle part): **server/global** = the group config itself (pin/area,
  color, `levelMode`, `visible`, `showOnMainMap`), written through `useLocationLevels` with a toast, on
  *every* map; **uiStore/per-device** = map collapse + `hideLocationMapAdminBorders`; **session/local** =
  `overrideIds` + the anchor-less `fallbackMode`. **On one overlay row the visibility checkbox is a
  throwaway per-map override while the pin/area toggle beside it is a global server write — do not unify
  them.**

Two distinct prune operations, often conflated in past fixes: **filter-pruning**
(`selectedSubtrees(tree, filterIds)` in `LocationMapSection`) keeps selected nodes *with subtrees*;
**placeType-flattening** (`filterTreeByPlaceType`, `collectMapped`) *drops* hierarchy because a placeType
filter crosses branches. They are not interchangeable.

## B. Map render pipeline

`LocationMapSection` (the orchestration hub) → `useLocationMapLevelControls(scope, plottedTree, …)` →
`LocationMap`. The hook is the brain: it normalizes the churning `scope` prop into **one** memoized
`normalizedScope` keyed on a `scopeKey` string (callers rebuild `scope` inline every render, so
everything downstream depends on the stable normalized value, never the prop reference), then derives
`defaultVisibleIds` / `populatedIds` / `visibleIds` / `displayConfig` and the `LevelsControls` object.
`useMapLevelMode(scope, groups)` resolves the persisted "Show" mode from the anchor(s) and writes a
change through to *every* anchor (a bookmark can have several); an anchor-less map falls back to session
`fallbackMode`. `LocationMap` turns the resulting `displayConfig` + tree into Leaflet markers/polygons
(`collectMapped` → `toRenderItems`), swapping the tile layer to a borderless CARTO style when
`hideAdminBorders`.

**When adding a per-map control**, thread it through `LevelsControls` (`lib/locationLevels.ts`), assemble
it in `useLocationMapLevelControls`, and render it in the shared `LevelsFooter` — not in each overlay.

## C. Place-type level groups & Settings surfaces

A **place type** is a raw Nominatim/Wikidata string on `Location.placeType`, normalized via
`placeTypeKey`. `expandLevelGroupsToDisplayConfig` (`@eesimple/types`) flattens groups into a per-placeType
`PlaceTypeDisplayConfig` (lowest-`sortOrder` group wins on overlap). Icons/colors are stored **per place
type** (`PlaceTypeIconConfig`/`PlaceTypeColorConfig`), not per group, so members of one group can still
render distinctly. Settings surfaces: `settings.locations.level-groups.tsx` → `LocationLevelGroupsSettings`
(rows via `LevelGroupEditRow`, the "Visible by default" + "Show" mode controls), `settings.locations.place-types.tsx`,
`settings.locations.pin-style.tsx`. All group edits go through `useLocationLevels` — never PUT the
`app_settings` group array directly.

## D. Geocoding fallback chain (middleware, keyless & self-hostable)

`geocodeLocation(query, {source?})` (`services/geocoding.ts`): Nominatim first; **empty result ⇒
`wikidataGeocode`** (traditional/informal/natural regions with no admin boundary). A location flagged
`usesWikidataCoordinates` passes `source:"wikidata"` and skips Nominatim. Wikidata boundary resolution is
two-tier (`resolveBoundary` in `wikidataGeocoding.ts`): a **Kartographer geoshape** when the item links
`P402`/`P3896`, else **composed** from `P150` constituents geocoded via Nominatim (which is why
`wikidataGeocoding.ts` depends on `nominatimGeocoding.ts` — kept split to avoid a cycle). Boundaries are
backfilled on first view by `refreshLocationBoundary` (client `hooks/useAutoRefreshLocationBoundary.ts`,
wired via `LocationMapSection`'s `autoRefreshLocationId`). Both paths return the same
`LocationLookupResult`, so callers don't branch. To add a source, see the **`add-connector`** skill's
shape; keep the empty-then-fallback ordering and only let the search query leave the box (endpoints are
overridable: `NOMINATIM_ENDPOINT` / `WIKIDATA_ENDPOINT` / `WIKIMEDIA_MAPS_ENDPOINT`).

## Verify

```
pnpm --filter=@eesimple/client test -- locationLevels    # pure levels/visibility helpers
pnpm typecheck                                            # strict, whole workspace
pnpm --filter=@eesimple/client test                      # overlays/stories still render
pnpm lint:fix                                             # always from repo ROOT
pnpm fallow                                               # LocationMapSection / locationLevels are advisory targets — don't regress
```

Then `pnpm dev` and exercise all three scopes:
- **`location`** — a location detail page (`/taxonomies/locations/$slug`): the overlay lists groups;
  a checkbox toggle changes only that map; the above/current/below "Show" toggle persists and re-syncs
  the checkboxes; empty groups stay disabled; "Only direct ancestors/children" works.
- **`bookmark`** — a bookmark tagging locations of different levels: each anchor expands per its own mode;
  changing the mode writes to every anchor.
- **`main`** — the Place Types listing map: only `showOnMainMap` groups show; a `visible:false` group is
  hidden by default but re-enableable per-map.
- The desktop floating panel and the mobile popover render the same list + footer (both consume
  `locationLevelsShared.tsx`).

## Maintaining the subsystem

- **A level-row or footer change** goes in `components/locationLevelsShared.tsx` (`LevelGroupGlyph` /
  `LevelsFooter`) — it lands in both overlays at once. Don't edit one overlay's markup in isolation; that
  divergence is exactly the churn this subsystem is being pulled out of.
- **"Wrong levels show" / "checkbox disabled wrongly"** is always in the pure helpers, never the
  components: `computeVisibleLevelGroupIds` (defaults), `computePopulatedLevelGroupIds` (enable/disable),
  or `resolveVisibleLevelGroupIds` (composition). Add the failing case to `locationLevels.test.ts` before
  fixing — those tests encode #811/#813/#814/the `visible:false` rules.
- **"A per-map toggle persisted globally" (or vice-versa)** is a persistence-tier mix-up — re-read tier
  list in §A and the `locationLevels.ts` doc block. Visibility checkbox = local override; pin/area,
  color, "Show" mode = global server write.
- **Scope identity churn / stale memo** — never depend on the raw `scope` prop; derive from
  `normalizedScope`/`scopeKey` in `useLocationMapLevelControls`.
- **Hierarchy tab / entity plumbing** for Locations as a slug-routed taxonomy is a *separate* concern —
  see **`add-entity`** and **`tabbed-pages`**. Making Locations a filter facet is **`filterable-facet`**.
  Complexity cleanups on `LocationMapSection` / `LocationMap` follow **`decompose-over-cap`**.
