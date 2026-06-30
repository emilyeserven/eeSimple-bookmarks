import type { LocationNode } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { ChevronDown, ChevronRight } from "lucide-react";

import { LocationMap } from "./LocationMap";
import { useRefreshLocationBoundary } from "../hooks/useLocations";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";

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
}

/** A collapsible "Map" section wrapping {@link LocationMap}, with persisted open/closed state. */
export function LocationMapSection({
  mapKey,
  tree,
  title = "Map",
  mapClassName,
  autoRefreshLocationId,
}: LocationMapSectionProps) {
  const collapsedKeys = useUiStore(state => state.collapsedLocationMapKeys);
  const toggle = useUiStore(state => state.toggleLocationMapCollapsed);
  const isCollapsed = collapsedKeys.includes(mapKey);

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
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          onClick={() => toggle(mapKey)}
        >
          {isCollapsed
            ? <ChevronRight className="size-4" />
            : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {!isCollapsed
        ? (
          <LocationMap
            tree={tree}
            className={mapClassName}
          />
        )
        : null}
    </section>
  );
}
