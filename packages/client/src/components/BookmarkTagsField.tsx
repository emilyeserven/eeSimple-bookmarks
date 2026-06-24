import type { TagNode } from "@eesimple/types";

import { TagPicker } from "./TagPicker";
import { useCategoryRootTags } from "../hooks/useCategories";

interface GatedTagPickerProps {
  categoryId: string;
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** TagPicker limited to the selected category's enabled root tags (empty allowlist = all). */
export function GatedTagPicker({
  categoryId, tree, selectedIds, onToggle,
}: GatedTagPickerProps) {
  const {
    data: allowedRootIds,
  } = useCategoryRootTags(categoryId);

  const gated = allowedRootIds && allowedRootIds.length > 0
    ? tree.filter(root => allowedRootIds.includes(root.id))
    : tree;

  return (
    <TagPicker
      tree={gated}
      selectedIds={selectedIds}
      onToggle={onToggle}
    />
  );
}
