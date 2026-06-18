import { createFileRoute } from "@tanstack/react-router";

import { AutofillConditionsFields } from "../components/AutofillRuleDetail";
import { AutofillRuleTabWrapper } from "../components/AutofillRuleTabWrapper";

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
      {rule => <AutofillConditionsFields rule={rule} />}
    </AutofillRuleTabWrapper>
  );
}
