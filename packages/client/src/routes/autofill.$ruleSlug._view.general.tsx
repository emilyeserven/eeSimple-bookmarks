import { createFileRoute } from "@tanstack/react-router";

import { AutofillGeneralFields } from "../components/AutofillRuleDetail";
import { AutofillRuleTabWrapper } from "../components/AutofillRuleTabWrapper";

export const Route = createFileRoute("/autofill/$ruleSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <AutofillRuleTabWrapper
      ruleSlug={ruleSlug}
      title="General"
      description="Name, description, and priority."
    >
      {rule => <AutofillGeneralFields rule={rule} />}
    </AutofillRuleTabWrapper>
  );
}
