import { Link, createFileRoute } from "@tanstack/react-router";

import { AutofillRuleDetail } from "../components/AutofillRuleDetail";
import { useAutofillRuleBySlug, useDeleteAutofillRule } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";

export const Route = createFileRoute("/settings/autofill/$ruleSlug/")({
  component: AutofillRuleViewPage,
});

function AutofillRuleViewPage() {
  const {
    ruleSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    rule, isLoading, error,
  } = useAutofillRuleBySlug(ruleSlug);
  const {
    data: categories,
  } = useCategories();
  const deleteRule = useDeleteAutofillRule();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading rule…</p>;
  }

  if (error || !rule) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error?.message ?? "Autofill rule not found."}</p>
        <Link
          to="/settings/autofill"
          className="
            text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          ← Back to autofill rules
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <Link
        to="/settings/autofill"
        className="
          inline-block text-sm text-muted-foreground
          hover:text-foreground
        "
      >
        ← Back to autofill rules
      </Link>
      <AutofillRuleDetail
        rule={rule}
        categories={categories ?? []}
        onEdit={() => void navigate({
          to: "/settings/autofill/$ruleSlug/edit",
          params: {
            ruleSlug,
          },
        })}
        onDelete={() =>
          deleteRule.mutate(rule.id, {
            onSuccess: () => void navigate({
              to: "/settings/autofill",
            }),
          })}
        deleteIsPending={deleteRule.isPending}
      />
    </section>
  );
}
