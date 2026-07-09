import type { TagNode } from "@eesimple/types";
import type { ComponentProps } from "react";

import { useTranslation } from "react-i18next";

import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { tagNodesToOptions } from "../lib/tagTree";

type CreateOption = ComponentProps<typeof TreeMultiCombobox>["createOption"];

interface TagPickerProps {
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  createOption?: CreateOption;
  /** Per-item cascade "match child items" toggle (condition editors only). Omit for plain selection. */
  cascadeValues?: string[];
  onToggleCascade?: (id: string) => void;
}

/** Combobox multi-select for assigning a bookmark to any tier of the tag taxonomy. */
export function TagPicker({
  tree, selectedIds, onToggle, createOption, cascadeValues, onToggleCascade,
}: TagPickerProps) {
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
      options={tagNodesToOptions(tree)}
      values={selectedIds}
      onValuesChange={handleValuesChange}
      placeholder={t("Select tags…")}
      searchPlaceholder={t("Search tags…")}
      emptyText={t("No tags yet.")}
      createOption={createOption}
      cascadeValues={cascadeValues}
      onToggleCascade={onToggleCascade}
    />
  );
}
