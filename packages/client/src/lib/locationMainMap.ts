/**
 * Pure tree transforms for the **main** (`scope.kind === "main"`) all-locations map — kept out of the
 * React components (and unit-tested) so the map's plotted set is decided in one place. Two concerns:
 *
 * - **Hidden pruning** ({@link pruneHiddenSubtrees}) — a hidden location (and its whole subtree) is
 *   dropped from the map plot. Display-only: the card listing keeps the full tree, so a hidden location
 *   stays in the list (de-emphasized) so it can be un-hidden. What counts as "hidden" is supplied by the
 *   caller: the persisted `hiddenOnMainMap` flag by default (the Place Types map), or — on the Locations
 *   listing — the *session* visibility state (the per-row eye toggle), which is seeded from that flag but
 *   resets on reload.
 * - **Per-card focus** ({@link buildFocusedMapTree}) — the listing rows' "Focus on Map" (MapPin) toggle
 *   focuses on a location + its descendants. The plotted set is the union across all focused rows; with
 *   no row focused the map shows the whole (hidden-pruned) tree.
 *
 * Hidden always wins: a focused-but-hidden location stays off the map, because focusing filters the
 * already-hidden-pruned tree.
 */
import type { LocationNode } from "@eesimple/types";

import { flattenTree, subtreeIds } from "./tagTree";

/** Whether a location counts as hidden from the main map. Defaults to its persisted `hiddenOnMainMap`. */
export type LocationHiddenPredicate = (node: LocationNode) => boolean;

const DEFAULT_HIDDEN: LocationHiddenPredicate = node => node.hiddenOnMainMap === true;

/**
 * Effective map-hidden state for a location: the *session* eye-toggle override for its id if present,
 * else the persisted `hiddenOnMainMap` setting. The single source shared by the map plot
 * ({@link buildFocusedMapTree}'s `hiddenIds`) and the listing row's eye icon + de-emphasis.
 */
export function isLocationHidden(node: LocationNode, overrides: Record<string, boolean>): boolean {
  return node.id in overrides ? overrides[node.id] : (node.hiddenOnMainMap ?? false);
}

/**
 * Drop every node the `isHidden` predicate matches — together with its whole subtree — from the tree.
 * Returns a new tree; the input is not mutated. A node with a hidden ancestor never appears (its
 * ancestor is removed before recursion reaches it). Defaults to the persisted `hiddenOnMainMap` flag.
 */
export function pruneHiddenSubtrees(
  tree: LocationNode[],
  isHidden: LocationHiddenPredicate = DEFAULT_HIDDEN,
): LocationNode[] {
  return tree.flatMap((node) => {
    if (isHidden(node)) return [];
    return [{
      ...node,
      children: pruneHiddenSubtrees(node.children, isHidden),
    }];
  });
}

/**
 * Keep only the nodes whose id is in `ids`, preserving hierarchy where a kept node's parent is also
 * kept; a kept node whose parent was dropped is promoted to a root. Returns a new tree.
 */
function filterTreeToIds(nodes: LocationNode[], ids: Set<string>): LocationNode[] {
  return nodes.flatMap((node) => {
    const children = filterTreeToIds(node.children, ids);
    if (ids.has(node.id)) {
      return [{
        ...node,
        children,
      }];
    }
    // Not kept itself → promote any kept descendants up to this level.
    return children;
  });
}

export interface FocusMapOptions {
  /** Rows toggled "Focus on Map" — plot the location + its descendants. */
  itemFocusIds: string[];
  /** Ids of locations currently hidden from the map (the session eye-toggle state, seeded from `hiddenOnMainMap`). */
  hiddenIds: Set<string>;
}

/**
 * The plotted tree for the main all-locations map: the hidden-pruned tree, then (when any row is
 * focused) narrowed to the union of the focused sets. Filtering the already-hidden-pruned tree keeps
 * hidden locations off the map even when focused.
 */
export function buildFocusedMapTree(
  tree: LocationNode[],
  {
    itemFocusIds, hiddenIds,
  }: FocusMapOptions,
): LocationNode[] {
  const visible = pruneHiddenSubtrees(tree, node => hiddenIds.has(node.id));
  if (itemFocusIds.length === 0) return visible;

  // Resolve focus ids against the FULL tree (subtree lookups need the untrimmed structure); the final
  // filter runs over `visible`, so hidden nodes are excluded regardless.
  const byId = new Map(flattenTree(tree).map(({
    node,
  }) => [node.id, node] as const));
  const plotIds = new Set<string>();
  for (const id of itemFocusIds) {
    const node = byId.get(id);
    if (node) for (const sid of subtreeIds(node)) plotIds.add(sid);
  }
  return filterTreeToIds(visible, plotIds);
}
