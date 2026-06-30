import type { CardDisplayRule, ConditionTree, UpdateCardDisplayRuleInput } from "@eesimple/types";

import { useState } from "react";

import { emptyConditionTree } from "@eesimple/types";

import { useUpdateCardDisplayRule } from "../hooks/useCardDisplayRules";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useTagTree } from "../hooks/useTags";

const LABELS: Partial<Record<keyof UpdateCardDisplayRuleInput, string>> = {
  conditions: "Conditions",
};

/**
 * State + data + auto-save wiring for {@link CardDisplayRuleConditionsForm}: the three picker entity
 * lists, the local `conditions` tree, and the per-field auto-save that persists it on change.
 */
export function useCardDisplayRuleConditionsForm(rule: CardDisplayRule) {
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

  return {
    categories,
    properties,
    tagTree,
    conditions,
    handleChange,
  };
}
