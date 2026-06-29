import type { TreeComboboxOption } from "@/components/TreeMultiCombobox";
import type { TagNode } from "@eesimple/types";

import { romanizedSortKey } from "./romanized";

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
    // Carry the romanized form so the combobox search matches it too.
    searchAlias: n.romanizedName ?? undefined,
    children: tagNodesToOptions(n.children),
  }));
}

/**
 * Sort a tag tree (recursively, children included) by name/title. When `sortByRomanized` is true the
 * romanized form is the sort key (falling back to the name when a tag has none). Returns a new tree;
 * the input is not mutated. Client-side sorting is the sanctioned presentation carve-out.
 */
export function sortTagTreeByRomanized(nodes: TagNode[], sortByRomanized: boolean): TagNode[] {
  return nodes
    .map(node => ({
      ...node,
      children: sortTagTreeByRomanized(node.children, sortByRomanized),
    }))
    .sort((a, b) =>
      romanizedSortKey(a.name, a.romanizedName, sortByRomanized)
        .localeCompare(romanizedSortKey(b.name, b.romanizedName, sortByRomanized)));
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
