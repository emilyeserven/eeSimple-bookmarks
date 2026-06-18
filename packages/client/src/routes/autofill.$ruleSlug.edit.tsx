import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useAutofillRuleBySlug } from "../hooks/useAutofill";

export const Route = createFileRoute("/autofill/$ruleSlug/edit")({
  component: AutofillRuleEditLayout,
});

function AutofillRuleEditLayout() {
  const {
    ruleSlug,
  } = Route.useParams();
  const {
    rule, isLoading,
  } = useAutofillRuleBySlug(ruleSlug);

  const editNav = [
    {
      to: "/autofill/$ruleSlug/edit/general",
      label: "General",
    },
    {
      to: "/autofill/$ruleSlug/edit/conditions",
      label: "Conditions",
    },
    {
      to: "/autofill/$ruleSlug/edit/prefill",
      label: "Prefill",
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/autofill/$ruleSlug"
            params={{
              ruleSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to autofill rule
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading ? "Edit autofill rule" : (rule?.name ?? "Autofill rule not found")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Edit the general details, activation conditions, and prefill actions for this rule.
          </p>
        </div>
      )}
      nav={editNav}
      params={{
        ruleSlug,
      }}
      navAriaLabel="Autofill rule edit sections"
    />
  );
}
