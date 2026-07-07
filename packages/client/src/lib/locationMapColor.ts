import type { PlaceTypeDisplayConfig } from "@eesimple/types";

import { locationLacksLevel, NO_LEVEL_MAP_COLOR, NO_PLACE_TYPE_MAP_COLOR } from "@eesimple/types";

/**
 * The color (and why) a node falls back to when neither a per-placeType override nor its level
 * group has an explicit color: flag a missing placeType or a placeType with no level at all, so
 * those "needs configuration" nodes stand out instead of blending into Leaflet's default blue.
 * Shared by `LocationMap`'s renderer and `locationMapDebug`'s diagnostic so both agree on the reason.
 */
export function resolveFallbackMapColor(
  node: { placeType: string | null },
  config: PlaceTypeDisplayConfig,
): { color: string;
  reason: "no-place-type" | "no-level"; } | null {
  if (node.placeType === null) {
    return {
      color: NO_PLACE_TYPE_MAP_COLOR,
      reason: "no-place-type",
    };
  }
  if (locationLacksLevel(node, config)) {
    return {
      color: NO_LEVEL_MAP_COLOR,
      reason: "no-level",
    };
  }
  return null;
}
