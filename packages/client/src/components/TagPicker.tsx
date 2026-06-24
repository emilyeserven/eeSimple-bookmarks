import type { TagNode } from "@eesimple/types";

import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { flattenTree, tagNodesToOptions } from "../lib/tagTree";

interface TagPickerProps {
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** Combobox multi-select for assigning a bookmark to any tier of the tag taxonomy. */
export function TagPicker({
  tree, selectedIds, onToggle,
}: TagPickerProps) {
  const flat = flattenTree(tree);

  if (flat.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No tags yet. Create some on the Tags page.
      </p>
    );
  }

  function handleValuesChange(next: string[]) {
    const prev = new Set(selectedIds);
    const added = next.find(id => !prev.has(id));
    if (added !== undefined) {
      onToggle(added);
      return;
    }
    const removed = selectedIds.find(id => !next.includes(id));
    if (removed !== undefined) onToggle(removed);
  }

  return (
    <TreeMultiCombobox
      options={tagNodesToOptions(tree)}
      values={selectedIds}
      onValuesChange={handleValuesChange}
      placeholder="Select tags…"
      searchPlaceholder="Search tags…"
      emptyText="No matching tags."
    />
  );
}
