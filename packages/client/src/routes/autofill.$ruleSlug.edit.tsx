import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useAutofillRuleBySlug, useDeleteAutofillRule } from "../hooks/useAutofill";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/autofill/$ruleSlug/edit")({
  component: AutofillRuleEditLayout,
});

function AutofillRuleEditLayout() {
  const {
    ruleSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    rule, isLoading,
  } = useAutofillRuleBySlug(ruleSlug);
  const deleteRule = useDeleteAutofillRule();

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
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? "Edit autofill rule" : (rule?.name ?? "Autofill rule not found")}
            </h1>
            {rule
              ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="
                    shrink-0 text-destructive
                    hover:text-destructive
                  "
                  disabled={deleteRule.isPending}
                  onClick={() => deleteRule.mutate(rule.id, {
                    onSuccess: () => navigate({
                      to: "/autofill",
                    }),
                  })}
                >
                  {deleteRule.isPending ? "Deleting…" : "Delete"}
                </Button>
              )
              : null}
          </div>
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
