import type { LevelScope } from "../lib/locationLevels";
import type { LocationMapLevelMode, PlaceTypeLevelGroup } from "@eesimple/types";

import { useState } from "react";

import { DEFAULT_LOCATION_MAP_LEVEL_MODE } from "@eesimple/types";

import { useLocationLevels } from "./useLocationLevels";
import { resolveAnchorGroups } from "../lib/locationLevels";

/**
 * One map's "Show" (above/current/below) mode + its writer. Reads the **persisted default** for the
 * map's anchor(s) — the current level group's `levelMode` on a place's pages, or, on a bookmark map,
 * every level group anchoring one of the bookmark's tagged locations — and writes straight through to
 * it with a field-named toast, so the map "Levels" overlay's "Show" button group and Settings →
 * Locations → Level Groups edit the same server-side value(s). A bookmark map anchored on several
 * differently-leveled tagged locations displays the broadest anchor's mode and, when changed via this
 * map's button group, applies the new mode to every one of the bookmark's current anchors (each
 * anchor still keeps its own independent default the rest of the time — see
 * `computeVisibleLevelGroupIds`). A location map whose place type belongs to no group, or a bookmark
 * map with no anchors, has no persist target; its mode falls back to session-only local state. The
 * main map has no "Show" group at all (its callers never render the control).
 */
export function useMapLevelMode(
  scope: LevelScope,
  groups: PlaceTypeLevelGroup[],
): {
  levelMode: LocationMapLevelMode;
  setLevelMode: (mode: LocationMapLevelMode) => void;
} {
  const {
    setGroupLevelMode,
  } = useLocationLevels();
  // Session-only mode for an anchor-less map (the viewed/tagged place type(s) belong to no group).
  const [fallbackMode, setFallbackMode] = useState<LocationMapLevelMode>(
    DEFAULT_LOCATION_MAP_LEVEL_MODE,
  );

  // The map's anchor group(s): the current level for a `location`, every tagged-location level for a
  // `bookmark`, none for `main`. One resolver serves both non-main kinds (a `location` yields ≤1 anchor,
  // a `bookmark` any number) — the same anchor set `computeVisibleLevelGroupIds` expands around.
  const anchors = scope.kind === "main" ? [] : resolveAnchorGroups(groups, scope);
  // Display the broadest (lowest sortOrder) anchor's mode when there are several — an arbitrary but
  // stable choice among anchors that may carry different persisted defaults.
  const primaryAnchor = anchors.length > 0
    ? [...anchors].sort((a, b) => a.sortOrder - b.sortOrder)[0]
    : undefined;

  const levelMode = primaryAnchor
    ? primaryAnchor.levelMode ?? DEFAULT_LOCATION_MAP_LEVEL_MODE
    : fallbackMode;

  function setLevelMode(mode: LocationMapLevelMode): void {
    // Anchor-less map (main, or a place type in no group) → session-only fallback. Otherwise write the
    // new mode through to every anchor's persisted default (a bookmark may have several).
    if (anchors.length === 0) {
      setFallbackMode(mode);
      return;
    }
    for (const anchor of anchors) setGroupLevelMode(anchor.id, mode);
  }

  return {
    levelMode,
    setLevelMode,
  };
}
