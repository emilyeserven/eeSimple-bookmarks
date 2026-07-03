import type { TreeComboboxOption } from "./TreeMultiCombobox";

/**
 * Flatten a tree of options into a depth-first list of every node (parents and descendants alike).
 * Used to resolve a selected value's label/icon from anywhere in the tree. Pure — shared by both
 * tree comboboxes and kept here so those component files only export a component.
 */
export function flattenOptions(nodes: TreeComboboxOption[]): TreeComboboxOption[] {
  return nodes.flatMap(node => [node, ...flattenOptions(node.children ?? [])]);
}

/**
 * Return the set of node values that must be expanded so every selected item is visible in the
 * tree (i.e. all ancestor nodes of any selected item, across every branch). Pure — unit-tested
 * directly and kept out of `TreeMultiCombobox.tsx` so that component file only exports a component.
 */
export function ancestorIdsForSelected(
  nodes: TreeComboboxOption[],
  selectedSet: Set<string>,
): Set<string> {
  const result = new Set<string>();

  function visit(node: TreeComboboxOption): boolean {
    // Visit every child (no short-circuit) so ancestors of selected items in *all* branches are
    // collected — `.some()` would stop at the first matching branch and leave siblings collapsed.
    let childHasSelected = false;
    for (const child of node.children ?? []) {
      if (visit(child)) childHasSelected = true;
    }
    if (childHasSelected) result.add(node.value);
    return selectedSet.has(node.value) || childHasSelected;
  }

  for (const node of nodes) visit(node);
  return result;
}

/**
 * Prune a tree down to the nodes that match `term` (by label or `searchAlias`) plus their
 * ancestors, kept purely for hierarchical context — an ancestor that doesn't itself match is
 * still returned (with only its matching descendants) so the tree's shape/indentation survives
 * search filtering instead of collapsing into a flat list. Pure — unit-tested directly.
 */
export function filterTreeByTerm(
  nodes: TreeComboboxOption[],
  term: string,
): TreeComboboxOption[] {
  const needle = term.trim().toLowerCase();
  if (needle.length === 0) return nodes;

  function nodeMatches(node: TreeComboboxOption): boolean {
    return node.label.toLowerCase().includes(needle)
      || (node.searchAlias?.toLowerCase().includes(needle) ?? false);
  }

  function visit(node: TreeComboboxOption): TreeComboboxOption | null {
    const filteredChildren = (node.children ?? [])
      .map(visit)
      .filter((child): child is TreeComboboxOption => child !== null);

    if (!nodeMatches(node) && filteredChildren.length === 0) return null;

    return {
      ...node,
      children: filteredChildren.length > 0 ? filteredChildren : undefined,
    };
  }

  return nodes.map(visit).filter((node): node is TreeComboboxOption => node !== null);
}
