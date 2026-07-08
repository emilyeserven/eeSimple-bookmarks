import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { autofillWorkbench } from "../components/workbench/autofill";
import { EntityEditView } from "../components/workbench/EntityEditView";
import { useAutofillRuleBySlug, useDeleteAutofillRule } from "../hooks/useAutofill";

import { Button } from "@/components/ui/button";
import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/autofill/$ruleSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: AutofillRuleEditPage,
});

function AutofillRuleEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    ruleSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    rule, isLoading,
  } = useAutofillRuleBySlug(ruleSlug);
  const deleteRule = useDeleteAutofillRule();

  return (
    <EntityEditView
      workbench={autofillWorkbench}
      slug={ruleSlug}
      editTo="/autofill/$ruleSlug/edit"
      params={{
        ruleSlug,
      }}
      activeTab={tab}
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
            {t("← Back to autofill rule")}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? t("Edit autofill rule") : (rule?.name ?? t("Autofill rule not found"))}
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
                  {deleteRule.isPending ? t("Deleting…") : t("Delete")}
                </Button>
              )
              : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("Edit the general details, activation conditions, and prefill actions for this rule.")}
          </p>
        </div>
      )}
    />
  );
}
