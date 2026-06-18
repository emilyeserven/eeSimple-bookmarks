import { createFileRoute } from "@tanstack/react-router";

import { AutofillRuleGeneralForm } from "../components/AutofillRuleGeneralForm";
import { AutofillRuleTabWrapper } from "../components/AutofillRuleTabWrapper";

export const Route = createFileRoute("/autofill/$ruleSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <AutofillRuleTabWrapper
      ruleSlug={ruleSlug}
      title="General"
      description="Name, description, and priority."
    >
      {rule => <AutofillRuleGeneralForm rule={rule} />}
    </AutofillRuleTabWrapper>
  );
}
