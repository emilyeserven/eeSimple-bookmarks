/**
 * # The Locations "Levels-overlay" model
 *
 * This module is the pure, unit-tested core of the map "Levels" overlay — the little panel that
 * decides which location levels show on a map and how each renders. It has no React and no I/O;
 * `hooks/useLocationMapLevelControls.ts` wires it to state and `components/LocationMap*.tsx` render
 * the result. Read this before touching the subsystem — it is the spec the corrective PRs
 * (#794/#804/#811/#813/#814/#815) each lacked. The companion `.claude/skills/locations-map` skill
 * covers the whole subsystem (rendering, place types, geocoding); this block is just the state model.
 *
 * ## Level group
 * A `PlaceTypeLevelGroup` (`@eesimple/types`) is a named, ordered bucket of normalized `placeType`
 * keys — e.g. "Country" = `{country}`, "City" = `{city, town, …}`. `sortOrder` orders them, **lower =
 * broader** (Country before City). Each group carries a `displayMode` (pin/area), `color`, a `visible`
 * "visible by default" override, a `showOnMainMap` flag, and a `levelMode` (above/current/below). The
 * groups array is the single source of truth, persisted on the `app_settings` singleton and read/written
 * through `hooks/useLocationLevels.ts` (shared with Settings → Locations → Level Groups).
 *
 * ## Scope + anchors
 * Every map declares a {@link LevelScope}: `main` (the all-locations index map), `location` (a place's
 * own pages — carries that place's `currentPlaceType`), or `bookmark` (a bookmark's map — carries its
 * tagged locations' `placeTypes`). A non-`main` scope resolves **anchor** groups
 * ({@link resolveAnchorGroups} / {@link findAnchorGroup}): the group(s) owning the viewed/tagged place
 * type(s). Each anchor then expands up or down per **its own** `levelMode`
 * ({@link expandAnchorsByOwnMode}) — a `bookmark` can anchor on several differently-leveled groups, each
 * expanding independently. No anchor ⇒ show every group (avoids an empty map). See
 * {@link computeVisibleLevelGroupIds}.
 *
 * ## Visibility layering
 * The set a map actually shows is a three-layer composition (see {@link resolveVisibleLevelGroupIds}):
 *
 *     visibleIds = (overrideIds ?? defaultVisibleIds) ∩ populatedIds
 *
 * - `defaultVisibleIds` = {@link computeVisibleLevelGroupIds} for the scope. For an anchored scope this
 *   is each anchor's `levelMode` expansion minus that anchor's `defaultHiddenGroupIds` — the per-anchor
 *   "which levels show by default when this is the current level" checklist (Settings → Level Groups).
 * - `overrideIds` = the user's temporary per-map checkbox tweaks (null until they touch a checkbox).
 * - `populatedIds` = {@link computePopulatedLevelGroupIds}: groups with a plotted node of their own type
 *   **plus** their broader ancestors; everything else is disabled so it can never show.
 *
 * ## Three persistence tiers (the part that trips fixes)
 * State lives at three different lifetimes, and two controls sitting on the **same overlay row** persist
 * differently — read this before "fixing" an overlay control:
 * - **Server / global** — the level groups themselves (pin/area `displayMode`, `color`, `levelMode`,
 *   `visible`, `showOnMainMap`). The overlay's pin/area toggle, color glyph, and "Show" (level-mode)
 *   button write straight through to these, mutating the same rows as Settings → Locations and firing a
 *   toast — a change here is global, on every map.
 * - **uiStore / per-device** — map collapse state (`collapsedLocationMapKeys`), the desktop Levels-panel
 *   collapse state (`collapsedLocationMapOverlayKeys`, keyed by the same `mapKey`), and
 *   `hideLocationMapAdminBorders` (the "Hide map borders" checkbox).
 * - **Session / local** — `overrideIds` (the per-map visibility checkboxes) and the anchor-less
 *   `fallbackMode`. These reset on scope/mode change and never persist.
 *
 * So on one row the **visibility checkbox** is a throwaway per-map override while the **pin/area
 * toggle** next to it is a global server write. That asymmetry is intentional; don't unify them.
 *
 * ## Two distinct prune operations (don't conflate them)
 * - **Filter-pruning** — `selectedSubtrees(tree, filterIds)` in `LocationMapSection` keeps each selected
 *   node **with its subtree**, focusing the map while preserving hierarchy.
 * - **PlaceType-flattening** — {@link filterTreeByPlaceType} (and `collectMapped` in `LocationMap`)
 *   **drops** hierarchy, because a placeType filter crosses branches (a matching node can sit anywhere).
 * Several corrective PRs conflated these; they are different operations for different jobs.
 */
import type { LocationMapLevelMode, LocationNode, PlaceTypeLevelGroup } from "@eesimple/types";

import { DEFAULT_LOCATION_MAP_LEVEL_MODE, placeTypeKey } from "@eesimple/types";

import { flattenTree } from "./tagTree";

/**
 * The map-filter controls handed to the "Levels" overlays' Filter section: the full location tree
 * (for the hierarchical combobox options), the currently-focused location ids, and a change handler.
 * An empty `filterIds` means the map shows every location.
 */
export interface MapFilterControls {
  /** The full location tree, used to build the hierarchical combobox options. */
  tree: LocationNode[];
  /** Location ids the map is currently focused on (empty = show all). */
  filterIds: string[];
  /** Replace the focused-id set. */
  onFilterChange: (ids: string[]) => void;
}

/** Humanize a normalized placeType key for display (e.g. `state_district` → `State District`). */
export function placeTypeLabel(key: string): string {
  return key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Distinct, non-empty normalized placeType keys present across a set of locations. */
export function discoverPlaceTypeKeys(locations: { placeType: string | null }[]): string[] {
  const keys = new Set<string>();
  for (const loc of locations) {
    const key = placeTypeKey(loc.placeType);
    if (key !== "") keys.add(key);
  }
  return [...keys];
}

/** A discovered place type offered in the level-group assignment UI: its key + humanized label. */
export interface PlaceTypeOption {
  /** Normalized placeType key (the group-membership value). */
  key: string;
  /** Human-readable label. */
  label: string;
}

/**
 * The discovered place types (∪ any already assigned to a group), as label-sorted options for the
 * group assignment control. Passing `assigned` keeps a group's currently-assigned types selectable
 * even if no location currently carries them.
 */
export function placeTypeOptions(
  locations: { placeType: string | null }[],
  assigned: string[] = [],
): PlaceTypeOption[] {
  const keys = new Set<string>([...discoverPlaceTypeKeys(locations)]);
  for (const key of assigned) {
    const normalized = placeTypeKey(key);
    if (normalized !== "") keys.add(normalized);
  }
  return [...keys]
    .map((key): PlaceTypeOption => ({
      key,
      label: placeTypeLabel(key),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Level-group ids whose checkbox should stay enabled on the current map: a group with at least one
 * plotted location (area or pin) of its own place types, **plus every broader (lower `sortOrder`)
 * ancestor group** up to the narrowest directly-populated level. Ancestor groups are included even
 * when their own place type has no separately plotted node — a plotted city's country/region isn't
 * always present as its own node in the tree (e.g. "show ancestors" off, or a filtered subtree that
 * only keeps descendants), but it conceptually still has that parent, so its checkbox shouldn't be
 * force-disabled just because the tree happens not to render it. A group narrower than every
 * directly-populated level (no plotted descendant either) stays disabled. Re-derived fresh from the
 * plotted tree, so a group re-enables the instant its own or a descendant's place type is plotted
 * again (e.g. after navigating to a different bookmark/location). Pure — unit-tested.
 */
export function computePopulatedLevelGroupIds(
  groups: PlaceTypeLevelGroup[],
  locations: { placeType: string | null }[],
): Set<string> {
  const presentKeys = new Set(discoverPlaceTypeKeys(locations));
  const directlyPopulated = groups.filter(group => group.placeTypes.some(pt => presentKeys.has(pt)));
  if (directlyPopulated.length === 0) return new Set();
  const deepestSortOrder = Math.max(...directlyPopulated.map(group => group.sortOrder));
  return new Set(
    groups.filter(group => group.sortOrder <= deepestSortOrder).map(group => group.id),
  );
}

/**
 * Compose the three visibility layers into the set of level-group ids a map actually shows:
 *
 *     visibleIds = (overrideIds ?? defaultVisibleIds) ∩ populatedIds
 *
 * `overrideIds` is the user's temporary per-map checkbox state (null until they touch a checkbox, in
 * which case the {@link computeVisibleLevelGroupIds} default applies); the result is intersected with
 * `populatedIds` ({@link computePopulatedLevelGroupIds}) so a group with nothing plotted can never show
 * even if the default/override would include it. Pure — unit-tested.
 */
export function resolveVisibleLevelGroupIds(
  defaultVisibleIds: Set<string>,
  overrideIds: Set<string> | null,
  populatedIds: Set<string>,
): Set<string> {
  const base = overrideIds ?? defaultVisibleIds;
  return new Set([...base].filter(id => populatedIds.has(id)));
}

/**
 * How a given map decides which level groups are visible by default:
 * - `main`: the all-locations index map — the groups flagged "Show by default on main map".
 * - `location`: a specific place's pages — relative to the **current** group (the one containing the
 *   viewed place's own place type), expanded up/down per that group's persisted
 *   {@link LocationMapLevelMode} (`levelMode`, default `"current"`).
 * - `bookmark`: a bookmark's locations map — relative to the **current** groups (every group
 *   containing one of the bookmark's tagged locations' place types — there can be several, since a
 *   bookmark may tag locations of different levels). Each anchor group expands up/down per **its
 *   own** persisted `levelMode` (default `"current"`), independently of the other anchors — the
 *   same per-group setting a `location` scope reads, generalized to multiple anchors.
 */
export type LevelScope
  = | { kind: "main" }
    | { kind: "location";
      currentPlaceType: string | null; }
      | { kind: "bookmark";
        placeTypes: string[]; };

/**
 * The per-map level controls handed to the "Levels" overlays. Visibility is a **temporary per-map
 * override** (it does not write the shared/global group config); the `levelMode` button group edits
 * the **persisted default** for this map's anchor(s) — the current level group's `levelMode`,
 * whether the map is a place's own pages (one anchor) or a bookmark's map (one or more anchors, all
 * written together) — configurable on Settings → Locations → Level Groups, and omitted (button
 * group hidden) on maps without a "current" level.
 */
export interface LevelsControls {
  /** Group ids currently shown on this map. */
  visibleIds: Set<string>;
  /** Toggle one group's visibility for this map only. */
  onToggleVisible: (id: string, visible: boolean) => void;
  /**
   * Group ids with no plotted areas/pins on this map — their checkbox is shown unchecked and
   * disabled. See {@link computePopulatedLevelGroupIds}.
   */
  disabledIds: Set<string>;
  /** The map's persisted above/current/below "Show" mode; omitted hides the button group (the main map only). */
  levelMode?: LocationMapLevelMode;
  onLevelModeChange?: (mode: LocationMapLevelMode) => void;
  /**
   * Whether the base map tiles' own country/prefecture/state administrative border lines are hidden
   * (switches the tile layer to a borderless style — see {@link LocationMap}). Shared across every
   * location map, mirroring `levelMode`.
   */
  hideAdminBorders: boolean;
  onHideAdminBordersChange: (hide: boolean) => void;
}

/**
 * Controls for the Levels overlay's "Only show direct ancestors/children" toggle — restricts a
 * location detail map's ancestor chain to just the immediate parent and its plotted descendants to
 * just immediate children, instead of the full chain to root / full descendant subtree. Session-only
 * per-map state (not persisted), passed only by maps that have a single "current" location (see
 * `LocationGeneralView`) — omitted elsewhere hides the checkbox.
 */
export interface AncestorChildrenScopeControls {
  /** Whether the map is currently restricted to direct ancestors/children only. */
  onlyDirect: boolean;
  onToggle: (onlyDirect: boolean) => void;
}

/**
 * The **anchor** groups a non-main scope expands around: for a `location` the single group owning
 * the viewed place's type (or none), for a `bookmark` every group containing one of the tagged
 * locations' place types. An empty result signals "no anchor" — the caller shows every group.
 * Exported for {@link useMapLevelMode}, which reads/writes each anchor's own persisted `levelMode`.
 */
export function resolveAnchorGroups(
  groups: PlaceTypeLevelGroup[],
  scope: Exclude<LevelScope, { kind: "main" }>,
): PlaceTypeLevelGroup[] {
  if (scope.kind === "bookmark") {
    const anchorKeys = new Set(scope.placeTypes.map(placeTypeKey).filter(key => key !== ""));
    return groups.filter(group => group.placeTypes.some(pt => anchorKeys.has(pt)));
  }
  const current = findAnchorGroup(groups, scope.currentPlaceType);
  return current ? [current] : [];
}

/**
 * The single level group anchoring a place's pages — the group whose `placeTypes` contains the
 * viewed place's own place type — or `undefined` when the type is blank / belongs to no group.
 * Location detail maps read (and the "Levels" overlay's "Show" button group writes) this group's
 * persisted `levelMode`. Pure — unit-tested.
 */
export function findAnchorGroup(
  groups: PlaceTypeLevelGroup[],
  currentPlaceType: string | null,
): PlaceTypeLevelGroup | undefined {
  const currentKey = placeTypeKey(currentPlaceType);
  return currentKey === ""
    ? undefined
    : groups.find(group => group.placeTypes.includes(currentKey));
}

/**
 * Each anchor plus, per **that anchor's own** persisted `levelMode` (default `"current"`), every
 * group broader (`above`) or narrower (`below`) than it, **minus** that anchor's own
 * `defaultHiddenGroupIds` (the per-anchor "hidden by default" checklist — the anchor's own id may be
 * listed, hiding the current level itself). Anchors expand independently — two anchors with different
 * `levelMode`s each contribute their own broader/narrower set — so a bookmark tagging locations of
 * different levels can show a different scope around each one. The per-anchor sets are then **unioned**,
 * so with several anchors a level A hides can still show if another anchor B's expansion includes it.
 */
function expandAnchorsByOwnMode(
  groups: PlaceTypeLevelGroup[],
  anchors: PlaceTypeLevelGroup[],
): Set<string> {
  const ids = new Set<string>();
  for (const anchor of anchors) {
    const hidden = new Set(anchor.defaultHiddenGroupIds ?? []);
    const add = (id: string): void => {
      if (!hidden.has(id)) ids.add(id);
    };
    add(anchor.id);
    const mode = anchor.levelMode ?? DEFAULT_LOCATION_MAP_LEVEL_MODE;
    if (mode === "above") {
      for (const group of groups) if (group.sortOrder < anchor.sortOrder) add(group.id);
    }
    else if (mode === "below") {
      for (const group of groups) if (group.sortOrder > anchor.sortOrder) add(group.id);
    }
  }
  return ids;
}

/**
 * The set of level-group ids a map shows by default, given its scope.
 *
 * For a `location` scope the **current** group (the one whose `placeTypes` contains the viewed
 * place's own place type) is always included; its own persisted `levelMode` then adds every broader
 * group (`above`, lower `sortOrder`) or every narrower group (`below`, higher `sortOrder`). When the
 * viewed place's type belongs to no group there is no anchor, so every group is shown (avoids an
 * empty map).
 *
 * A `bookmark` scope generalizes this to **multiple** anchors — every group containing one of the
 * bookmark's tagged locations' place types — each expanding independently per its own `levelMode`
 * (see {@link expandAnchorsByOwnMode}). No anchors (no tagged location's type belongs to any group)
 * falls back to every group, same as `location`.
 *
 * Each anchor's expansion is then filtered by **its own** `defaultHiddenGroupIds` (the per-anchor
 * checklist edited on Settings → Locations → Level Groups): a level listed there is dropped from that
 * anchor's default set — "show everything above, but not the top 3 levels" — without touching the
 * `levelMode`/`showOnMainMap` "Show" settings, and the anchor may even hide its own current level. The
 * `main` scope has no anchor, so no checklist applies to it (only `showOnMainMap` governs it). This
 * only affects **defaults**; a map's per-map Levels overlay checkbox can still turn a level back on for
 * that one map. Pure — unit-tested.
 */
export function computeVisibleLevelGroupIds(
  groups: PlaceTypeLevelGroup[],
  scope: LevelScope,
): Set<string> {
  if (scope.kind === "main") {
    return new Set(groups.filter(group => group.showOnMainMap !== false).map(group => group.id));
  }
  const anchors = resolveAnchorGroups(groups, scope);
  // No anchor (viewed type belongs to no group / no tagged locations) → show every group.
  if (anchors.length === 0) return new Set(groups.map(group => group.id));
  return expandAnchorsByOwnMode(groups, anchors);
}

/**
 * Prune a location tree to just the nodes whose (normalized) `placeType` is in `keys`, flattening
 * the tree in the process — filtering by place type crosses branches (a matching node can sit
 * anywhere in the hierarchy), so there's no parent/child structure worth preserving; the map only
 * needs each survivor's own point/area. An empty `keys` means "no filter" (returns `nodes` as-is).
 * Pure — used to focus the Place Types listing's map on the place type(s) selected below it.
 */
export function filterTreeByPlaceType(nodes: LocationNode[], keys: Set<string>): LocationNode[] {
  if (keys.size === 0) return nodes;
  return flattenTree(nodes)
    .map(({
      node,
    }) => node)
    .filter(node => keys.has(placeTypeKey(node.placeType)))
    .map(node => ({
      ...node,
      children: [],
    }));
}

/** A place type offered in the location-form picker: its (raw) stored value + humanized label. */
export interface PlaceTypeChoice {
  /** The place type string as stored (becomes the saved `placeType`). */
  value: string;
  /** Human-readable label. */
  label: string;
}

/**
 * Distinct place types across `locations`, as label-sorted combobox choices (raw value + humanized
 * label, deduped case-insensitively). Pass `current` to keep the location's in-use value selectable
 * — with its existing casing — even when no other location carries it, so the picker always shows the
 * active selection (e.g. a freshly geocoded place type not yet shared by another location).
 */
export function placeTypeChoices(
  locations: { placeType: string | null }[],
  current?: string | null,
): PlaceTypeChoice[] {
  // First-seen casing wins per normalized key; seeding `current` first keeps the active value's casing.
  const byKey = new Map<string, string>();
  const add = (raw: string | null | undefined): void => {
    const value = (raw ?? "").trim();
    if (value === "") return;
    const key = placeTypeKey(value);
    if (!byKey.has(key)) byKey.set(key, value);
  };
  add(current);
  for (const loc of locations) add(loc.placeType);
  return [...byKey.values()]
    .map((value): PlaceTypeChoice => ({
      value,
      label: placeTypeLabel(placeTypeKey(value)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
