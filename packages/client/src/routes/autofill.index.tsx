import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { useAutofillRules } from "../hooks/useAutofill";
import { useSetListingPage } from "../hooks/useListingPage";
import { useNewAutofillRule } from "../hooks/useNewAutofillRule";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/autofill/")({
  component: AutofillListPage,
});

function AutofillListPage() {
  const {
    data: rules,
  } = useAutofillRules();
  const newRule = useNewAutofillRule();
  useSetListingPage("autofill-rules-listing");

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Autofill Rules</h2>
            {rules
              ? <Badge variant="secondary">{rules.length}</Badge>
              : null}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={newRule.onClick}
          >
            <Plus className="size-4" />
            New autofill rule
          </Button>
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
