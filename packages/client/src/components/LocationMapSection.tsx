import type { LocationNode } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { ChevronDown, Map as MapIcon } from "lucide-react";

import { LocationLevelsMapPanel } from "./LocationLevelsMapPanel";
import { LocationLevelsOverlay } from "./LocationLevelsOverlay";
import { LocationMap } from "./LocationMap";
import { useLocationPlaceTypeIcons, usePlaceTypeDisplayConfig } from "../hooks/useAppSettings";
import { useRefreshLocationBoundary } from "../hooks/useLocations";
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
}

/** A collapsible "Map" section wrapping {@link LocationMap}, with persisted open/closed state. */
export function LocationMapSection({
  mapKey,
  tree,
  title = "Map",
  mapClassName,
  autoRefreshLocationId,
  showLevels = false,
}: LocationMapSectionProps) {
  const collapsedKeys = useUiStore(state => state.collapsedLocationMapKeys);
  const toggle = useUiStore(state => state.toggleLocationMapCollapsed);
  const isCollapsed = collapsedKeys.includes(mapKey);
  const displayConfig = usePlaceTypeDisplayConfig();
  const iconConfig = useLocationPlaceTypeIcons();

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
    runRefresh(autoRefreshLocationId);
  }, [autoRefreshLocationId, needsBoundary, runRefresh]);

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
              <LocationLevelsOverlay />
            </div>
          )
          : null}
      </div>

      {!isCollapsed
        ? (
          <LocationMap
            tree={tree}
            className={mapClassName}
            displayConfig={displayConfig}
            iconConfig={iconConfig}
            overlay={showLevels ? <LocationLevelsMapPanel /> : undefined}
          />
        )
        : null}
    </section>
  );
}
