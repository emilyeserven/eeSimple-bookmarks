import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { importRuleWorkbench } from "../components/workbench/importRule";
import { useImportRuleBySlug, useDeleteImportRule } from "../hooks/useImportRules";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/import-rules/$ruleSlug/info")({
  validateSearch: validateInfoTabSearch,
  component: ImportRuleInfoTab,
});

const VIEW_TO_EDIT = {
  general: "/import-rules/$ruleSlug/edit/general",
  conditions: "/import-rules/$ruleSlug/edit/conditions",
} as const;
type ImportRuleEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

function ImportRuleInfoTab() {
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
  const editRoute: ImportRuleEditRoute
    = (VIEW_TO_EDIT[(tab ?? "general") as keyof typeof VIEW_TO_EDIT] ?? VIEW_TO_EDIT.general) as ImportRuleEditRoute;
  const {
    rule, isLoading,
  } = useImportRuleBySlug(ruleSlug);
  const deleteRule = useDeleteImportRule();

  return (
    <EntityInfoView
      workbench={importRuleWorkbench}
      slug={ruleSlug}
      infoTo="/import-rules/$ruleSlug/info"
      params={{
        ruleSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/import-rules"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to import rules")}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? t("Import rule") : (rule?.name ?? t("Import rule not found"))}
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
                      to={editRoute}
                      params={{
                        ruleSlug,
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
                        to: "/import-rules",
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
