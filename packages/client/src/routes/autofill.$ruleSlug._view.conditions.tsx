import type { AutofillRule } from "@eesimple/types";

import { createFileRoute } from "@tanstack/react-router";

import { AutofillConditionsFields } from "../components/AutofillRuleDetail";
import { AutofillRuleTabWrapper } from "../components/AutofillRuleTabWrapper";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTags } from "../hooks/useTags";

export const Route = createFileRoute("/autofill/$ruleSlug/_view/conditions")({
  component: ConditionsViewTab,
});

function ConditionsViewTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <AutofillRuleTabWrapper
      ruleSlug={ruleSlug}
      title="Activation Conditions"
      description="When this rule fires."
    >
      {rule => <ConditionsViewContent rule={rule} />}
    </AutofillRuleTabWrapper>
  );
}

function ConditionsViewContent({
  rule,
}: { rule: AutofillRule }) {
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: tags = [],
  } = useTags();
  const {
    data: properties = [],
  } = useCustomProperties();
  return (
    <AutofillConditionsFields
      rule={rule}
      categories={categories}
      tags={tags}
      properties={properties}
    />
  );
}
