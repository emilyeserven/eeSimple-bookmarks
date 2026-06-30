import type { LocationNode, PlaceTypeDisplayConfig } from "@eesimple/types";

import { placeTypeOrder } from "@eesimple/types";

/** How the Locations list/tree is ordered: the server order, or grouped by place-type level. */
export type LocationSortMode = "default" | "place-type";

/**
 * Sort a location tree by place type at every level (parents and their children), using each
 * placeType's configured `sortOrder` (then the canonical Nominatim rank, then name) so the order
 * agrees with Settings → Locations and the map "Levels" overlay. `"default"` returns the tree
 * untouched (the server's `sortOrder`/name order). Pure — does not mutate the input.
 */
export function sortLocationTree(
  tree: LocationNode[],
  mode: LocationSortMode,
  config: PlaceTypeDisplayConfig,
): LocationNode[] {
  if (mode === "default") return tree;
  const sortNodes = (nodes: LocationNode[]): LocationNode[] =>
    nodes
      .map(node => ({
        ...node,
        children: sortNodes(node.children),
      }))
      .sort((a, b) => {
        const byOrder = placeTypeOrder(a.placeType, config) - placeTypeOrder(b.placeType, config);
        return byOrder !== 0 ? byOrder : a.name.localeCompare(b.name);
      });
  return sortNodes(tree);
}
