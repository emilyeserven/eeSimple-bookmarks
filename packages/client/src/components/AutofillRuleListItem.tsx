import type { AutofillRule, Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FavoriteToggleButton, HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";
import { summarizeConditions } from "../lib/conditionsSummary";

import { Badge } from "@/components/ui/badge";

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
  const categoryName = rule.setCategoryId
    ? categories.find(category => category.id === rule.setCategoryId)?.name
    : null;
  const favorite = useFavoriteToggle("autofill");

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      renderExtra={() => (
        <FavoriteToggleButton
          isFavorite={Boolean(rule.isFavorite)}
          name={rule.name}
          onToggle={() => favorite.toggle({
            id: rule.id,
            name: rule.name,
            isFavorite: Boolean(rule.isFavorite),
          })}
        />
      )}
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
          title={t("View {{name}}", {
            name: rule.name,
          })}
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
            title={t("Edit {{name}}", {
              name: rule.name,
            })}
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
