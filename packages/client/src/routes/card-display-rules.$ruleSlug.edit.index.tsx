import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { cardDisplayRuleWorkbench } from "../components/workbench/cardDisplayRule";
import { EntityEditView } from "../components/workbench/EntityEditView";
import { useCardDisplayRuleBySlug, useDeleteCardDisplayRule } from "../hooks/useCardDisplayRules";

import { Button } from "@/components/ui/button";
import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/card-display-rules/$ruleSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: CardDisplayRuleEditPage,
});

function CardDisplayRuleEditPage() {
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
  } = useCardDisplayRuleBySlug(ruleSlug);
  const deleteRule = useDeleteCardDisplayRule();

  return (
    <EntityEditView
      workbench={cardDisplayRuleWorkbench}
      slug={ruleSlug}
      editTo="/card-display-rules/$ruleSlug/edit"
      params={{
        ruleSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/card-display-rules/$ruleSlug"
            params={{
              ruleSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to card display rule")}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? t("Edit card display rule") : (rule?.name ?? t("Card display rule not found"))}
            </h1>
            {rule && !rule.isDefault
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
                      to: "/card-display-rules",
                    }),
                  })}
                >
                  {deleteRule.isPending ? t("Deleting…") : t("Delete")}
                </Button>
              )
              : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("Changes save automatically as you edit.")}
          </p>
        </div>
      )}
    />
  );
}
