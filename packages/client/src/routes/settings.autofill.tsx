import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesFilterBar } from "../components/AutofillRulesFilterBar";
import { AutofillRulesList } from "../components/AutofillRulesList";
import { useAutofillFacets } from "../hooks/useAutofillScope";
import { useSetListingPage } from "../hooks/useListingPage";
import { useNewAutofillRule } from "../hooks/useNewAutofillRule";
import { validateAutofillListSearch } from "../lib/autofillScope";

/**
 * Settings → Autofill: the single home for autofill rules. A filter bar (text search + one dropdown per
 * filterable facet: category / website / tag / media type / YouTube channel / custom property) narrows
 * the list; the facets combine (AND). Entity "Autofill Rules" tabs redirect here pre-filtered to the
 * facet they came from. All filter state lives in the URL so the filtered view is a shareable,
 * reload-safe deeplink.
 */
export const Route = createFileRoute("/settings/autofill")({
  validateSearch: validateAutofillListSearch,
  component: AutofillSettingsPage,
});

function AutofillSettingsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    listProps, noCategory,
  } = useAutofillFacets(search);
  const newRule = useNewAutofillRule();
  useSetListingPage("autofill-rules-listing", false, false, false, newRule.openModal);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Autofill Rules</h2>
        <p className="text-sm text-muted-foreground">
          Define rules that match a bookmark&apos;s title or website and prefill its category, tags, and
          custom properties when you add it. Select a rule to edit it, or create a new one.
        </p>
      </div>

      <AutofillRulesFilterBar
        search={search}
        onChange={patch => navigate({
          search: prev => ({
            ...prev,
            ...patch,
          }),
          replace: true,
        })}
      />

      <AutofillRulesList
        {...listProps}
        noCategory={noCategory}
        query={search.q ?? ""}
      />

      {newRule.modal}
    </section>
  );
}
