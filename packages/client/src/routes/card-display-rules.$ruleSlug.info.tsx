import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { cardDisplayRuleWorkbench } from "../components/workbench/cardDisplayRule";
import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { useCardDisplayRuleBySlug, useDeleteCardDisplayRule } from "../hooks/useCardDisplayRules";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/card-display-rules/$ruleSlug/info")({
  validateSearch: validateInfoTabSearch,
  component: CardDisplayRuleInfoTab,
});

const VIEW_TO_EDIT = {
  general: "/card-display-rules/$ruleSlug/edit/general",
  conditions: "/card-display-rules/$ruleSlug/edit/conditions",
  display: "/card-display-rules/$ruleSlug/edit/display",
} as const;
type CardDisplayRuleEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

function CardDisplayRuleInfoTab() {
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
  const editRoute: CardDisplayRuleEditRoute
    = (VIEW_TO_EDIT[(tab ?? "general") as keyof typeof VIEW_TO_EDIT] ?? VIEW_TO_EDIT.general) as CardDisplayRuleEditRoute;
  const {
    rule, isLoading,
  } = useCardDisplayRuleBySlug(ruleSlug);
  const deleteRule = useDeleteCardDisplayRule();

  return (
    <EntityInfoView
      workbench={cardDisplayRuleWorkbench}
      slug={ruleSlug}
      infoTo="/card-display-rules/$ruleSlug/info"
      params={{
        ruleSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/card-display-rules"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to card display rules")}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? t("Card display rule") : (rule?.name ?? t("Card display rule not found"))}
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
                  {rule.isDefault
                    ? null
                    : (
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
                            to: "/card-display-rules",
                          }),
                        })}
                      >
                        {deleteRule.isPending ? t("Deleting…") : t("Delete")}
                      </Button>
                    )}
                </div>
              )
              : null}
          </div>
        </div>
      )}
    />
  );
}
