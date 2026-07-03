import type { TagNode } from "@eesimple/types";

import { TagPickerWithCreate } from "./TagPickerWithCreate";
import { useGatedTagTree } from "../hooks/useGatedTagTree";

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
  /** The source's own default category, if any — gates the tree to that category's available tags. */
  categoryId?: string | null;
}

/**
 * "Default tags" section shared by the Website, YouTube channel, and Newsletter general forms:
 * a label, a description, and a bordered {@link TagPicker}. Gated to the source's own default
 * category's available tags when one is set.
 */
export function DefaultTagsField({
  tree, selectedIds, onToggle, description, categoryId,
}: Props) {
  const {
    tree: gated,
  } = useGatedTagTree(categoryId, tree);

  return (
    <div className="space-y-2">
      <Label className="block">Default tags</Label>
      <p className="text-sm text-muted-foreground">{description}</p>
      <TagPickerWithCreate
        tree={gated}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}
