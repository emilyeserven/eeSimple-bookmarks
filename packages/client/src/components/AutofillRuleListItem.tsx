import type { AutofillRule, Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { summarizeConditions } from "../lib/conditionsSummary";

import { Badge } from "@/components/ui/badge";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

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
  const modifier = useSidebarOpenModifier();
  const categoryName = rule.setCategoryId
    ? categories.find(category => category.id === rule.setCategoryId)?.name
    : null;

  return (
    <StandardListingCard
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
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "autofill", rule.id, rule.slug)}
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
