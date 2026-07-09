import type { TagCondition, TagNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { TagPickerWithCreate } from "../TagPickerWithCreate";

import { effectiveCascadeIds, pruneCascadeIds, toggleCascadeId } from "@/lib/conditionCascade";

interface TagConditionEditorProps {
  value: TagCondition;
  tagTree: TagNode[];
  onChange: (next: TagCondition) => void;
}

/**
 * Controlled editor for a "tagged with …" condition. A selected **parent** tag shows a "+ children"
 * checkbox: checked = also match bookmarks carrying any descendant tag (cascade), unchecked = exact.
 */
export function TagConditionEditor({
  value, tagTree, onChange,
}: TagConditionEditorProps) {
  const {
    t,
  } = useTranslation();
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
            cascadeTagIds: pruneCascadeIds(value.cascadeTagIds, next),
          });
        }}
        cascadeValues={effectiveCascadeIds(value.tagIds, value.cascadeTagIds, true)}
        onToggleCascade={id =>
          onChange({
            ...value,
            cascadeTagIds: toggleCascadeId(value.tagIds, value.cascadeTagIds, id, true),
          })}
      />
      <p className="text-xs text-muted-foreground">
        {t("Check “+ children” on a parent tag to also match bookmarks with its child tags; leave it unchecked for an exact match.")}
      </p>
    </div>
  );
}
