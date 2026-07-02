import type { AutofillRule, UpdateAutofillRuleInput } from "@eesimple/types";

import { emptyConditionTree } from "@eesimple/types";

import { ConditionsField } from "./conditions/ConditionsField";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { useAutofillRuleFormData } from "./useAutofillRuleFormData";
import { useAutoSavedConditions } from "../hooks/useAutoSavedConditions";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { LabeledSection } from "@/components/LabeledSection";
import { Separator } from "@/components/ui/separator";

const LABELS: Partial<Record<keyof UpdateAutofillRuleInput, string>> = {
  conditions: "Conditions",
};

interface Props {
  rule: AutofillRule;
}

/**
 * Edit an autofill rule's activation conditions. The `conditions` tree auto-saves on change (no Save
 * button) whenever it is valid; an invalid tree shows an inline error and is not saved.
 */
export function AutofillRuleConditionsForm({
  rule,
}: Props) {
  const {
    categories, properties, tagTree, updateRule,
  } = useAutofillRuleFormData();
  const autoSave = useFieldAutoSave<UpdateAutofillRuleInput>({
    id: rule.id,
    update: updateRule,
    labels: LABELS,
    initial: {
      conditions: rule.conditions ?? emptyConditionTree(),
    },
  });

  const {
    conditions, conditionsError, handleChange,
  } = useAutoSavedConditions(rule.conditions, next => autoSave.saveField("conditions", next));

  return (
    <div className="space-y-6">
      <ConditionsField
        value={conditions}
        onChange={handleChange}
        categories={categories}
        properties={properties}
        tagTree={tagTree}
      />
      {conditionsError ? <p className="text-sm text-destructive">{conditionsError}</p> : null}

      <Separator />

      <LabeledSection
        title="Preview Bookmarks"
        description="Test which existing bookmarks match the activation conditions above."
      >
        <PreviewBookmarksSection
          conditions={conditions}
        />
      </LabeledSection>
    </div>
  );
}
