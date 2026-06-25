import type { TagNode } from "@eesimple/types";
import type { ComponentProps, ReactNode } from "react";

import { TagPicker } from "./TagPicker";
import { useCategoryRootTags } from "../hooks/useCategories";

import { Label } from "@/components/ui/label";

type CreateOption = ComponentProps<typeof TagPicker>["createOption"];

interface GatedTagPickerProps {
  categoryId: string;
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  createOption?: CreateOption;
  /** Additional content rendered below the picker, inside the Tags section. */
  below?: ReactNode;
}

/**
 * Tags section limited to the selected category's enabled root tags. Hidden entirely when the
 * category has no root tags configured (empty allowlist). Shows all tags while the allowlist is
 * still loading (undefined).
 */
export function GatedTagPicker({
  categoryId, tree, selectedIds, onToggle, createOption, below,
}: GatedTagPickerProps) {
  const {
    data: allowedRootIds,
  } = useCategoryRootTags(categoryId);

  // Hide the tags section when the category has no root tags enabled.
  if (allowedRootIds !== undefined && allowedRootIds.length === 0) return null;

  const gated = allowedRootIds && allowedRootIds.length > 0
    ? tree.filter(root => allowedRootIds.includes(root.id))
    : tree;

  return (
    <div className="space-y-1">
      <Label>Tags</Label>
      <TagPicker
        tree={gated}
        selectedIds={selectedIds}
        onToggle={onToggle}
        createOption={createOption}
      />
      {below}
    </div>
  );
}
