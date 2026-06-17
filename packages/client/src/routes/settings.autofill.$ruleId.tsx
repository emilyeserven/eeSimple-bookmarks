import { Link, createFileRoute } from "@tanstack/react-router";

import { AutofillRuleForm } from "../components/AutofillRuleForm";
import {
  useAutofillRuleById,
  useDeleteAutofillRule,
  useUpdateAutofillRule,
} from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings/autofill/$ruleId")({
  component: AutofillRulePage,
});

const backLinkClass = `
  text-sm text-muted-foreground
  hover:text-foreground
`;

function AutofillRulePage() {
  const {
    ruleId,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    rule, isLoading, error,
  } = useAutofillRuleById(ruleId);
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
  const deleteRule = useDeleteAutofillRule();

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{error.message}</p>;

  if (!rule) {
    return (
      <section className="space-y-4">
        <Link
          to="/settings/autofill"
          className={backLinkClass}
        >
          ← Back to autofill
        </Link>
        <p className="text-destructive">Rule not found.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <Link
          to="/settings/autofill"
          className={backLinkClass}
        >
          ← Back to autofill
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">{rule.name}</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() =>
              deleteRule.mutate(rule.id, {
                onSuccess: () => {
                  void navigate({
                    to: "/settings/autofill",
                  });
                },
              })}
          >
            Delete
          </Button>
        </div>
      </div>

      <AutofillRuleForm
        rule={rule}
        categories={categories ?? []}
        properties={properties ?? []}
        tagTree={tagTree ?? []}
        submitLabel="Save changes"
        isError={updateRule.isError}
        errorMessage={updateRule.error?.message}
        onSubmit={input =>
          updateRule.mutate({
            id: rule.id,
            input,
          })}
      />
    </section>
  );
}
