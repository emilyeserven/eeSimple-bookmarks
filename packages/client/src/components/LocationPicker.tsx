import type { LocationNode } from "@eesimple/types";
import type { ComponentProps } from "react";

import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { locationNodesToOptions } from "../lib/tagTree";

type CreateOption = ComponentProps<typeof TreeMultiCombobox>["createOption"];

interface LocationPickerProps {
  tree: LocationNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  createOption?: CreateOption;
}

/** Combobox multi-select for assigning a bookmark to any tier of the location taxonomy. */
export function LocationPicker({
  tree, selectedIds, onToggle, createOption,
}: LocationPickerProps) {
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
      options={locationNodesToOptions(tree)}
      values={selectedIds}
      onValuesChange={handleValuesChange}
      placeholder="Select locations…"
      searchPlaceholder="Search locations…"
      emptyText="No locations yet."
      createOption={createOption}
    />
  );
}
