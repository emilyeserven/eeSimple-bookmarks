import type { LocationNode, PlaceTypeDisplayConfig, PreferredLanguage } from "@eesimple/types";

import { namesWithLegacyFallback, placeTypeOrder, resolveNameSortKey } from "@eesimple/types";

/** How the Locations list/tree is ordered: the server order, or grouped by place-type level. */
export type LocationSortMode = "default" | "place-type";

/** Locale + language preference for the name tie-break (both optional; default = today's behavior). */
export interface LocationSortContext {
  /** The language whose name to sort by when a location has one (interface language / override). */
  preferredLanguage?: PreferredLanguage | null;
  /** BCP-47 collation locale for the name comparison, or undefined for the default locale. */
  locale?: string;
}

/** A location node's tie-break key: its preferred-language name, else primary, else name. */
function locationNodeSortKey(node: LocationNode, ctx: LocationSortContext): string {
  return resolveNameSortKey(
    namesWithLegacyFallback(node.names, node.romanizedName),
    node.name,
    {
      preferredLanguage: ctx.preferredLanguage,
    },
  );
}

/**
 * Sort a location tree by place type at every level (parents and their children), using each
 * placeType's configured `sortOrder` (then the canonical Nominatim rank, then name) so the order
 * agrees with Settings → Locations and the map "Levels" overlay. `"default"` returns the tree
 * untouched (the server's `sortOrder`/name order). The name tie-break resolves through the
 * multilingual names model and is locale-aware via `ctx`. Pure — does not mutate the input.
 */
export function sortLocationTree(
  tree: LocationNode[],
  mode: LocationSortMode,
  config: PlaceTypeDisplayConfig,
  ctx: LocationSortContext = {},
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
        return byOrder !== 0
          ? byOrder
          : locationNodeSortKey(a, ctx).localeCompare(locationNodeSortKey(b, ctx), ctx.locale);
      });
  return sortNodes(tree);
}
