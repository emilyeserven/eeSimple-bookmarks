import type { TagNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { TagPickerWithCreate } from "./TagPickerWithCreate";

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
  const {
    t,
  } = useTranslation();

  return (
    <div className="space-y-1">
      <Label>{t("Apply tags")}</Label>
      <TagPickerWithCreate
        tree={tagTree}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}
