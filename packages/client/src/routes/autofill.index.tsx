import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { ALL_CATEGORIES } from "../components/AutofillRulesToolbar";
import { useAutofillRules } from "../hooks/useAutofill";
import { useSetListingPage } from "../hooks/useListingPage";
import { useNewAutofillRule } from "../hooks/useNewAutofillRule";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";

import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/stores/uiStore";

export const Route = createFileRoute("/autofill/")({
  component: AutofillListPage,
});

function AutofillListPage() {
  const {
    data: rules,
  } = useAutofillRules();
  const newRule = useNewAutofillRule();
  useSetListingPage("autofill-rules-listing", false, false, false, newRule.openModal);

  // The top-level listing keeps its filters ephemeral: text from the global header search, category
  // from local state (the deeplinkable variant lives on Settings → Autofill).
  useRegisterHeaderSearch();
  const query = useUiStore(state => state.headerSearchQuery);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);

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

      <AutofillRulesList
        query={query}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      {newRule.modal}
    </section>
  );
}
