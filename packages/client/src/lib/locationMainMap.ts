/**
 * Pure tree transforms for the **main** (`scope.kind === "main"`) all-locations map — kept out of the
 * React components (and unit-tested) so the map's plotted set is decided in one place. Two concerns:
 *
 * - **Hidden pruning** ({@link pruneHiddenSubtrees}) — a location flagged `hiddenOnMainMap` (and its
 *   whole subtree) is dropped from the map plot. Display-only: the card listing keeps the full tree,
 *   so a hidden location stays visible/editable in the list — this only trims the map. Applied on
 *   every main-scope map (the Locations listing, the Place Types maps).
 * - **Per-card focus** ({@link buildFocusedMapTree}) — the listing rows' two map-focus toggles. The
 *   "item" toggle focuses on a location + its descendants; the "chain" toggle additionally plots the
 *   location's ancestor spine (the detail-page behaviour). The plotted set is the union across all
 *   toggled rows; with no toggle active the map shows the whole (hidden-pruned) tree.
 *
 * Hidden always wins: a focused-but-hidden location (or a hidden ancestor of a chain focus) stays off
 * the map, because focusing filters the already-hidden-pruned tree.
 */
import type { LocationNode } from "@eesimple/types";

import { flattenTree, subtreeIds } from "./tagTree";

/**
 * Drop every node flagged `hiddenOnMainMap` — together with its whole subtree — from the tree. Returns
 * a new tree; the input is not mutated. A node with a hidden ancestor never appears (its ancestor is
 * removed before recursion reaches it).
 */
export function pruneHiddenSubtrees(tree: LocationNode[]): LocationNode[] {
  return tree.flatMap((node) => {
    if (node.hiddenOnMainMap === true) return [];
    return [{
      ...node,
      children: pruneHiddenSubtrees(node.children),
    }];
  });
}

/**
 * Keep only the nodes whose id is in `ids`, preserving hierarchy where a kept node's parent is also
 * kept; a kept node whose parent was dropped is promoted to a root (so a chain focus's ancestor spine
 * stays intact while the ancestors' unrelated siblings fall away). Returns a new tree.
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

/** Ids of a node's ancestors (walking `parentId` up), given a flat `id → node` map of the full tree. */
function ancestorIds(node: LocationNode, byId: Map<string, LocationNode>): string[] {
  const ids: string[] = [];
  let current = node.parentId ? byId.get(node.parentId) : undefined;
  while (current) {
    ids.push(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return ids;
}

export interface FocusMapOptions {
  /** Rows toggled "focus on item" — plot the location + its descendants. */
  itemFocusIds: string[];
  /** Rows toggled "focus on item + chain" — plot the location + its descendants + its ancestor spine. */
  chainFocusIds: string[];
}

/**
 * The plotted tree for the main all-locations map: the hidden-pruned tree, then (when any row is
 * toggled) narrowed to the union of the focused sets. Reused id-set membership over the hidden-pruned
 * tree keeps hidden locations off the map even when focused.
 */
export function buildFocusedMapTree(
  tree: LocationNode[],
  {
    itemFocusIds, chainFocusIds,
  }: FocusMapOptions,
): LocationNode[] {
  const hiddenPruned = pruneHiddenSubtrees(tree);
  if (itemFocusIds.length === 0 && chainFocusIds.length === 0) return hiddenPruned;

  // Resolve focus ids against the FULL tree (subtree/ancestor lookups need the untrimmed structure);
  // the final filter runs over `hiddenPruned`, so hidden nodes are excluded regardless.
  const byId = new Map(flattenTree(tree).map(({
    node,
  }) => [node.id, node] as const));
  const plotIds = new Set<string>();
  for (const id of itemFocusIds) {
    const node = byId.get(id);
    if (node) for (const sid of subtreeIds(node)) plotIds.add(sid);
  }
  for (const id of chainFocusIds) {
    const node = byId.get(id);
    if (!node) continue;
    for (const sid of subtreeIds(node)) plotIds.add(sid);
    for (const aid of ancestorIds(node, byId)) plotIds.add(aid);
  }

  return filterTreeToIds(hiddenPruned, plotIds);
}
