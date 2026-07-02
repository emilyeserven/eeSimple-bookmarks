import type { ConditionTree } from "@eesimple/types";

import { useState } from "react";

import { emptyConditionTree } from "@eesimple/types";

import { autofillConditionsValidator } from "../lib/conditionsSchema";

/**
 * Local state for an auto-saved `conditions` tree editor (autofill rules, import rules): every
 * change updates the local tree immediately, but only a valid tree is passed to `save`; an invalid
 * tree keeps the user's input and surfaces the validation message via `conditionsError`.
 */
export function useAutoSavedConditions(
  initial: ConditionTree | null | undefined,
  save: (next: ConditionTree) => void,
): {
  conditions: ConditionTree;
  conditionsError: string | null;
  handleChange: (next: ConditionTree) => void;
} {
  const [conditions, setConditions] = useState<ConditionTree>(initial ?? emptyConditionTree());
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  function handleChange(next: ConditionTree) {
    setConditions(next);
    const parsed = autofillConditionsValidator.safeParse(next);
    if (!parsed.success) {
      setConditionsError(parsed.error.issues.map(i => i.message).join(" "));
      return;
    }
    setConditionsError(null);
    save(next);
  }

  return {
    conditions,
    conditionsError,
    handleChange,
  };
}
