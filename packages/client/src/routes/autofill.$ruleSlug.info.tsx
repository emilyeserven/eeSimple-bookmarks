import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { autofillWorkbench } from "../components/workbench/autofill";
import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { useAutofillRuleBySlug, useDeleteAutofillRule } from "../hooks/useAutofill";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/autofill/$ruleSlug/info")({
  validateSearch: validateInfoTabSearch,
  component: AutofillRuleInfoTab,
});

function AutofillRuleInfoTab() {
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
    <EntityInfoView
      workbench={autofillWorkbench}
      slug={ruleSlug}
      infoTo="/autofill/$ruleSlug/info"
      params={{
        ruleSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/autofill"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to autofill rules")}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? t("Autofill rule") : (rule?.name ?? t("Autofill rule not found"))}
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
                      to="/autofill/$ruleSlug/edit"
                      params={{
                        ruleSlug,
                      }}
                      search={{
                        tab,
                      }}
                    >
                      {t("Edit")}
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
                    {deleteRule.isPending ? t("Deleting…") : t("Delete")}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
    />
  );
}
