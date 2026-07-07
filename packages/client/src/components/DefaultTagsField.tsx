import type { TagNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { TagPickerWithCreate } from "./TagPickerWithCreate";

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
 * "Default tags" section shared by the Website, YouTube channel, and Newsletter general forms:
 * a label, a description, and a bordered {@link TagPicker}.
 */
export function DefaultTagsField({
  tree, selectedIds, onToggle, description,
}: Props) {
  const {
    t,
  } = useTranslation();

  return (
    <div className="space-y-2">
      <Label className="block">{t("Default tags")}</Label>
      <p className="text-sm text-muted-foreground">{description}</p>
      <TagPickerWithCreate
        tree={tree}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}
