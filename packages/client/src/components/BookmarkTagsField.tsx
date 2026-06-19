import type { TagNode } from "@eesimple/types";

import { TagPicker } from "./TagPicker";
import { useCategoryRootTags } from "../hooks/useCategories";

interface GatedTagPickerProps {
  categoryId: string;
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** Extra classes for the bordered box (e.g. `flex-1` to fill an equal-height grid cell). */
  className?: string;
}

/** TagPicker limited to the selected category's enabled root tags (empty allowlist = all). */
export function GatedTagPicker({
  categoryId, tree, selectedIds, onToggle, className,
}: GatedTagPickerProps) {
  const {
    data: allowedRootIds,
  } = useCategoryRootTags(categoryId);

  const gated = allowedRootIds && allowedRootIds.length > 0
    ? tree.filter(root => allowedRootIds.includes(root.id))
    : tree;

  return (
    <div className={`rounded-md border p-2 ${className ?? ""}`.trim()}>
      <TagPicker
        tree={gated}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}
