import type { AutofillRule, Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil, Wand2 } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { summarizeConditions } from "../lib/conditionsSummary";

import { Badge } from "@/components/ui/badge";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

interface RuleListItemProps {
  rule: AutofillRule;
  categories: Category[];
}

/**
 * A single autofill-rule card. Exception to the standard: the body links to the rule's info page
 * (rules aren't a bookmark filter) and there is no Info hover button. The badge counts the existing
 * bookmarks the rule currently matches (`matchCount`).
 */
export function AutofillRuleListItem({
  rule, categories,
}: RuleListItemProps) {
  const viewClick = useViewPanelClick();
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const categoryName = rule.setCategoryId
    ? categories.find(category => category.id === rule.setCategoryId)?.name
    : null;

  return (
    <StandardListingCard
      icon={<Wand2 className="size-5 shrink-0 text-muted-foreground" />}
      title={rule.name}
      titleAdornment={categoryName ? <Badge variant="secondary">{categoryName}</Badge> : undefined}
      subtitle={summarizeConditions(rule.conditions)}
      count={rule.matchCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/autofill/$ruleSlug"
          params={{
            ruleSlug: rule.slug,
          }}
          title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => viewClick(event, "autofill", rule.id)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/autofill/$ruleSlug/edit"
            params={{
              ruleSlug: rule.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "autofill", rule.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {rule.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
