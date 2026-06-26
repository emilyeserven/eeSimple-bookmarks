import type { ImportRule, ImportRuleAction } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

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
}

export function ImportRuleListItem({
  rule,
}: ImportRuleListItemProps) {
  const viewClick = useViewPanelClick();
  const editClick = useEditPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <StandardListingCard
      title={rule.name}
      titleAdornment={(
        <Badge variant={ACTION_BADGE_VARIANTS[rule.action]}>
          {ACTION_LABELS[rule.action]}
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
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "import-rule", rule.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {rule.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
