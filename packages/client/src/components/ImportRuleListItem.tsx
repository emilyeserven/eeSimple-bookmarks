import type { ImportRule, ImportRuleAction } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { summarizeConditions } from "../lib/conditionsSummary";

import { Badge } from "@/components/ui/badge";

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
            to="/import-rules/$ruleSlug/edit"
            params={{
              ruleSlug: rule.slug,
            }}
            title={t("Edit {{name}}", {
              name: rule.name,
            })}
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
