import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { FacetSelect } from "../components/AutofillRulesFilterBar";
import { AutofillRulesList } from "../components/AutofillRulesList";
import { useAutofillRules } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useSetListingPage } from "../hooks/useListingPage";
import { useNewAutofillRule } from "../hooks/useNewAutofillRule";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { NO_CATEGORY } from "../lib/autofillScope";

import { Badge } from "@/components/ui/badge";
import { SelectItem } from "@/components/ui/select";
import { useUiStore } from "@/stores/uiStore";

export const Route = createFileRoute("/autofill/")({
  component: AutofillListPage,
});

function AutofillListPage() {
  const {
    data: rules,
  } = useAutofillRules();
  const {
    data: categories = [],
  } = useCategories();
  const newRule = useNewAutofillRule();
  useSetListingPage("autofill-rules-listing", false, false, false, newRule.openModal);

  // The top-level listing keeps its filters ephemeral: text from the global header search, category
  // from local state (the deeplinkable, multi-facet variant lives on Settings → Autofill).
  useRegisterHeaderSearch();
  const query = useUiStore(state => state.headerSearchQuery);
  // Holds a category id, the NO_CATEGORY sentinel, or undefined for "all".
  const [category, setCategory] = useState<string | undefined>(undefined);

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

      <div className="flex flex-wrap items-center gap-3">
        <FacetSelect
          label="categories"
          value={category}
          options={categories.map(item => ({
            value: item.id,
            label: item.name,
          }))}
          onChange={setCategory}
        >
          <SelectItem value={NO_CATEGORY}>No category</SelectItem>
        </FacetSelect>
      </div>

      <AutofillRulesList
        query={query}
        categoryId={category && category !== NO_CATEGORY ? category : undefined}
        noCategory={category === NO_CATEGORY}
      />

      {newRule.modal}
    </section>
  );
}
