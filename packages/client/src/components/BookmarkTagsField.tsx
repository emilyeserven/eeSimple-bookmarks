import type { TagNode } from "@eesimple/types";
import type { ComponentProps, ReactNode } from "react";

import { useTranslation } from "react-i18next";

import { TagPicker } from "./TagPicker";

import { Label } from "@/components/ui/label";

type CreateOption = ComponentProps<typeof TagPicker>["createOption"];

interface BookmarkTagsFieldProps {
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

/** A labelled tags section over the full tag tree. */
export function BookmarkTagsField({
  tree, selectedIds, onToggle, createOption, label, description, below,
}: BookmarkTagsFieldProps) {
  const {
    t,
  } = useTranslation();

  return (
    <div className="space-y-1">
      <Label>{label ?? t("Tags")}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <TagPicker
        tree={tree}
        selectedIds={selectedIds}
        onToggle={onToggle}
        createOption={createOption}
      />
      {below}
    </div>
  );
}
