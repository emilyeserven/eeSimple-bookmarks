import type { LocationMapLevelMode } from "../stores/uiStore";
import type { LocationNode, PlaceTypeLevelGroup } from "@eesimple/types";

import { placeTypeKey } from "@eesimple/types";

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
 * How a given map decides which level groups are visible by default:
 * - `main`: the all-locations index map — the groups flagged "Show by default on main map".
 * - `location`: a specific place's pages — relative to the **current** group (the one containing the
 *   viewed place's own place type), expanded up/down per the shared {@link LocationMapLevelMode}.
 * - `bookmark`: a bookmark's locations map — relative to the **current** groups (every group
 *   containing one of the bookmark's tagged locations' place types — there can be several, since a
 *   bookmark may tag locations of different levels), expanded up/down per an
 *   {@link LocationMapLevelMode} that defaults to `"current"` and is **not** shared with location
 *   pages — same expansion rules as `location` but with multiple anchors and its own mode state.
 */
export type LevelScope
  = | { kind: "main" }
    | { kind: "location";
      currentPlaceType: string | null; }
      | { kind: "bookmark";
        placeTypes: string[]; };

/**
 * The per-map level controls handed to the "Levels" overlays. Visibility is a **temporary per-map
 * override** (it does not write the shared/global group config); the `levelMode` button group is the
 * shared control and is omitted (button group hidden) on maps without a "current" level.
 */
export interface LevelsControls {
  /** Group ids currently shown on this map. */
  visibleIds: Set<string>;
  /** Toggle one group's visibility for this map only. */
  onToggleVisible: (id: string, visible: boolean) => void;
  /** Shared above/current/below mode; omitted hides the button group (the main map only). */
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
 * The set of level-group ids a map shows by default, given its scope and the shared level mode.
 *
 * For a `location` scope the **current** group (the one whose `placeTypes` contains the viewed
 * place's own place type) is always included; `above` adds every broader group (lower `sortOrder`)
 * and `below` adds every narrower group (higher `sortOrder`). When the viewed place's type belongs
 * to no group there is no anchor, so every group is shown (avoids an empty map).
 *
 * A `bookmark` scope generalizes this to **multiple** anchors — every group containing one of the
 * bookmark's tagged locations' place types. `current` shows just those anchor groups; `above` adds
 * every group broader than the broadest anchor; `below` adds every group narrower than the
 * narrowest anchor. No anchors (no tagged location's type belongs to any group) falls back to every
 * group, same as `location`. Pure — unit-tested.
 */
export function computeVisibleLevelGroupIds(
  groups: PlaceTypeLevelGroup[],
  scope: LevelScope,
  mode: LocationMapLevelMode,
): Set<string> {
  if (scope.kind === "main") {
    return new Set(groups.filter(group => group.showOnMainMap !== false).map(group => group.id));
  }
  if (scope.kind === "bookmark") {
    const anchorKeys = new Set(
      scope.placeTypes.map(placeTypeKey).filter(key => key !== ""),
    );
    const anchors = groups.filter(group => group.placeTypes.some(pt => anchorKeys.has(pt)));
    if (anchors.length === 0) return new Set(groups.map(group => group.id));
    const ids = new Set<string>(anchors.map(group => group.id));
    if (mode === "above") {
      const minSortOrder = Math.min(...anchors.map(group => group.sortOrder));
      for (const group of groups) if (group.sortOrder < minSortOrder) ids.add(group.id);
    }
    else if (mode === "below") {
      const maxSortOrder = Math.max(...anchors.map(group => group.sortOrder));
      for (const group of groups) if (group.sortOrder > maxSortOrder) ids.add(group.id);
    }
    return ids;
  }
  const currentKey = placeTypeKey(scope.currentPlaceType);
  const current = currentKey === ""
    ? undefined
    : groups.find(group => group.placeTypes.includes(currentKey));
  if (!current) return new Set(groups.map(group => group.id));
  const ids = new Set<string>([current.id]);
  if (mode === "above") {
    for (const group of groups) if (group.sortOrder < current.sortOrder) ids.add(group.id);
  }
  else if (mode === "below") {
    for (const group of groups) if (group.sortOrder > current.sortOrder) ids.add(group.id);
  }
  return ids;
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
