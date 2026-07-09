import type { LocationNode } from "@eesimple/types";
import type { ComponentProps } from "react";

import { useTranslation } from "react-i18next";

import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { locationNodesToOptions } from "../lib/tagTree";

type CreateOption = ComponentProps<typeof TreeMultiCombobox>["createOption"];

interface LocationPickerProps {
  tree: LocationNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  createOption?: CreateOption;
  /** Per-item cascade "match child items" toggle (condition editors only). Omit for plain selection. */
  cascadeValues?: string[];
  onToggleCascade?: (id: string) => void;
}

/** Combobox multi-select for assigning a bookmark to any tier of the location taxonomy. */
export function LocationPicker({
  tree, selectedIds, onToggle, createOption, cascadeValues, onToggleCascade,
}: LocationPickerProps) {
  const {
    t,
  } = useTranslation();
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
      placeholder={t("Select locations…")}
      searchPlaceholder={t("Search locations…")}
      emptyText={t("No locations yet.")}
      createOption={createOption}
      cascadeValues={cascadeValues}
      onToggleCascade={onToggleCascade}
    />
  );
}
