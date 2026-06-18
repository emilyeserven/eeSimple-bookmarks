import { createFileRoute } from "@tanstack/react-router";

import { AutofillRuleDetail } from "../components/AutofillRuleDetail";
import { TaxonomyDetailLayout } from "../components/TaxonomyDetailLayout";
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

  return (
    <TaxonomyDetailLayout
      isLoading={isLoading}
      error={error}
      entity={rule}
      loadingLabel="Loading rule…"
      notFoundMessage="Autofill rule not found."
      listHref="/settings/autofill"
      listLabel="Back to autofill rules"
    >
      {r => (
        <section className="space-y-4">
          <AutofillRuleDetail
            rule={r}
            categories={categories ?? []}
            onEdit={() => void navigate({
              to: "/settings/autofill/$ruleSlug/edit",
              params: {
                ruleSlug,
              },
            })}
            onDelete={() =>
              deleteRule.mutate(r.id, {
                onSuccess: () => void navigate({
                  to: "/settings/autofill",
                }),
              })}
            deleteIsPending={deleteRule.isPending}
          />
        </section>
      )}
    </TaxonomyDetailLayout>
  );
}
