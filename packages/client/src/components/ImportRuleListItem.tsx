import type { ImportRule, ImportRuleAction } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { summarizeConditions } from "../lib/conditionsSummary";

import { Badge } from "@/components/ui/badge";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

const ACTION_BADGE_VARIANTS: Record<ImportRuleAction, "default" | "secondary" | "destructive" | "outline"> = {
  approve: "default",
  reject: "secondary",
  block: "destructive",
};

const ACTION_LABELS: Record<ImportRuleAction, string> = {
  approve: "Approve",
  reject: "Reject",
  block: "Block",
};

interface ImportRuleListItemProps {
  rule: ImportRule;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

export function ImportRuleListItem({
  rule, selectable, selected, onSelectToggle, inSelectionMode,
}: ImportRuleListItemProps) {
  const {
    t,
  } = useTranslation();
  const viewClick = useViewPanelClick();
  const editClick = useEditPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      title={rule.name}
      titleAdornment={(
        <Badge variant={ACTION_BADGE_VARIANTS[rule.action]}>
          {t(ACTION_LABELS[rule.action])}
        </Badge>
      )}
      subtitle={summarizeConditions(rule.conditions)}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/import-rules/$ruleSlug"
          params={{
            ruleSlug: rule.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "import-rule", rule.id, rule.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/import-rules/$ruleSlug/edit"
            params={{
              ruleSlug: rule.slug,
            }}
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "import-rule", rule.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("Edit {{name}}", {
              name: rule.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
