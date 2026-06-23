import type { ConditionTree, ImportRule, UpdateImportRuleInput } from "@eesimple/types";

import { useState } from "react";

import { emptyConditionTree } from "@eesimple/types";

import { ImportConditionsField } from "./conditions/ImportConditionsField";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateImportRule } from "../hooks/useImportRules";
import { autofillConditionsValidator } from "../lib/conditionsSchema";

const LABELS: Partial<Record<keyof UpdateImportRuleInput, string>> = {
  conditions: "Conditions",
};

interface Props {
  rule: ImportRule;
}

/**
 * Edit an import rule's conditions. Only URL match and Website conditions are exposed since import
 * items only have a URL and title at evaluation time. The `conditions` tree auto-saves on change
 * (no Save button) whenever it is valid.
 */
export function ImportRuleConditionsForm({
  rule,
}: Props) {
  const updateRule = useUpdateImportRule();
  const autoSave = useFieldAutoSave<UpdateImportRuleInput>({
    id: rule.id,
    update: updateRule,
    labels: LABELS,
    initial: {
      conditions: rule.conditions ?? emptyConditionTree(),
    },
  });

  const [conditions, setConditions] = useState<ConditionTree>(rule.conditions ?? emptyConditionTree());
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  function handleChange(next: ConditionTree) {
    setConditions(next);
    const parsed = autofillConditionsValidator.safeParse(next);
    if (!parsed.success) {
      setConditionsError(parsed.error.issues.map(i => i.message).join(" "));
      return;
    }
    setConditionsError(null);
    autoSave.saveField("conditions", next);
  }

  return (
    <div className="space-y-4">
      <ImportConditionsField
        value={conditions}
        onChange={handleChange}
      />
      {conditionsError ? <p className="text-sm text-destructive">{conditionsError}</p> : null}
    </div>
  );
}
