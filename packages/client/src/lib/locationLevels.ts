import type { LocationMapLevelMode } from "../stores/uiStore";
import type { PlaceTypeLevelGroup } from "@eesimple/types";

import { placeTypeKey } from "@eesimple/types";

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
 * - `bookmark`: a bookmark's locations map — always every group (show all tagged levels).
 */
export type LevelScope
  = | { kind: "main" }
    | { kind: "location";
      currentPlaceType: string | null; }
      | { kind: "bookmark" };

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
  /** Shared above/current/below mode; omitted hides the button group (main + bookmark maps). */
  levelMode?: LocationMapLevelMode;
  onLevelModeChange?: (mode: LocationMapLevelMode) => void;
}

/**
 * The set of level-group ids a map shows by default, given its scope and the shared level mode.
 *
 * For a `location` scope the **current** group (the one whose `placeTypes` contains the viewed
 * place's own place type) is always included; `above` adds every broader group (lower `sortOrder`)
 * and `below` adds every narrower group (higher `sortOrder`). When the viewed place's type belongs
 * to no group there is no anchor, so every group is shown (avoids an empty map). Pure — unit-tested.
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
    return new Set(groups.map(group => group.id));
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
