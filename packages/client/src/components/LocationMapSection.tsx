import type { MapView } from "./LocationMap";
import type { AncestorChildrenScopeControls, LevelScope, MapFilterControls } from "../lib/locationLevels";
import type { MapAncestryDebug } from "../lib/locationMapDebug";
import type { LocationNode } from "@eesimple/types";

import { useMemo, useRef } from "react";

import { ChevronDown, Map as MapIcon } from "lucide-react";

import { LocationLevelsMapPanel } from "./LocationLevelsMapPanel";
import { LocationLevelsOverlay } from "./LocationLevelsOverlay";
import { LocationMap } from "./LocationMap";
import { useLocationPlaceTypeColors, useLocationPlaceTypeIcons } from "../hooks/useAppSettings";
import { useAutoRefreshLocationBoundary } from "../hooks/useAutoRefreshLocationBoundary";
import { useLocationMapLevelControls } from "../hooks/useLocationMapLevelControls";
import { selectedSubtrees } from "../lib/tagTree";
import { useUiStore } from "../stores/uiStore";

import { cn } from "@/lib/utils";

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

  const {
    controls, displayConfig, hideAdminBorders, layersDebug,
  } = useLocationMapLevelControls(scope, plottedTree, {
    filterIds,
    onlyDirectRelatives: ancestorChildrenScope ? ancestorChildrenScope.onlyDirect : null,
  });

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

  useAutoRefreshLocationBoundary(autoRefreshLocationId, tree);

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
