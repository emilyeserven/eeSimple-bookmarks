import type { RuleDisplayValue } from "./CardDisplayRuleDisplaySettings";
import type { CardDisplayRule, CustomProperty, UpdateCardDisplayRuleInput } from "@eesimple/types";

import { useState } from "react";

import { useUpdateCardDisplayRule } from "../hooks/useCardDisplayRules";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { ruleToDisplay } from "../lib/cardDisplayRuleForm";

interface UseCardDisplayRuleDisplayResult {
  properties: CustomProperty[];
  display: RuleDisplayValue;
  handleChange: (patch: Partial<RuleDisplayValue>) => void;
}

/**
 * State + auto-save orchestration for the card display rule's Display edit tab. Holds the controlled
 * display value and persists each changed attribute on change (field-named toast via
 * {@link useFieldAutoSave}). Extracted from the form component so neither is hook-dense (fallow cap).
 */
export function useCardDisplayRuleDisplay(
  rule: CardDisplayRule,
  labels: Partial<Record<keyof UpdateCardDisplayRuleInput, string>>,
): UseCardDisplayRuleDisplayResult {
  const {
    data: properties = [],
  } = useCustomProperties();
  const update = useUpdateCardDisplayRule();
  const initial = ruleToDisplay(rule);
  const autoSave = useFieldAutoSave<UpdateCardDisplayRuleInput, CardDisplayRule>({
    id: rule.id,
    update,
    labels,
    initial,
  });
  const [display, setDisplay] = useState<RuleDisplayValue>(initial);

  function handleChange(patch: Partial<RuleDisplayValue>) {
    setDisplay(prev => ({
      ...prev,
      ...patch,
    }));
    for (const [key, value] of Object.entries(patch)) {
      autoSave.saveField(key as keyof UpdateCardDisplayRuleInput, value as never);
    }
  }

  return {
    properties,
    display,
    handleChange,
  };
}
