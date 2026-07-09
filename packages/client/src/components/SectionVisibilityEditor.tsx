import type { ConditionTree } from "@eesimple/types";

import { useState } from "react";

import { emptyConditionTree } from "@eesimple/types";
import { Filter } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ConditionsField } from "./conditions/ConditionsField";
import { conditionsDetailedLabel } from "./conditions/summarizeConditions";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SectionVisibilityEditorProps {
  /** The section's current condition gate, or undefined when unset (always visible). */
  tree: ConditionTree | undefined;
  /** Commit a new tree — the caller drops it back to "always visible" when it has no children. */
  onChange: (tree: ConditionTree) => void;
}

/**
 * The per-section `visibleIf` editor surfaced in the Page Layouts board for the bookmark kind. A
 * compact popover trigger (labeled with the condition summary, or a prompt when unset) opens the
 * shared {@link ConditionsField} builder — the same UI as the autofill / homepage / card-display-rule
 * filters. A section with no conditions is always shown; with conditions it renders only for bookmarks
 * that match. Only mounted for bookmarks (via `PageLayoutsSettings`' `renderSectionExtras`), so the
 * category/property/tag queries here are safe to call unconditionally.
 */
export function SectionVisibilityEditor({
  tree,
  onChange,
}: SectionVisibilityEditorProps) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = useState(false);
  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();

  const hasConditions = (tree?.children.length ?? 0) > 0;
  const label = hasConditions && tree
    ? conditionsDetailedLabel(tree)
    : t("Show only if…");

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="
            h-7 w-full justify-start gap-1.5 text-xs font-normal
            text-muted-foreground
          "
        >
          <Filter className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-96 max-w-[90vw]"
      >
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {t("Show this section only for bookmarks that match. No conditions = always shown.")}
          </p>
          <ConditionsField
            value={tree ?? emptyConditionTree()}
            onChange={onChange}
            categories={categories ?? []}
            properties={properties ?? []}
            tagTree={tagTree ?? []}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
