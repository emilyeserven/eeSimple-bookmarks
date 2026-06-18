import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulePrefillForm } from "../components/AutofillRulePrefillForm";
import { AutofillRuleTabWrapper } from "../components/AutofillRuleTabWrapper";

export const Route = createFileRoute("/autofill/$ruleSlug/edit/prefill")({
  component: PrefillEditTab,
});

function PrefillEditTab() {
  const {
    ruleSlug,
  } = Route.useParams();
  return (
    <AutofillRuleTabWrapper
      ruleSlug={ruleSlug}
      title="What Gets Prefilled"
      description="Configure the category, tags, and property values this rule sets."
    >
      {rule => <AutofillRulePrefillForm rule={rule} />}
    </AutofillRuleTabWrapper>
  );
}
