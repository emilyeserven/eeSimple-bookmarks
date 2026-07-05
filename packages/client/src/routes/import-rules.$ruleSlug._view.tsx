import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useImportRuleBySlug, useDeleteImportRule } from "../hooks/useImportRules";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/import-rules/$ruleSlug/_view")({
  component: ImportRuleViewLayout,
});

const VIEW_TO_EDIT = {
  general: "/import-rules/$ruleSlug/edit/general",
  conditions: "/import-rules/$ruleSlug/edit/conditions",
} as const;
type ImportRuleEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

function ImportRuleViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    ruleSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const pathname = useRouterState({
    select: s => s.location.pathname,
  });
  const editRoute: ImportRuleEditRoute = (VIEW_TO_EDIT[pathname.split("/").at(-1) as keyof typeof VIEW_TO_EDIT] ?? VIEW_TO_EDIT.general) as ImportRuleEditRoute;
  const {
    rule, isLoading,
  } = useImportRuleBySlug(ruleSlug);
  const deleteRule = useDeleteImportRule();

  const viewNav = [
    {
      to: "/import-rules/$ruleSlug/general",
      label: t("General"),
    },
    {
      to: "/import-rules/$ruleSlug/conditions",
      label: t("Conditions"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
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
      nav={viewNav}
      params={{
        ruleSlug,
      }}
      navAriaLabel={t("Import rule sections")}
    />
  );
}
