import type { TagNode } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { AddTagModal } from "./AddTagModal";
import { TagPicker } from "./TagPicker";

interface TagPickerWithCreateProps {
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** Per-item cascade "match child items" toggle (condition editors only). Omit for plain selection. */
  cascadeValues?: string[];
  onToggleCascade?: (id: string) => void;
}

/** TagPicker with a built-in "Create tag" option that opens the full AddTagModal (including parent selection). */
export function TagPickerWithCreate({
  tree, selectedIds, onToggle, cascadeValues, onToggleCascade,
}: TagPickerWithCreateProps) {
  const [addTagOpen, setAddTagOpen] = useState(false);
  const {
    t,
  } = useTranslation();

  return (
    <>
      <TagPicker
        tree={tree}
        selectedIds={selectedIds}
        onToggle={onToggle}
        cascadeValues={cascadeValues}
        onToggleCascade={onToggleCascade}
        createOption={{
          label: t("Create tag"),
          onSelect: () => setAddTagOpen(true),
        }}
      />
      <AddTagModal
        open={addTagOpen}
        onOpenChange={setAddTagOpen}
        onCreated={(tag) => {
          if (!selectedIds.includes(tag.id)) onToggle(tag.id);
        }}
      />
    </>
  );
}
