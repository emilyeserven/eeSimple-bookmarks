import type { CardDisplayRule, ConditionTree, UpdateCardDisplayRuleInput } from "@eesimple/types";

import { useState } from "react";

import { emptyConditionTree } from "@eesimple/types";

import { ConditionsField } from "./conditions/ConditionsField";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { useUpdateCardDisplayRule } from "../hooks/useCardDisplayRules";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useTagTree } from "../hooks/useTags";

import { LabeledSection } from "@/components/LabeledSection";
import { Separator } from "@/components/ui/separator";

const LABELS: Partial<Record<keyof UpdateCardDisplayRuleInput, string>> = {
  conditions: "Conditions",
};

interface Props {
  entity: CardDisplayRule;
}

/**
 * Edit which bookmarks a card display rule matches. The `conditions` tree auto-saves on change (no
 * Save button). Not rendered for the Default rule (it matches every card unconditionally).
 */
export function CardDisplayRuleConditionsForm({
  entity: rule,
}: Props) {
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: properties = [],
  } = useCustomProperties();
  const {
    data: tagTree = [],
  } = useTagTree();
  const update = useUpdateCardDisplayRule();
  const autoSave = useFieldAutoSave<UpdateCardDisplayRuleInput>({
    id: rule.id,
    update,
    labels: LABELS,
    initial: {
      conditions: rule.conditions ?? emptyConditionTree(),
    },
  });

  const [conditions, setConditions] = useState<ConditionTree>(rule.conditions ?? emptyConditionTree());

  function handleChange(next: ConditionTree) {
    setConditions(next);
    autoSave.saveField("conditions", next);
  }

  return (
    <div className="space-y-6">
      <ConditionsField
        value={conditions}
        onChange={handleChange}
        categories={categories}
        properties={properties}
        tagTree={tagTree}
      />

      <Separator />

      <LabeledSection
        title="Preview Bookmarks"
        description="Test which existing bookmarks match the conditions above."
      >
        <PreviewBookmarksSection conditions={conditions} />
      </LabeledSection>
    </div>
  );
}
