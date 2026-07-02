import type { LevelScope } from "../lib/locationLevels";
import type { LocationMapLevelMode, PlaceTypeLevelGroup } from "@eesimple/types";

import { useState } from "react";

import { DEFAULT_LOCATION_MAP_LEVEL_MODE } from "@eesimple/types";

import {
  useBookmarkMapLevelMode,
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "./useAppSettings";
import { useLocationLevels } from "./useLocationLevels";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { findAnchorGroup } from "../lib/locationLevels";

/** Toast label for the bookmark-map "Show" preference (shared by the overlay and Settings). */
export const BOOKMARK_MAP_LEVEL_MODE_LABEL = "Bookmark map levels shown";

/**
 * One map's "Show" (above/current/below) mode + its writer. Reads the **persisted default** for the
 * map's anchor — the current level group's `levelMode` on a place's pages, the
 * `bookmarkMapLevelMode` display preference on a bookmark map — and writes straight through to it
 * with a field-named toast, so the map "Levels" overlay's "Show" button group and Settings →
 * Locations → Level Groups edit the same server-side value. A location map whose place type belongs
 * to no group has no persist target; its mode falls back to session-only local state. The main map
 * has no "Show" group at all (its callers never render the control).
 */
export function useMapLevelMode(
  scopeKind: LevelScope["kind"],
  currentPlaceType: string | null,
  groups: PlaceTypeLevelGroup[],
): {
  levelMode: LocationMapLevelMode;
  setLevelMode: (mode: LocationMapLevelMode) => void;
} {
  const bookmarkDefault = useBookmarkMapLevelMode();
  const {
    data: displayPrefs,
  } = useDisplayPreferenceSettings();
  const updatePrefs = useUpdateDisplayPreferenceSettings();
  const {
    setGroupLevelMode,
  } = useLocationLevels();
  // Session-only mode for an anchor-less location map (viewed type belongs to no group).
  const [fallbackMode, setFallbackMode] = useState<LocationMapLevelMode>(
    DEFAULT_LOCATION_MAP_LEVEL_MODE,
  );

  const anchorGroup = scopeKind === "location"
    ? findAnchorGroup(groups, currentPlaceType)
    : undefined;
  const levelMode = scopeKind === "bookmark"
    ? bookmarkDefault
    : anchorGroup
      ? anchorGroup.levelMode ?? DEFAULT_LOCATION_MAP_LEVEL_MODE
      : fallbackMode;

  function setLevelMode(mode: LocationMapLevelMode): void {
    if (scopeKind === "bookmark") {
      if (!displayPrefs) return;
      updatePrefs.mutate({
        ...displayPrefs,
        bookmarkMapLevelMode: mode,
      }, {
        onSuccess: () => notifyFieldSaved(BOOKMARK_MAP_LEVEL_MODE_LABEL),
        onError: error => notifyFieldSaveError(BOOKMARK_MAP_LEVEL_MODE_LABEL, error.message),
      });
      return;
    }
    if (anchorGroup) {
      setGroupLevelMode(anchorGroup.id, mode);
      return;
    }
    setFallbackMode(mode);
  }

  return {
    levelMode,
    setLevelMode,
  };
}
