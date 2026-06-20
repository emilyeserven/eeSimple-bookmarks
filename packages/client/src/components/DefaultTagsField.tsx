import type { TagNode } from "@eesimple/types";

import { TagPicker } from "./TagPicker";

import { Label } from "@/components/ui/label";

interface Props {
  /** Tag tree to choose from. */
  tree: TagNode[];
  /** Currently selected tag ids. */
  selectedIds: string[];
  /** Toggle a tag id in/out of the selection. */
  onToggle: (id: string) => void;
  /** Muted helper text under the label (e.g. where the tags get applied). */
  description: string;
}

/**
 * "Default tags" section shared by the Website and YouTube channel general forms:
 * a label, a description, and a bordered {@link TagPicker}.
 */
export function DefaultTagsField({
  tree, selectedIds, onToggle, description,
}: Props) {
  return (
    <div className="space-y-2">
      <Label className="block">Default tags</Label>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="rounded-md border p-2">
        <TagPicker
          tree={tree}
          selectedIds={selectedIds}
          onToggle={onToggle}
        />
      </div>
    </div>
  );
}
