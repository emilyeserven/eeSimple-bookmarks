import type { MapView } from "./LocationMap";
import type { AncestorChildrenScopeControls, LevelScope, LevelsControls, MapFilterControls } from "../lib/locationLevels";
import type { MapAncestryDebug } from "../lib/locationMapDebug";
import type { LocationNode } from "@eesimple/types";

import { useMemo, useRef } from "react";

import { ChevronDown, Map as MapIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocationLevelsMapPanel } from "./LocationLevelsMapPanel";
import { LocationLevelsOverlay } from "./LocationLevelsOverlay";
import { LocationMap } from "./LocationMap";
import { useLocationPlaceTypeColors, useLocationPlaceTypeIcons } from "../hooks/useAppSettings";
import { useAutoRefreshLocationBoundary } from "../hooks/useAutoRefreshLocationBoundary";
import { useLocationMapLevelControls } from "../hooks/useLocationMapLevelControls";
import { selectedSubtrees } from "../lib/tagTree";
import { useUiStore } from "../stores/uiStore";

import { cn } from "@/lib/utils";

/**
 * Default scope for a section not given one: a location map with no "current" place type. Hoisted to a
 * module constant so the destructuring default doesn't mint a fresh object each render (which would
 * churn the scope identity the level-controls hook depends on — see `useLocationMapLevelControls`).
 */
const DEFAULT_LEVEL_SCOPE: LevelScope = {
  kind: "location",
  currentPlaceType: null,
};

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
  /** Whether to show the "Levels" overlay control. Off by default; on for the listing map, the
   * bookmark map, and the location detail page's General-tab map. */
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
   *
   * `tree` is an optional override for the **combobox's** option tree: pass the full location tree when
   * the caller has already computed the plotted `tree` prop itself (e.g. the main listing, which unions
   * per-row item/chain focuses in `buildFocusedMapTree`). When `tree` is present the section plots the
   * `tree` prop **as given** — the internal `selectedSubtrees` prune is skipped, since the caller owns
   * the plotted set. When absent, the section prunes `tree` by `filterIds` (the legacy PlaceType path).
   */
  filter?: {
    filterIds: string[];
    onFilterChange: (ids: string[]) => void;
    tree?: LocationNode[];
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

/**
 * The collapsible header row: the expand/collapse trigger plus the small-screen "Levels" overlay.
 * Extracted so its aria-label / chevron / overlay conditionals are scored here, keeping the parent
 * {@link LocationMapSection} under the complexity cap. Presentation only — no map-level logic.
 */
function MapSectionHeader({
  label,
  isCollapsed,
  onToggle,
  showLevels,
  controls,
  mapFilter,
  ancestorChildrenScope,
}: {
  label: string;
  isCollapsed: boolean;
  onToggle: () => void;
  showLevels: boolean;
  controls: LevelsControls;
  mapFilter: MapFilterControls | undefined;
  ancestorChildrenScope?: AncestorChildrenScopeControls;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="mb-2 flex items-center gap-2">
      <button
        type="button"
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed
          ? t("Expand {{title}}", {
            title: label,
          })
          : t("Collapse {{title}}", {
            title: label,
          })}
        onClick={onToggle}
        className="
          flex flex-1 items-center gap-2 rounded-lg border bg-card px-3 py-2
          text-left font-semibold transition-colors
          hover:bg-accent hover:text-accent-foreground
        "
      >
        <MapIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1">{label}</span>
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
  );
}

/** A collapsible "Map" section wrapping {@link LocationMap}, with persisted open/closed state. */
export function LocationMapSection({
  mapKey,
  tree,
  title,
  mapClassName,
  autoRefreshLocationId,
  showLevels = false,
  scope = DEFAULT_LEVEL_SCOPE,
  filter,
  ancestorChildrenScope,
  ancestryDebug,
}: LocationMapSectionProps) {
  const {
    t,
  } = useTranslation();
  const label = title ?? t("Map");
  const collapsedKeys = useUiStore(state => state.collapsedLocationMapKeys);
  const toggle = useUiStore(state => state.toggleLocationMapCollapsed);
  const isCollapsed = collapsedKeys.includes(mapKey);
  const iconConfig = useLocationPlaceTypeIcons();
  const colorConfig = useLocationPlaceTypeColors();

  // Prune the plotted tree to the focused location(s) + their subtrees when a filter is active; the
  // overlay combobox still sees the full tree (built into `mapFilter`) so any place stays selectable.
  // `filterIds` is the prop array reference (stable from the parent's state), or undefined when
  // filtering is disabled — keeping it out of a `?? []` fallback avoids a fresh dep every render.
  // When the caller supplies `filter.tree` it has already computed the plotted `tree` itself, so the
  // internal prune is skipped (`callerOwnsPlot`) and `tree` is plotted as given.
  const filterIds = filter?.filterIds;
  const callerOwnsPlot = filter?.tree !== undefined;
  const plottedTree = useMemo(
    () => (!callerOwnsPlot && filterIds && filterIds.length > 0
      ? selectedSubtrees(tree, new Set(filterIds))
      : tree),
    [tree, filterIds, callerOwnsPlot],
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
      // Combobox options come from `filter.tree` (the full, un-pruned tree) when the caller owns the
      // plot; otherwise from the section's `tree` prop (which the section prunes for the plot).
      tree: filter.tree ?? tree,
      filterIds: filter.filterIds,
      onFilterChange: filter.onFilterChange,
    }
    : undefined;

  useAutoRefreshLocationBoundary(autoRefreshLocationId, tree);

  return (
    <section aria-label={label}>
      <MapSectionHeader
        label={label}
        isCollapsed={isCollapsed}
        onToggle={() => toggle(mapKey)}
        showLevels={showLevels}
        controls={controls}
        mapFilter={mapFilter}
        ancestorChildrenScope={ancestorChildrenScope}
      />

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
                  collapseKey={mapKey}
                />
              )
              : undefined}
          />
        )
        : null}
    </section>
  );
}
