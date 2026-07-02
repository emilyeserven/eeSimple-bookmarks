import type { LocationNode } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { useRefreshLocationBoundary } from "./useLocations";

/**
 * Backfill a location's area boundary on demand (once per id) when it has none yet — used on detail
 * pages so the polygon appears on first view and is cached server-side. No-op when `locationId` is
 * undefined (listing/bookmark maps).
 */
export function useAutoRefreshLocationBoundary(
  locationId: string | undefined,
  tree: LocationNode[],
): void {
  const refreshBoundary = useRefreshLocationBoundary();
  const attemptedRef = useRef<string | null>(null);
  // Only fetch when the target location currently has no boundary, and only once per id.
  const target = locationId
    ? tree.find(node => node.id === locationId)
    : undefined;
  const needsBoundary = target != null && target.boundary == null;
  const {
    mutate: runRefresh,
  } = refreshBoundary;
  useEffect(() => {
    if (!locationId || !needsBoundary) return;
    if (attemptedRef.current === locationId) return;
    attemptedRef.current = locationId;
    runRefresh({
      id: locationId,
      usesWikidataCoordinates: target?.usesWikidataCoordinates,
    });
  }, [locationId, needsBoundary, runRefresh, target?.usesWikidataCoordinates]);
}
