import type { AutofillListSearch } from "../lib/autofillScope";

import { Link, createFileRoute } from "@tanstack/react-router";

import { AutofillFilterSidebar } from "../components/AutofillFilterSidebar";
import { AutofillRulesList } from "../components/AutofillRulesList";
import { useAutofillRules } from "../hooks/useAutofill";
import { useAutofillFacets } from "../hooks/useAutofillScope";
import { useSetListingPage } from "../hooks/useListingPage";
import { useNewAutofillRule } from "../hooks/useNewAutofillRule";
import { validateAutofillListSearch } from "../lib/autofillScope";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/autofill/")({
  validateSearch: validateAutofillListSearch,
  component: AutofillListPage,
});

function AutofillListPage() {
  const {
    data: rules,
  } = useAutofillRules();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    listProps, noCategory,
  } = useAutofillFacets(search);
  const newRule = useNewAutofillRule();
  useSetListingPage("autofill-rules-listing", false, false, false, newRule.openModal, false, {
    createLabel: "New rule",
  });

  function onChange(patch: Partial<AutofillListSearch>) {
    void navigate({
      search: prev => ({
        ...prev,
        ...patch,
      }),
      replace: true,
    });
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Autofill Rules</h2>
          {rules
            ? <Badge variant="secondary">{rules.length}</Badge>
            : null}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            <Link to="/autofill/backfill">Backfill</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Define rules that match a bookmark&apos;s title or website and prefill its category, tags, and
          custom properties when you add it. Select a rule to edit it, or create a new one.
        </p>
      </div>

      <div
        className="
          grid gap-6
          lg:grid-cols-[16rem_1fr]
        "
      >
        <AutofillFilterSidebar
          search={search}
          onChange={onChange}
        />

        <div>
          <AutofillRulesList
            {...listProps}
            noCategory={noCategory}
            query={search.q ?? ""}
          />
        </div>
      </div>

      {newRule.modal}
    </section>
  );
}
