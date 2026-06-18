import type { AutofillRule, Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { summarizeConditions } from "../lib/conditionsSummary";

import { Badge } from "@/components/ui/badge";
import { RowCard } from "@/components/ui/card";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

interface RuleListItemProps {
  rule: AutofillRule;
  categories: Category[];
}

/** A single read-only rule card that navigates to the rule's full-page view. */
export function AutofillRuleListItem({
  rule, categories,
}: RuleListItemProps) {
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const categoryName = rule.setCategoryId
    ? categories.find(category => category.id === rule.setCategoryId)?.name
    : null;

  return (
    <Link
      to="/autofill/$ruleSlug"
      params={{
        ruleSlug: rule.slug,
      }}
      title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
      onClick={event => viewClick(event, "autofill", rule.id)}
      className="block w-full text-left"
    >
      <RowCard
        className="
          transition-colors
          hover:border-ring hover:bg-accent/40
        "
      >
        <div className="flex flex-wrap items-center gap-2 p-4">
          <span className="leading-none font-semibold">{rule.name}</span>
          <span className="text-xs text-muted-foreground">
            {summarizeConditions(rule.conditions)}
          </span>
          {categoryName ? <Badge variant="secondary">{categoryName}</Badge> : null}
        </div>
      </RowCard>
    </Link>
  );
}
