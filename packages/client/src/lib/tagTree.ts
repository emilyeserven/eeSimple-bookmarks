import type { TagNode } from "@eesimple/types";

/** A tag node paired with its depth in the tree, for indented flat rendering. */
export interface FlatTag {
  node: TagNode;
  depth: number;
}

/** Flatten a tag tree into a depth-first list, carrying each node's depth. */
export function flattenTree(nodes: TagNode[], depth = 0): FlatTag[] {
  return nodes.flatMap(node => [
    {
      node,
      depth,
    },
    ...flattenTree(node.children, depth + 1),
  ]);
}

/** Collect the ids of a node and all of its descendants (inclusive). */
export function subtreeIds(node: TagNode): string[] {
  return [node.id, ...node.children.flatMap(subtreeIds)];
}
