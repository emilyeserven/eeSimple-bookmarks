import type {
  PlaceTypeColorConfig,
  PlaceTypeDisplayConfig,
  PlaceTypeIconConfig,
  PlaceTypeLevelGroupConfig,
} from "@eesimple/types";

import { expandLevelGroupsToDisplayConfig } from "@eesimple/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";

const LOCATION_DISPLAY_KEY = ["app-settings", "location-display"] as const;
const LOCATION_LEVEL_GROUPS_KEY = ["app-settings", "location-level-groups"] as const;
/** Stable empty fallback so `useLocationLevelGroups()` keeps a constant reference while loading. */
const EMPTY_LEVEL_GROUPS: PlaceTypeLevelGroupConfig = [];
const PLACE_TYPE_ICONS_KEY = ["app-settings", "place-type-icons"] as const;
/** Stable empty fallback so `useLocationPlaceTypeIcons()` keeps a constant reference while loading. */
const EMPTY_PLACE_TYPE_ICONS: PlaceTypeIconConfig = {};
const PLACE_TYPE_COLORS_KEY = ["app-settings", "place-type-colors"] as const;
/** Stable empty fallback so `useLocationPlaceTypeColors()` keeps a constant reference while loading. */
const EMPTY_PLACE_TYPE_COLORS: PlaceTypeColorConfig = {};

/**
 * The per-placeType map display config (Settings → Locations + the map "Levels" overlay). A sparse
 * Record keyed by normalized placeType; an unconfigured place type uses the legacy area-or-pin
 * default (see `resolveLocationDisplay` in `@eesimple/types`).
 */
export function useLocationDisplaySettings() {
  return useQuery({
    queryKey: LOCATION_DISPLAY_KEY,
    queryFn: appSettingsApi.getLocationDisplay,
  });
}

/**
 * The named place-type level groups (Settings → Locations + the map "Levels" overlay) — the source of
 * truth the UI edits. The per-placeType config the map/sort consume is **derived** from this.
 */
export function useLocationLevelGroupsSettings() {
  return useQuery({
    queryKey: LOCATION_LEVEL_GROUPS_KEY,
    queryFn: appSettingsApi.getLocationLevelGroups,
  });
}

export function useUpdateLocationLevelGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceTypeLevelGroupConfig) =>
      appSettingsApi.updateLocationLevelGroups(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(LOCATION_LEVEL_GROUPS_KEY, saved);
    },
  });
}

/** The resolved level groups, defaulting to an empty list while loading. */
export function useLocationLevelGroups(): PlaceTypeLevelGroupConfig {
  const {
    data,
  } = useLocationLevelGroupsSettings();
  return data ?? EMPTY_LEVEL_GROUPS;
}

/**
 * The resolved per-placeType display config the map renderer and the place-type tree sort consume.
 * Derived from the named level groups (each member inherits its group's settings); falls back to the
 * legacy per-placeType config while no groups are configured.
 */
export function usePlaceTypeDisplayConfig(): PlaceTypeDisplayConfig {
  const groups = useLocationLevelGroups();
  const {
    data: legacy,
  } = useLocationDisplaySettings();
  return groups.length > 0 ? expandLevelGroupsToDisplayConfig(groups) : (legacy ?? {});
}

/**
 * The per-placeType map-pin icon overrides (Settings → Locations "Place Type Icons") — a sparse map of
 * placeType key → Lucide icon name the map renderer reads to draw a glyph inside each pin.
 */
export function usePlaceTypeIconsSettings() {
  return useQuery({
    queryKey: PLACE_TYPE_ICONS_KEY,
    queryFn: appSettingsApi.getPlaceTypeIcons,
  });
}

export function useUpdatePlaceTypeIcons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceTypeIconConfig) => appSettingsApi.updatePlaceTypeIcons(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(PLACE_TYPE_ICONS_KEY, saved);
    },
  });
}

/** The resolved per-placeType icon overrides, defaulting to an empty map while loading. */
export function useLocationPlaceTypeIcons(): PlaceTypeIconConfig {
  const {
    data,
  } = usePlaceTypeIconsSettings();
  return data ?? EMPTY_PLACE_TYPE_ICONS;
}

/**
 * The per-placeType map color overrides (Settings → Locations "Pin Style") — a sparse map of
 * placeType key → `#rrggbb` hex color the map renderer reads to override that place type's pin/area
 * color, winning over the level group's color.
 */
export function usePlaceTypeColorsSettings() {
  return useQuery({
    queryKey: PLACE_TYPE_COLORS_KEY,
    queryFn: appSettingsApi.getPlaceTypeColors,
  });
}

export function useUpdatePlaceTypeColors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceTypeColorConfig) => appSettingsApi.updatePlaceTypeColors(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(PLACE_TYPE_COLORS_KEY, saved);
    },
  });
}

/** The resolved per-placeType color overrides, defaulting to an empty map while loading. */
export function useLocationPlaceTypeColors(): PlaceTypeColorConfig {
  const {
    data,
  } = usePlaceTypeColorsSettings();
  return data ?? EMPTY_PLACE_TYPE_COLORS;
}
