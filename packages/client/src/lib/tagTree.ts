import type { TagNode } from "@eesimple/types";

/** A tree node paired with its depth in the tree, for indented flat rendering. */
export interface FlatNode<T> {
  node: T;
  depth: number;
}

/** Back-compat alias for the global tag taxonomy's flattened nodes. */
export type FlatTag = FlatNode<TagNode>;

/** Flatten a tree into a depth-first list, carrying each node's depth. */
export function flattenTree<T extends { children: T[] }>(nodes: T[], depth = 0): FlatNode<T>[] {
  return nodes.flatMap(node => [
    {
      node,
      depth,
    },
    ...flattenTree(node.children, depth + 1),
  ]);
}

/** Collect the ids of a node and all of its descendants (inclusive). */
export function subtreeIds<T extends { id: string;
  children: T[]; }>(node: T): string[] {
  return [node.id, ...node.children.flatMap(subtreeIds)];
}
