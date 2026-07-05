import { emptyConditionTree } from "@eesimple/types";
import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CardDisplayRulesList } from "../components/CardDisplayRulesList";
import { CardDisplayRulesSettings } from "../components/CardDisplayRulesSettings";
import { useCreateCardDisplayRule } from "../hooks/useCardDisplayRules";
import { CARD_DISPLAY_SCOPE_LABELS, useCardDisplayScope } from "../hooks/useCardDisplayScope";
import { useSetListingPage } from "../hooks/useListingPage";
import { validateCardDisplayListSearch } from "../lib/cardDisplayScope";

import { Button } from "@/components/ui/button";

/**
 * Card Display Rules listing: the single home for card display rules. Entity "Display Rules" tabs
 * redirect here pre-filtered to the entity they came from (`?scope=…&scopeSlug=…`); the scope lives in
 * the URL so the filtered view is a shareable, reload-safe deeplink. With no scope the full
 * drag-sortable rule list shows (each rule links to its own View/Edit pages); with a scope a clearable
 * chip sits above the scoped, non-sortable list (reordering a filtered subset is meaningless — priority
 * is global).
 */
export const Route = createFileRoute("/card-display-rules/")({
  validateSearch: validateCardDisplayListSearch,
  component: CardDisplayRulesPage,
});

function CardDisplayRulesPage() {
  const {
    t,
  } = useTranslation();
  const {
    scope, scopeSlug,
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    active, label, listProps,
  } = useCardDisplayScope(scope, scopeSlug);
  const create = useCreateCardDisplayRule();

  /** Create a blank rule and jump straight to its edit page (create flow, then per-field auto-save). */
  function handleAddRule() {
    create.mutate(
      {
        name: t("New rule"),
        conditions: emptyConditionTree(),
      },
      {
        onSuccess: (rule) => {
          if (rule.slug) {
            void navigate({
              to: "/card-display-rules/$ruleSlug/edit/general",
              params: {
                ruleSlug: rule.slug,
              },
            });
          }
        },
      },
    );
  }

  useSetListingPage("card-display-rules-listing", {
    createAction: handleAddRule,
    createLabel: t("New rule"),
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("Card Display Rules")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Control how bookmark cards display, based on prioritized rules. Drag to set priority.")}
        </p>
      </div>

      {active && scope
        ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="
                  inline-flex items-center gap-1 rounded-full border bg-muted
                  py-1 pr-1 pl-3 text-sm
                "
              >
                <span className="text-muted-foreground">
                  {t("Filtered to {{scopeLabel}}:", {
                    scopeLabel: CARD_DISPLAY_SCOPE_LABELS[scope],
                  })}
                </span>
                <span className="font-medium">{label ?? scopeSlug}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-5 rounded-full"
                  aria-label={t("Clear filter")}
                  onClick={() => navigate({
                    search: prev => ({
                      ...prev,
                      scope: undefined,
                      scopeSlug: undefined,
                    }),
                    replace: true,
                  })}
                >
                  <X className="size-3.5" />
                </Button>
              </span>
            </div>
            <CardDisplayRulesList {...listProps} />
          </>
        )
        : <CardDisplayRulesSettings />}
    </section>
  );
}
