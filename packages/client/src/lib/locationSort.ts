import type { LocationNode, PlaceTypeDisplayConfig, PreferredLanguage } from "@eesimple/types";

import { placeTypeOrder, resolveNameSortKey } from "@eesimple/types";

/**
 * How the Locations list/tree is ordered: the server order, grouped by place-type level, or grouped by
 * the Location Relation the location's bookmarks express (derived server-side onto `locationRelations`).
 */
export type LocationSortMode = "default" | "place-type" | "location-relation";

/**
 * A location's representative relation rank for `"location-relation"` sort: the lowest `sortOrder`
 * among the relations its bookmarks express (so a place sharing a relation clusters), or `Infinity`
 * when no bookmark of this location carries a relation (unassigned sorts last).
 */
function locationRelationRank(node: LocationNode): number {
  const usages = node.locationRelations ?? [];
  if (usages.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...usages.map(usage => usage.sortOrder));
}

/** Locale + language preference for the name tie-break (both optional; default = today's behavior). */
export interface LocationSortContext {
  /** The language whose name to sort by when a location has one (interface language / override). */
  preferredLanguage?: PreferredLanguage | null;
  /** Fallback language for the `preferRomanized` sort branch; defaults to English when unset. */
  fallbackLanguage?: PreferredLanguage | null;
  /** BCP-47 collation locale for the name comparison, or undefined for the default locale. */
  locale?: string;
}

/** A location node's tie-break key: its preferred-language name, else primary, else name. */
function locationNodeSortKey(node: LocationNode, ctx: LocationSortContext): string {
  return resolveNameSortKey(
    node.names ?? [],
    node.name,
    {
      preferredLanguage: ctx.preferredLanguage,
      fallbackLanguage: ctx.fallbackLanguage,
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
  const rankFor = (node: LocationNode): number =>
    mode === "location-relation"
      ? locationRelationRank(node)
      : placeTypeOrder(node.placeType, config);
  const sortNodes = (nodes: LocationNode[]): LocationNode[] =>
    nodes
      .map(node => ({
        ...node,
        children: sortNodes(node.children),
      }))
      .sort((a, b) => {
        const rankA = rankFor(a);
        const rankB = rankFor(b);
        // Explicit compare (not subtraction) so two unassigned Infinity ranks tie at 0 rather than NaN.
        const byOrder = rankA === rankB ? 0 : rankA < rankB ? -1 : 1;
        return byOrder !== 0
          ? byOrder
          : locationNodeSortKey(a, ctx).localeCompare(locationNodeSortKey(b, ctx), ctx.locale);
      });
  return sortNodes(tree);
}
