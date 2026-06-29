import type { TreeComboboxOption } from "./TreeMultiCombobox";

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
