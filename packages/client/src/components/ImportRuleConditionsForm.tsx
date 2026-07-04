import type { ImportRule, UpdateImportRuleInput } from "@eesimple/types";

import { emptyConditionTree } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { ImportConditionsField } from "./conditions/ImportConditionsField";
import { useAutoSavedConditions } from "../hooks/useAutoSavedConditions";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateImportRule } from "../hooks/useImportRules";

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
  const {
    t,
  } = useTranslation();
  const updateRule = useUpdateImportRule();
  const labels: Partial<Record<keyof UpdateImportRuleInput, string>> = {
    conditions: t("Conditions"),
  };
  const autoSave = useFieldAutoSave<UpdateImportRuleInput>({
    id: rule.id,
    update: updateRule,
    labels,
    initial: {
      conditions: rule.conditions ?? emptyConditionTree(),
    },
  });

  const {
    conditions, conditionsError, handleChange,
  } = useAutoSavedConditions(rule.conditions, next => autoSave.saveField("conditions", next));

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
