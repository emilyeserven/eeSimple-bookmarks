import type { LevelScope, LevelsControls } from "../lib/locationLevels";
import type { LocationNode } from "@eesimple/types";

import { useEffect, useMemo, useRef, useState } from "react";

import { expandLevelGroupsToDisplayConfig } from "@eesimple/types";
import { ChevronDown, Map as MapIcon } from "lucide-react";

import { LocationLevelsMapPanel } from "./LocationLevelsMapPanel";
import { LocationLevelsOverlay } from "./LocationLevelsOverlay";
import { LocationMap } from "./LocationMap";
import { useLocationPlaceTypeIcons } from "../hooks/useAppSettings";
import { useLocationLevels } from "../hooks/useLocationLevels";
import { useRefreshLocationBoundary } from "../hooks/useLocations";
import { computeVisibleLevelGroupIds } from "../lib/locationLevels";
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
   * a place's pages (the viewed place's level ± the shared mode), or a bookmark map (all tagged
   * levels). Defaults to a location scope with no current place type (shows all levels).
   */
  scope?: LevelScope;
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
}: LocationMapSectionProps) {
  const collapsedKeys = useUiStore(state => state.collapsedLocationMapKeys);
  const toggle = useUiStore(state => state.toggleLocationMapCollapsed);
  const isCollapsed = collapsedKeys.includes(mapKey);
  const iconConfig = useLocationPlaceTypeIcons();

  // Per-map level state: which level groups show is resolved from this map's scope + the shared mode,
  // with a temporary local override for individual checkbox tweaks (reset when the mode/scope change).
  const {
    groups,
  } = useLocationLevels({
    notify: false,
  });
  const levelMode = useUiStore(state => state.locationMapLevelMode);
  const setLevelMode = useUiStore(state => state.setLocationMapLevelMode);

  // Destructure scope into primitives so the hooks below have honest, stable dependencies (callers
  // reconstruct the `scope` object inline each render, so depending on it directly would thrash).
  const scopeKind = scope.kind;
  const currentPlaceType = scope.kind === "location" ? scope.currentPlaceType : null;
  const defaultVisibleIds = useMemo(() => {
    const resolved: LevelScope = scopeKind === "main"
      ? {
        kind: "main",
      }
      : scopeKind === "bookmark"
        ? {
          kind: "bookmark",
        }
        : {
          kind: "location",
          currentPlaceType,
        };
    return computeVisibleLevelGroupIds(groups, resolved, levelMode);
  }, [groups, scopeKind, currentPlaceType, levelMode]);
  const [overrideIds, setOverrideIds] = useState<Set<string> | null>(null);
  // Re-sync the checkboxes to the computed default whenever the shared mode or the scope changes.
  useEffect(() => {
    setOverrideIds(null);
  }, [scopeKind, currentPlaceType, levelMode]);

  const visibleIds = overrideIds ?? defaultVisibleIds;
  const displayConfig = useMemo(
    () => expandLevelGroupsToDisplayConfig(groups.map(group => ({
      ...group,
      visible: visibleIds.has(group.id),
    }))),
    [groups, visibleIds],
  );

  const controls: LevelsControls = {
    visibleIds,
    onToggleVisible: (id, visible) => setOverrideIds((prev) => {
      const next = new Set(prev ?? defaultVisibleIds);
      if (visible) next.add(id);
      else next.delete(id);
      return next;
    }),
    // The above/current/below button group only applies where there's a "current" level.
    levelMode: scopeKind === "location" ? levelMode : undefined,
    onLevelModeChange: scopeKind === "location" ? setLevelMode : undefined,
  };

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
              <LocationLevelsOverlay controls={controls} />
            </div>
          )
          : null}
      </div>

      {!isCollapsed
        ? (
          <LocationMap
            key={mapKey}
            tree={tree}
            className={mapClassName}
            displayConfig={displayConfig}
            iconConfig={iconConfig}
            overlay={showLevels ? <LocationLevelsMapPanel controls={controls} /> : undefined}
          />
        )
        : null}
    </section>
  );
}
