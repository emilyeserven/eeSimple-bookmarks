import type { TagNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

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
    t,
  } = useTranslation();
  const {
    tree: gated,
  } = useGatedTagTree(categoryId, tagTree);

  return (
    <div className="space-y-1">
      <Label>{t("Apply tags")}</Label>
      <TagPickerWithCreate
        tree={gated}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}
