import type { TagCondition, TagNode } from "@eesimple/types";

import { TagPickerWithCreate } from "../TagPickerWithCreate";

interface TagConditionEditorProps {
  value: TagCondition;
  tagTree: TagNode[];
  onChange: (next: TagCondition) => void;
}

/** Controlled editor for a "tagged with …" condition. Selecting a parent matches its children. */
export function TagConditionEditor({
  value, tagTree, onChange,
}: TagConditionEditorProps) {
  return (
    <div className="space-y-2">
      <TagPickerWithCreate
        tree={tagTree}
        selectedIds={value.tagIds}
        onToggle={(id) => {
          const next = value.tagIds.includes(id)
            ? value.tagIds.filter(tagId => tagId !== id)
            : [...value.tagIds, id];
          onChange({
            ...value,
            tagIds: next,
          });
        }}
      />
      <p className="text-xs text-muted-foreground">
        Selecting a parent tag also matches bookmarks with its child tags.
      </p>
    </div>
  );
}
