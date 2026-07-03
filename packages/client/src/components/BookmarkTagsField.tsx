import type { TagNode } from "@eesimple/types";
import type { ComponentProps, ReactNode } from "react";

import { TagPicker } from "./TagPicker";
import { useCategoryAvailableTags } from "../hooks/useCategories";

import { Label } from "@/components/ui/label";

type CreateOption = ComponentProps<typeof TagPicker>["createOption"];

interface GatedTagPickerProps {
  categoryId: string;
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  createOption?: CreateOption;
  /** Label for the section (defaults to "Tags"). */
  label?: string;
  /** Optional muted description rendered below the label. */
  description?: string;
  /** Additional content rendered below the picker, inside the section. */
  below?: ReactNode;
}

/**
 * Tags section limited to the selected category's available root tags: tags explicitly assigned
 * to the category, plus tags with no category assignment at all. Hidden entirely when the
 * category has no available root tags. Shows all tags while the available set is still loading
 * (undefined).
 */
export function GatedTagPicker({
  categoryId, tree, selectedIds, onToggle, createOption, label = "Tags", description, below,
}: GatedTagPickerProps) {
  const {
    data: availableRootIds,
  } = useCategoryAvailableTags(categoryId);

  // Hide the tags section when the category has no available root tags.
  if (availableRootIds !== undefined && availableRootIds.length === 0) return null;

  const gated = availableRootIds
    ? tree.filter(root => availableRootIds.includes(root.id))
    : tree;

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
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
