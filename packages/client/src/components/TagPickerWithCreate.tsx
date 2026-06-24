import type { TagNode } from "@eesimple/types";

import { useState } from "react";

import { AddTagModal } from "./AddTagModal";
import { TagPicker } from "./TagPicker";

interface TagPickerWithCreateProps {
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** TagPicker with a built-in "Create tag" option that opens the full AddTagModal (including parent selection). */
export function TagPickerWithCreate({
  tree, selectedIds, onToggle,
}: TagPickerWithCreateProps) {
  const [addTagOpen, setAddTagOpen] = useState(false);

  return (
    <>
      <TagPicker
        tree={tree}
        selectedIds={selectedIds}
        onToggle={onToggle}
        createOption={{
          label: "Create tag",
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
