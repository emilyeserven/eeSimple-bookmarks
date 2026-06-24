import type { TagNode } from "@eesimple/types";
import type { ComponentProps } from "react";

import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { tagNodesToOptions } from "../lib/tagTree";

type CreateOption = ComponentProps<typeof TreeMultiCombobox>["createOption"];

interface TagPickerProps {
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  createOption?: CreateOption;
}

/** Combobox multi-select for assigning a bookmark to any tier of the tag taxonomy. */
export function TagPicker({
  tree, selectedIds, onToggle, createOption,
}: TagPickerProps) {
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
      emptyText="No tags yet."
      createOption={createOption}
    />
  );
}
