import type { LevelScope } from "../lib/locationLevels";
import type { LocationMapLevelMode, PlaceTypeLevelGroup } from "@eesimple/types";

import { useState } from "react";

import { DEFAULT_LOCATION_MAP_LEVEL_MODE } from "@eesimple/types";

import { useLocationLevels } from "./useLocationLevels";
import { findAnchorGroup, resolveAnchorGroups } from "../lib/locationLevels";

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
  scopeKind: LevelScope["kind"],
  currentPlaceType: string | null,
  groups: PlaceTypeLevelGroup[],
  bookmarkPlaceTypes: string[] = [],
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

  const anchorGroup = scopeKind === "location"
    ? findAnchorGroup(groups, currentPlaceType)
    : undefined;
  const bookmarkAnchors = scopeKind === "bookmark"
    ? resolveAnchorGroups(groups, {
      kind: "bookmark",
      placeTypes: bookmarkPlaceTypes,
    })
    : [];
  // Display the broadest (lowest sortOrder) anchor's mode when there are several — an arbitrary but
  // stable choice among anchors that may carry different persisted defaults.
  const primaryBookmarkAnchor = bookmarkAnchors.length > 0
    ? [...bookmarkAnchors].sort((a, b) => a.sortOrder - b.sortOrder)[0]
    : undefined;

  const levelMode = scopeKind === "bookmark"
    ? primaryBookmarkAnchor
      ? primaryBookmarkAnchor.levelMode ?? DEFAULT_LOCATION_MAP_LEVEL_MODE
      : fallbackMode
    : anchorGroup
      ? anchorGroup.levelMode ?? DEFAULT_LOCATION_MAP_LEVEL_MODE
      : fallbackMode;

  function setLevelMode(mode: LocationMapLevelMode): void {
    if (scopeKind === "bookmark") {
      if (bookmarkAnchors.length === 0) {
        setFallbackMode(mode);
        return;
      }
      for (const anchor of bookmarkAnchors) setGroupLevelMode(anchor.id, mode);
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
