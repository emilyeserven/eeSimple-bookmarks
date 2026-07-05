import type { TreeComboboxOption } from "@/components/TreeMultiCombobox";
import type { LocationNode, PreferredLanguage, TagNode } from "@eesimple/types";

import { resolveNameSortKey } from "@eesimple/types";

import { buildSearchAlias } from "./searchAlias";

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

/** Collect the ids of every node that has children — the set a tree "Expand all" expands. */
export function expandableIds<T extends { id: string;
  children: T[]; }>(nodes: T[]): string[] {
  return nodes.flatMap(node =>
    node.children.length > 0
      ? [node.id, ...expandableIds(node.children)]
      : []);
}

/**
 * Prune a tree to the nodes matching `predicate`, with tree-search semantics: a matching node is
 * kept **with its full subtree**; a non-matching node is kept (children pruned recursively) only
 * when it has a matching descendant. Used by the tree listing scaffold's header search; returns a
 * new tree, input not mutated.
 */
export function filterTreeByMatch<T extends { children: T[] }>(
  nodes: T[],
  predicate: (node: T) => boolean,
): T[] {
  return nodes.flatMap((node) => {
    if (predicate(node)) return [node];
    const children = filterTreeByMatch(node.children, predicate);
    return children.length > 0
      ? [{
        ...node,
        children,
      }]
      : [];
  });
}

/** Count every node in a tree (all depths) — the tree listings' "N items" total. */
export function countNodes<T extends { children: T[] }>(nodes: T[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

/**
 * Prune a tree to just the selected nodes, each kept **with its full subtree**. Ancestors and
 * siblings of a selection are dropped (recursing into an unselected node's children keeps any
 * deeper selection). Used to focus a map/list on chosen items; returns a new tree.
 */
export function selectedSubtrees<T extends { id: string;
  children: T[]; }>(nodes: T[], selected: Set<string>): T[] {
  return nodes.flatMap(node =>
    selected.has(node.id)
      ? [node]
      : selectedSubtrees(node.children, selected));
}

/**
 * Convert a TagNode tree into TreeComboboxOption format for use with TreeCombobox/TreeMultiCombobox.
 * `excludeIds` (e.g. a tag's own subtree, so it can't become its own parent) drops a matching node
 * and everything beneath it, since a filtered-out node is never recursed into.
 */
export function tagNodesToOptions(nodes: TagNode[], excludeIds?: Set<string>): TreeComboboxOption[] {
  return nodes
    .filter(n => !excludeIds?.has(n.id))
    .map(n => ({
      value: n.id,
      label: n.name,
      // Carry every language-labelled name variant so the search matches any of them.
      searchAlias: buildSearchAlias(n.names),
      children: tagNodesToOptions(n.children, excludeIds),
    }));
}

/** Convert a LocationNode tree into TreeComboboxOption format for use with TreeMultiCombobox. */
export function locationNodesToOptions(nodes: LocationNode[]): TreeComboboxOption[] {
  return nodes.map(n => ({
    value: n.id,
    label: n.name,
    // Carry every language-labelled name variant so the search matches any of them.
    searchAlias: buildSearchAlias(n.names),
    children: locationNodesToOptions(n.children),
  }));
}

/** Locale + language preference for tree title sorting (both optional; default = today's behavior). */
export interface TreeSortContext {
  /** The language whose name to sort by when a node has one (interface language / override). */
  preferredLanguage?: PreferredLanguage | null;
  /** BCP-47 collation locale for the comparison (e.g. `ja`), or undefined for the default locale. */
  locale?: string;
}

/** A tag node's sort key: its preferred-language name, else its name. */
function tagNodeSortKey(node: TagNode, ctx: TreeSortContext): string {
  return resolveNameSortKey(
    node.names ?? [],
    node.name,
    {
      preferredLanguage: ctx.preferredLanguage,
    },
  );
}

/**
 * Sort a tag tree (recursively, children included) by name/title through the multilingual names
 * model. The preferred-language name (interface language / override in `ctx`) wins when a tag has
 * one; otherwise the name is the sort key. Returns a new tree; the input is not mutated.
 * Client-side sorting is the sanctioned presentation carve-out.
 */
export function sortTagTree(
  nodes: TagNode[],
  ctx: TreeSortContext = {},
): TagNode[] {
  return nodes
    .map(node => ({
      ...node,
      children: sortTagTree(node.children, ctx),
    }))
    .sort((a, b) =>
      tagNodeSortKey(a, ctx)
        .localeCompare(tagNodeSortKey(b, ctx), ctx.locale));
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
