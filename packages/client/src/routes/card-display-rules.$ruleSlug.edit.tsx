import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useCardDisplayRuleBySlug, useDeleteCardDisplayRule } from "../hooks/useCardDisplayRules";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/card-display-rules/$ruleSlug/edit")({
  component: CardDisplayRuleEditLayout,
});

function CardDisplayRuleEditLayout() {
  const {
    ruleSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    rule, isLoading,
  } = useCardDisplayRuleBySlug(ruleSlug);
  const deleteRule = useDeleteCardDisplayRule();

  // The Default rule matches every card unconditionally, so it has no Conditions tab.
  const editNav = [
    {
      to: "/card-display-rules/$ruleSlug/edit/general",
      label: "General",
    },
    ...(rule?.isDefault
      ? []
      : [{
        to: "/card-display-rules/$ruleSlug/edit/conditions",
        label: "Conditions",
      } as const]),
    {
      to: "/card-display-rules/$ruleSlug/edit/display",
      label: "Display",
    },
  ] as const;

  return (
    <TabbedEntityLayout
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
            ← Back to card display rule
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? "Edit card display rule" : (rule?.name ?? "Card display rule not found")}
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
                  {deleteRule.isPending ? "Deleting…" : "Delete"}
                </Button>
              )
              : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Changes save automatically as you edit.
          </p>
        </div>
      )}
      nav={editNav}
      params={{
        ruleSlug,
      }}
      navAriaLabel="Card display rule edit sections"
    />
  );
}
