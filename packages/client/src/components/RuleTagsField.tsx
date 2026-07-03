import type { TagNode } from "@eesimple/types";

import { TagPickerWithCreate } from "./TagPickerWithCreate";
import { useGatedTagTree } from "../hooks/useGatedTagTree";

import { Label } from "@/components/ui/label";

interface RuleTagsFieldProps {
  tagTree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** The rule's own "Set category" action, resolved to a real id (or `null`) — gates the tree. */
  categoryId?: string | null;
}

/** "Apply tags" labelled tag picker for the autofill rule prefill section. */
export function RuleTagsField({
  tagTree, selectedIds, onToggle, categoryId,
}: RuleTagsFieldProps) {
  const {
    tree: gated,
  } = useGatedTagTree(categoryId, tagTree);

  return (
    <div className="space-y-1">
      <Label>Apply tags</Label>
      <TagPickerWithCreate
        tree={gated}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}
