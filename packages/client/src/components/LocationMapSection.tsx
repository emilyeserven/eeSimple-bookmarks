import type { MapView } from "./LocationMap";
import type { AncestorChildrenScopeControls, LevelScope, LevelsControls, MapFilterControls } from "../lib/locationLevels";
import type { MapAncestryDebug } from "../lib/locationMapDebug";
import type { LocationNode } from "@eesimple/types";

import { useEffect, useMemo, useRef, useState } from "react";

import { expandLevelGroupsToDisplayConfig } from "@eesimple/types";
import { ChevronDown, Map as MapIcon } from "lucide-react";

import { LocationLevelsMapPanel } from "./LocationLevelsMapPanel";
import { LocationLevelsOverlay } from "./LocationLevelsOverlay";
import { LocationMap } from "./LocationMap";
import { useLocationPlaceTypeColors, useLocationPlaceTypeIcons } from "../hooks/useAppSettings";
import { useLocationLevels } from "../hooks/useLocationLevels";
import { useRefreshLocationBoundary } from "../hooks/useLocations";
import { useMapLevelMode } from "../hooks/useMapLevelMode";
import { computePopulatedLevelGroupIds, computeVisibleLevelGroupIds } from "../lib/locationLevels";
import { buildLayersDebug } from "../lib/locationMapDebug";
import { flattenTree, selectedSubtrees } from "../lib/tagTree";
import { useUiStore } from "../stores/uiStore";

import { cn } from "@/lib/utils";

const EMPTY_PLACE_TYPES: string[] = [];

interface LocationMapSectionProps {
  /** Stable collapse key: `"listing"` for the listing page, the location id on a detail page. */
  mapKey: string;
  /** The location tree (or sub-tree) to plot. */
  tree: LocationNode[];
  /** Section heading. */
  title?: string;
  /** Map container classes (height). Defaults to the listing-style tall map. */
  mapClassName?: string;
  /**
   * When set, the location with this id has its area boundary backfilled on demand (once) if it has
   * none yet — used on detail pages so the polygon appears on first view and is cached server-side.
   */
  autoRefreshLocationId?: string;
  /** Whether to show the "Levels" overlay control (listing page only; off on single-location maps). */
  showLevels?: boolean;
  /**
   * How this map decides which levels are visible by default: the main index map (`showOnMainMap`),
   * a place's pages (the viewed place's level ± that level group's persisted "Show" mode), or a
   * bookmark map (each tagged location's level ± that level group's own persisted "Show" mode,
   * expanded independently per anchor) — see `useMapLevelMode`. Defaults to a location scope with no
   * current place type (shows all levels).
   */
  scope?: LevelScope;
  /**
   * When set, the map shows a "Filter" combobox in the Levels overlay and prunes the plotted tree to
   * the chosen location(s) and their descendants. Omit to disable filtering (e.g. single-location maps).
   */
  filter?: {
    filterIds: string[];
    onFilterChange: (ids: string[]) => void;
  };
  /**
   * When set, the Levels overlay shows an "Only show direct ancestors/children of current location"
   * checkbox — used only by maps with a single "current" location (see `LocationGeneralView`).
   */
  ancestorChildrenScope?: AncestorChildrenScopeControls;
  /**
   * The ancestor-resolution diagnostic for the location detail map, passed straight through to
   * {@link LocationMap}'s debug modal. Supplied only by `LocationGeneralView` (which owns the
   * "Show ancestors" toggle + ancestor-path resolution); omitted on the listing/bookmark maps.
   */
  ancestryDebug?: MapAncestryDebug | null;
}

/** A collapsible "Map" section wrapping {@link LocationMap}, with persisted open/closed state. */
export function LocationMapSection({
  mapKey,
  tree,
  title = "Map",
  mapClassName,
  autoRefreshLocationId,
  showLevels = false,
  scope = {
    kind: "location",
    currentPlaceType: null,
  },
  filter,
  ancestorChildrenScope,
  ancestryDebug,
}: LocationMapSectionProps) {
  const collapsedKeys = useUiStore(state => state.collapsedLocationMapKeys);
  const toggle = useUiStore(state => state.toggleLocationMapCollapsed);
  const isCollapsed = collapsedKeys.includes(mapKey);
  const iconConfig = useLocationPlaceTypeIcons();
  const colorConfig = useLocationPlaceTypeColors();

  // Prune the plotted tree to the focused location(s) + their subtrees when a filter is active; the
  // overlay combobox still sees the full tree (built into `mapFilter`) so any place stays selectable.
  // `filterIds` is the prop array reference (stable from the parent's state), or undefined when
  // filtering is disabled — keeping it out of a `?? []` fallback avoids a fresh dep every render.
  const filterIds = filter?.filterIds;
  const plottedTree = useMemo(
    () => (filterIds && filterIds.length > 0 ? selectedSubtrees(tree, new Set(filterIds)) : tree),
    [tree, filterIds],
  );

  // Per-map level state: which level groups show is resolved from this map's scope + its persisted
  // "Show" mode, with a temporary local override for individual checkbox tweaks (reset when the
  // mode/scope change).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bookmarkPlaceTypesKey stands in for bookmarkPlaceTypes
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

  // Survives the inner LocationMap's remounts (this section is reused across $locationSlug changes):
  // holds the previous location's settled viewport so the next map seeds + animates from it.
  const lastViewRef = useRef<MapView | null>(null);

  const mapFilter: MapFilterControls | undefined = filter
    ? {
      tree,
      filterIds: filter.filterIds,
      onFilterChange: filter.onFilterChange,
    }
    : undefined;

  // Snapshot the "Levels" overlay state for the map's debug modal — the map itself only receives the
  // overlay as an opaque node, so it can't report this without being handed it.
  const layersDebug = buildLayersDebug({
    scopeKind,
    levelMode: hasLevelMode ? levelMode : null,
    hideAdminBorders,
    filterIds: filter?.filterIds ?? [],
    onlyDirectRelatives: ancestorChildrenScope ? ancestorChildrenScope.onlyDirect : null,
    groups,
    visibleIds,
    disabledIds,
    populatedIds,
  });

  const refreshBoundary = useRefreshLocationBoundary();
  const attemptedRef = useRef<string | null>(null);
  // Only fetch when the target location currently has no boundary, and only once per id.
  const target = autoRefreshLocationId
    ? tree.find(node => node.id === autoRefreshLocationId)
    : undefined;
  const needsBoundary = target != null && target.boundary == null;
  const {
    mutate: runRefresh,
  } = refreshBoundary;
  useEffect(() => {
    if (!autoRefreshLocationId || !needsBoundary) return;
    if (attemptedRef.current === autoRefreshLocationId) return;
    attemptedRef.current = autoRefreshLocationId;
    runRefresh({
      id: autoRefreshLocationId,
      usesWikidataCoordinates: target?.usesWikidataCoordinates,
    });
  }, [autoRefreshLocationId, needsBoundary, runRefresh, target?.usesWikidataCoordinates]);

  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          onClick={() => toggle(mapKey)}
          className="
            flex flex-1 items-center gap-2 rounded-lg border bg-card px-3 py-2
            text-left font-semibold transition-colors
            hover:bg-accent hover:text-accent-foreground
          "
        >
          <MapIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1">{title}</span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              isCollapsed && "-rotate-90",
            )}
          />
        </button>
        {showLevels && !isCollapsed
          ? (
            <div className="md:hidden">
              <LocationLevelsOverlay
                controls={controls}
                filter={mapFilter}
                ancestorChildrenScope={ancestorChildrenScope}
              />
            </div>
          )
          : null}
      </div>

      {!isCollapsed
        ? (
          <LocationMap
            key={mapKey}
            tree={plottedTree}
            className={mapClassName}
            displayConfig={displayConfig}
            iconConfig={iconConfig}
            colorConfig={colorConfig}
            lastViewRef={lastViewRef}
            hideAdminBorders={hideAdminBorders}
            layersDebug={layersDebug}
            ancestryDebug={ancestryDebug}
            overlay={showLevels
              ? (
                <LocationLevelsMapPanel
                  controls={controls}
                  filter={mapFilter}
                  ancestorChildrenScope={ancestorChildrenScope}
                />
              )
              : undefined}
          />
        )
        : null}
    </section>
  );
}
