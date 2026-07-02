import type { LevelScope, LevelsControls } from "../lib/locationLevels";
import type { MapLayersDebug } from "../lib/locationMapDebug";
import type { LocationNode, PlaceTypeDisplayConfig } from "@eesimple/types";

import { useEffect, useMemo, useState } from "react";

import { expandLevelGroupsToDisplayConfig } from "@eesimple/types";

import { useLocationLevels } from "./useLocationLevels";
import { useMapLevelMode } from "./useMapLevelMode";
import { computePopulatedLevelGroupIds, computeVisibleLevelGroupIds } from "../lib/locationLevels";
import { buildLayersDebug } from "../lib/locationMapDebug";
import { flattenTree } from "../lib/tagTree";
import { useUiStore } from "../stores/uiStore";

const EMPTY_PLACE_TYPES: string[] = [];

/**
 * Per-map "Levels" overlay state for {@link LocationMapSection}: which level groups are visible is
 * resolved from the map's scope + its persisted "Show" mode, with a temporary local override for
 * individual checkbox tweaks (reset when the mode/scope change). Groups with nothing plotted in the
 * current tree are disabled; the returned `displayConfig` feeds the map, `layersDebug` its debug
 * modal.
 */
export function useLocationMapLevelControls(
  scope: LevelScope,
  plottedTree: LocationNode[],
  opts: {
    filterIds: string[] | undefined;
    onlyDirectRelatives: boolean | null;
  },
): {
  controls: LevelsControls;
  displayConfig: PlaceTypeDisplayConfig;
  hideAdminBorders: boolean;
  layersDebug: MapLayersDebug;
} {
  const {
    groups,
  } = useLocationLevels({
    notify: false,
  });
  const hideAdminBorders = useUiStore(state => state.hideLocationMapAdminBorders);
  const setHideAdminBorders = useUiStore(state => state.setHideLocationMapAdminBorders);

  // Destructure scope into primitives so the hooks below have honest, stable dependencies (callers
  // reconstruct the `scope` object inline each render, so depending on it directly would thrash).
  const scopeKind = scope.kind;
  const currentPlaceType = scope.kind === "location" ? scope.currentPlaceType : null;
  const bookmarkPlaceTypes = scope.kind === "bookmark" ? scope.placeTypes : EMPTY_PLACE_TYPES;

  // The persisted "Show" mode for this map's anchor(s) (the current level group, or every level
  // group anchoring a bookmark's tagged locations); the setter writes straight through to it — see
  // useMapLevelMode.
  const {
    levelMode, setLevelMode,
  } = useMapLevelMode(scopeKind, currentPlaceType, groups, bookmarkPlaceTypes);
  // Join into a stable string key — callers reconstruct the `placeTypes` array inline each render,
  // so depending on its reference directly would thrash the memo/effect below on every render.
  const bookmarkPlaceTypesKey = bookmarkPlaceTypes.join(" ");
  const defaultVisibleIds = useMemo(() => {
    const resolved: LevelScope = scopeKind === "main"
      ? {
        kind: "main",
      }
      : scopeKind === "bookmark"
        ? {
          kind: "bookmark",
          placeTypes: bookmarkPlaceTypes,
        }
        : {
          kind: "location",
          currentPlaceType,
        };
    return computeVisibleLevelGroupIds(groups, resolved);
    // deps: bookmarkPlaceTypesKey stands in for bookmarkPlaceTypes (see the join above)
  }, [groups, scopeKind, currentPlaceType, bookmarkPlaceTypesKey]);
  const [overrideIds, setOverrideIds] = useState<Set<string> | null>(null);
  // Re-sync the checkboxes to the computed default whenever the shared mode or the scope changes.
  useEffect(() => {
    setOverrideIds(null);
  }, [scopeKind, currentPlaceType, bookmarkPlaceTypesKey, levelMode]);

  // Level groups with no plotted areas/pins in the current tree get their checkbox disabled/unchecked
  // — this is derived fresh from `plottedTree` every render (not stored state), so a group re-enables
  // itself the instant its place type is plotted again (e.g. after navigating to a different bookmark).
  const populatedIds = useMemo(
    () => computePopulatedLevelGroupIds(groups, flattenTree(plottedTree).map(({
      node,
    }) => node)),
    [groups, plottedTree],
  );
  const visibleIds = useMemo(() => {
    const base = overrideIds ?? defaultVisibleIds;
    return new Set([...base].filter(id => populatedIds.has(id)));
  }, [overrideIds, defaultVisibleIds, populatedIds]);
  const displayConfig = useMemo(
    () => expandLevelGroupsToDisplayConfig(groups.map(group => ({
      ...group,
      visible: visibleIds.has(group.id),
    }))),
    [groups, visibleIds],
  );

  // The above/current/below button group applies wherever there's a "current" level (or levels).
  const hasLevelMode = scopeKind === "location" || scopeKind === "bookmark";
  const disabledIds = useMemo(
    () => new Set(groups.filter(group => !populatedIds.has(group.id)).map(group => group.id)),
    [groups, populatedIds],
  );
  const controls: LevelsControls = {
    visibleIds,
    onToggleVisible: (id, visible) => setOverrideIds((prev) => {
      const next = new Set(prev ?? defaultVisibleIds);
      if (visible) next.add(id);
      else next.delete(id);
      return next;
    }),
    disabledIds,
    levelMode: hasLevelMode ? levelMode : undefined,
    onLevelModeChange: hasLevelMode ? setLevelMode : undefined,
    hideAdminBorders,
    onHideAdminBordersChange: setHideAdminBorders,
  };

  // Snapshot the "Levels" overlay state for the map's debug modal — the map itself only receives the
  // overlay as an opaque node, so it can't report this without being handed it.
  const layersDebug = buildLayersDebug({
    scopeKind,
    levelMode: hasLevelMode ? levelMode : null,
    hideAdminBorders,
    filterIds: opts.filterIds ?? [],
    onlyDirectRelatives: opts.onlyDirectRelatives,
    groups,
    visibleIds,
    disabledIds,
    populatedIds,
  });

  return {
    controls,
    displayConfig,
    hideAdminBorders,
    layersDebug,
  };
}
