import type { AutofillRule, Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { summarizeConditions } from "../lib/conditionsSummary";

import { Badge } from "@/components/ui/badge";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

interface RuleListItemProps {
  rule: AutofillRule;
  categories: Category[];
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/**
 * A single autofill-rule card. Exception to the standard: the body links to the rule's info page
 * (rules aren't a bookmark filter) and there is no Info hover button. The badge counts the existing
 * bookmarks the rule currently matches (`matchCount`).
 */
export function AutofillRuleListItem({
  rule, categories, selectable, selected, onSelectToggle, inSelectionMode,
}: RuleListItemProps) {
  const {
    t,
  } = useTranslation();
  const viewClick = useViewPanelClick();
  const editClick = useEditPanelClick();
  const modifier = useSidebarOpenModifier();
  const categoryName = rule.setCategoryId
    ? categories.find(category => category.id === rule.setCategoryId)?.name
    : null;

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
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
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "autofill", rule.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">
              {t("Edit {{name}}", {
                name: rule.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
