import type { PlaceTypeDisplayConfig, PlaceTypeDisplaySetting } from "@eesimple/types";

import { placeTypeKey, placeTypeOrder } from "@eesimple/types";

/** A place-type "level" row for the Settings list and the map levels overlay. */
export interface PlaceTypeLevel {
  /** Normalized placeType key (the config key). */
  key: string;
  /** Human-readable label (title-cased, underscores → spaces). */
  label: string;
  /** The resolved setting (the stored config entry, or the legacy default for an unconfigured type). */
  setting: PlaceTypeDisplaySetting;
  /** Whether this level already has an explicit entry in the saved config. */
  configured: boolean;
}

/** The default setting for a place type with no explicit config entry (legacy area-or-pin, visible). */
export function defaultPlaceTypeSetting(key: string, config: PlaceTypeDisplayConfig): PlaceTypeDisplaySetting {
  return {
    displayMode: "area",
    visible: true,
    sortOrder: placeTypeOrder(key, config),
  };
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

/**
 * Merge the place types discovered in the data with the saved config into one ordered list of level
 * rows (configured ∪ discovered), sorted by each level's order then label. The single source the
 * Settings list, the levels overlay, and the placeType sort all read so they agree on the levels.
 */
export function buildPlaceTypeLevels(
  locations: { placeType: string | null }[],
  config: PlaceTypeDisplayConfig,
): PlaceTypeLevel[] {
  const keys = new Set<string>([...Object.keys(config), ...discoverPlaceTypeKeys(locations)]);
  return [...keys]
    .map((key): PlaceTypeLevel => ({
      key,
      label: placeTypeLabel(key),
      setting: config[key] ?? defaultPlaceTypeSetting(key, config),
      configured: key in config,
    }))
    .sort((a, b) => {
      const byOrder = placeTypeOrder(a.key, config) - placeTypeOrder(b.key, config);
      return byOrder !== 0 ? byOrder : a.label.localeCompare(b.label);
    });
}
