import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useAutofillRuleBySlug, useDeleteAutofillRule } from "../hooks/useAutofill";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/autofill/$ruleSlug/_view")({
  component: AutofillRuleViewLayout,
});

function AutofillRuleViewLayout() {
  const {
    ruleSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    rule, isLoading,
  } = useAutofillRuleBySlug(ruleSlug);
  const deleteRule = useDeleteAutofillRule();

  const viewNav = [
    {
      to: "/autofill/$ruleSlug/general",
      label: "General",
    },
    {
      to: "/autofill/$ruleSlug/conditions",
      label: "Conditions",
    },
    {
      to: "/autofill/$ruleSlug/prefill",
      label: "Prefill",
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/autofill"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to autofill rules
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? "Autofill rule" : (rule?.name ?? "Autofill rule not found")}
            </h1>
            {rule
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/autofill/$ruleSlug/edit/general"
                      params={{
                        ruleSlug,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      text-destructive
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
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        ruleSlug,
      }}
      navAriaLabel="Autofill rule sections"
    />
  );
}
