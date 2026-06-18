import type { AutofillRule, ConditionTree } from "@eesimple/types";

import { useState } from "react";

import { emptyConditionTree } from "@eesimple/types";

import { ConditionsField } from "./conditions/ConditionsField";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { useUpdateAutofillRule } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";
import { autofillConditionsValidator } from "../lib/conditionsSchema";

import { LabeledSection } from "@/components/LabeledSection";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
  rule: AutofillRule;
}

/** Edit an autofill rule's activation conditions. Saves only the `conditions` field. */
export function AutofillRuleConditionsForm({
  rule,
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
  const updateRule = useUpdateAutofillRule();

  const [conditions, setConditions] = useState<ConditionTree>(rule.conditions ?? emptyConditionTree());
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  const isDirty = JSON.stringify(conditions) !== JSON.stringify(rule.conditions);

  function handleSave() {
    const parsed = autofillConditionsValidator.safeParse(conditions);
    if (!parsed.success) {
      setConditionsError(parsed.error.issues.map(i => i.message).join(" "));
      return;
    }
    setConditionsError(null);
    updateRule.mutate({
      id: rule.id,
      input: {
        conditions,
      },
    });
  }

  return (
    <div className="space-y-6">
      <ConditionsField
        value={conditions}
        onChange={(next) => {
          setConditions(next);
          setConditionsError(null);
        }}
        categories={categories}
        properties={properties}
        tagTree={tagTree}
      />
      {conditionsError ? <p className="text-sm text-destructive">{conditionsError}</p> : null}

      <Button
        type="button"
        size="sm"
        disabled={!isDirty || updateRule.isPending}
        onClick={handleSave}
      >
        {updateRule.isPending ? "Saving…" : "Save conditions"}
      </Button>
      {updateRule.isError
        ? <p className="text-sm text-destructive">{updateRule.error.message}</p>
        : null}

      <Separator />

      <LabeledSection
        title="Preview Bookmarks"
        description="Test which existing bookmarks match the activation conditions above."
      >
        <PreviewBookmarksSection
          conditions={conditions}
          tagTree={tagTree}
        />
      </LabeledSection>
    </div>
  );
}
