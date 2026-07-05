import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useCardDisplayRuleBySlug, useDeleteCardDisplayRule } from "../hooks/useCardDisplayRules";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/card-display-rules/$ruleSlug/_view")({
  component: CardDisplayRuleViewLayout,
});

const VIEW_TO_EDIT = {
  general: "/card-display-rules/$ruleSlug/edit/general",
  conditions: "/card-display-rules/$ruleSlug/edit/conditions",
  display: "/card-display-rules/$ruleSlug/edit/display",
} as const;
type CardDisplayRuleEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

function CardDisplayRuleViewLayout() {
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
  const editRoute: CardDisplayRuleEditRoute
    = (VIEW_TO_EDIT[pathname.split("/").at(-1) as keyof typeof VIEW_TO_EDIT] ?? VIEW_TO_EDIT.general) as CardDisplayRuleEditRoute;
  const {
    rule, isLoading,
  } = useCardDisplayRuleBySlug(ruleSlug);
  const deleteRule = useDeleteCardDisplayRule();

  // The Default rule matches every card unconditionally, so it has no Conditions tab.
  const viewNav = [
    {
      to: "/card-display-rules/$ruleSlug/general",
      label: t("General"),
    },
    ...(rule?.isDefault
      ? []
      : [{
        to: "/card-display-rules/$ruleSlug/conditions",
        label: t("Conditions"),
      } as const]),
    {
      to: "/card-display-rules/$ruleSlug/display",
      label: t("Display"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
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
      nav={viewNav}
      params={{
        ruleSlug,
      }}
      navAriaLabel={t("Card display rule sections")}
    />
  );
}
