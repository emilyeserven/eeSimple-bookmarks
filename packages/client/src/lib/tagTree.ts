import type { TreeComboboxOption } from "@/components/TreeMultiCombobox";
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

/** Convert a TagNode tree into TreeComboboxOption format for use with TreeMultiCombobox. */
export function tagNodesToOptions(nodes: TagNode[]): TreeComboboxOption[] {
  return nodes.map(n => ({
    value: n.id,
    label: n.name,
    children: tagNodesToOptions(n.children),
  }));
}

/**
 * Walk the tree depth-first to find the node with the given slug.
 * Returns the ordered path [root-ancestor, ..., target], or null if not found.
 */
export function findAncestorPath<T extends { slug: string;
  children: T[]; }>(nodes: T[], slug: string): T[] | null {
  for (const node of nodes) {
    if (node.slug === slug) return [node];
    const child = findAncestorPath(node.children, slug);
    if (child) return [node, ...child];
  }
  return null;
}
