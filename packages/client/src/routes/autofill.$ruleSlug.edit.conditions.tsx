import { createFileRoute } from "@tanstack/react-router";

import { AutofillRuleConditionsForm } from "../components/AutofillRuleConditionsForm";
import { AutofillRuleTabWrapper } from "../components/AutofillRuleTabWrapper";

export const Route = createFileRoute("/autofill/$ruleSlug/edit/conditions")({
  component: ConditionsEditTab,
});

function ConditionsEditTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <AutofillRuleTabWrapper
      ruleSlug={ruleSlug}
      title="Activation Conditions"
      description="Configure when this rule should apply."
    >
      {rule => <AutofillRuleConditionsForm rule={rule} />}
    </AutofillRuleTabWrapper>
  );
}
