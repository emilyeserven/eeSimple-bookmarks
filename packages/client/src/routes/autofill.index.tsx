import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { useAutofillRules } from "../hooks/useAutofill";
import { useSetListingPage } from "../hooks/useListingPage";
import { useNewAutofillRule } from "../hooks/useNewAutofillRule";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/autofill/")({
  component: AutofillListPage,
});

function AutofillListPage() {
  const {
    data: rules,
  } = useAutofillRules();
  const newRule = useNewAutofillRule();
  useSetListingPage("autofill-rules-listing", false, false, false, newRule.openModal);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Autofill Rules</h2>
          {rules
            ? <Badge variant="secondary">{rules.length}</Badge>
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Define rules that match a bookmark&apos;s title or website and prefill its category, tags, and
          custom properties when you add it. Select a rule to edit it, or create a new one.
        </p>
      </div>

      <AutofillRulesList />

      {newRule.modal}
    </section>
  );
}
