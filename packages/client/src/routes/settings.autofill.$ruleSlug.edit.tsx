import { Link, createFileRoute } from "@tanstack/react-router";

import { AutofillRuleForm } from "../components/AutofillRuleForm";
import { TaxonomyDetailLayout } from "../components/TaxonomyDetailLayout";
import { useAutofillRuleBySlug, useUpdateAutofillRule } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";

export const Route = createFileRoute("/settings/autofill/$ruleSlug/edit")({
  component: AutofillRuleEditPage,
});

function AutofillRuleEditPage() {
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
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();
  const updateRule = useUpdateAutofillRule();

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
        <section className="space-y-6">
          <div className="space-y-1">
            <Link
              to="/settings/autofill/$ruleSlug"
              params={{
                ruleSlug,
              }}
              className="
                text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              ← Back to {r.name}
            </Link>
            <h1 className="text-2xl font-bold">Edit autofill rule</h1>
          </div>
          <AutofillRuleForm
            rule={r}
            categories={categories ?? []}
            properties={properties ?? []}
            tagTree={tagTree ?? []}
            submitLabel="Save changes"
            isError={updateRule.isError}
            errorMessage={updateRule.error?.message}
            onSubmit={input =>
              updateRule.mutate(
                {
                  id: r.id,
                  input,
                },
                {
                  onSuccess: updated =>
                    void navigate({
                      to: "/settings/autofill/$ruleSlug",
                      params: {
                        ruleSlug: updated.slug,
                      },
                    }),
                },
              )}
          />
        </section>
      )}
    </TaxonomyDetailLayout>
  );
}
