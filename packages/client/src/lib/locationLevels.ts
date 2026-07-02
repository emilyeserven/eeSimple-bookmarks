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
 * group broader (`above`) or narrower (`below`) than it. Anchors expand independently — two anchors
 * with different `levelMode`s each contribute their own broader/narrower set — so a bookmark tagging
 * locations of different levels can show a different scope around each one.
 */
function expandAnchorsByOwnMode(
  groups: PlaceTypeLevelGroup[],
  anchors: PlaceTypeLevelGroup[],
): Set<string> {
  const ids = new Set<string>();
  for (const anchor of anchors) {
    ids.add(anchor.id);
    const mode = anchor.levelMode ?? DEFAULT_LOCATION_MAP_LEVEL_MODE;
    if (mode === "above") {
      for (const group of groups) if (group.sortOrder < anchor.sortOrder) ids.add(group.id);
    }
    else if (mode === "below") {
      for (const group of groups) if (group.sortOrder > anchor.sortOrder) ids.add(group.id);
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
 * A group with `visible: false` is dropped from the result **in addition to** the scope computation
 * above — it stays excluded from a main-map default, from an "above"/"below" expansion that would
 * otherwise have pulled it in, and even as an anchor/current level itself. This is the per-group
 * "visible by default" override (`LevelGroupEditRow`'s "Visible by default" checkbox): it lets a
 * level (e.g. "Country") be excluded from every default computation — "show everything above, but
 * don't show countries" — without touching the `levelMode`/`showOnMainMap` "Show" settings. It only
 * affects **defaults**; a map's per-map Levels overlay checkbox can still turn the level back on for
 * that one map. Pure — unit-tested.
 */
export function computeVisibleLevelGroupIds(
  groups: PlaceTypeLevelGroup[],
  scope: LevelScope,
): Set<string> {
  const dropHidden = (ids: Set<string>): Set<string> => {
    const hiddenIds = new Set(groups.filter(group => group.visible === false).map(group => group.id));
    return new Set([...ids].filter(id => !hiddenIds.has(id)));
  };
  if (scope.kind === "main") {
    return dropHidden(new Set(groups.filter(group => group.showOnMainMap !== false).map(group => group.id)));
  }
  const anchors = resolveAnchorGroups(groups, scope);
  // No anchor (viewed type belongs to no group / no tagged locations) → show every visible group.
  if (anchors.length === 0) return dropHidden(new Set(groups.map(group => group.id)));
  return dropHidden(expandAnchorsByOwnMode(groups, anchors));
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
