import type { TagNode } from "@eesimple/types";

import { TagPicker } from "./TagPicker";

import { Label } from "@/components/ui/label";

interface RuleTagsFieldProps {
  tagTree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** "Apply tags" labelled tag picker for the autofill rule prefill section. */
export function RuleTagsField({
  tagTree, selectedIds, onToggle,
}: RuleTagsFieldProps) {
  return (
    <div className="space-y-1">
      <Label>Apply tags</Label>
      <TagPicker
        tree={tagTree}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}
