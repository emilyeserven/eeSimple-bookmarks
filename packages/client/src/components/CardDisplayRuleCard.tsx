import type { CardDisplayRule } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { GripVertical, Info, Lock, Pencil, Trash2 } from "lucide-react";

import { conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { useDeleteCardDisplayRule } from "../hooks/useCardDisplayRules";

import { usePanelControls } from "@/components/panel/usePanelControls";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardDisplayRuleCardProps {
  rule: CardDisplayRule;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

/**
 * A single rule row in the settings/scoped lists: drag handle, name (links to the rule's View page),
 * a condition summary, and hover-light Edit / Info / Delete controls. Editing happens on the rule's
 * own View/Edit pages (or the right panel via Info) — the row no longer expands an inline editor.
 */
export function CardDisplayRuleCard({
  rule, dragHandleProps, isDragging,
}: CardDisplayRuleCardProps) {
  const remove = useDeleteCardDisplayRule();
  const {
    openItem,
  } = usePanelControls();
  const ruleSlug = rule.slug ?? "";

  return (
    <RowCard
      className={cn(
        "group transition-shadow",
        isDragging && "shadow-lg",
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        {rule.isDefault
          ? (
            <span
              className="text-muted-foreground"
              aria-label="Default rule (pinned last)"
            >
              <Lock className="size-4" />
            </span>
          )
          : (
            <button
              type="button"
              className="
                cursor-grab touch-none text-muted-foreground
                hover:text-foreground
              "
              aria-label="Drag to reorder"
              {...dragHandleProps}
            >
              <GripVertical className="size-4" />
            </button>
          )}

        <Link
          to="/card-display-rules/$ruleSlug"
          params={{
            ruleSlug,
          }}
          className="min-w-0 flex-1"
        >
          <span className="block truncate text-base font-semibold">
            {rule.name}
            {rule.isDefault && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">baseline</span>
            )}
          </span>
          {rule.isDefault
            ? null
            : (
              <span className="block truncate text-sm text-muted-foreground">
                {conditionsSummaryLabel(rule.conditions)}
              </span>
            )}
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8"
          >
            <Link
              to="/card-display-rules/$ruleSlug/edit/general"
              params={{
                ruleSlug,
              }}
              aria-label={`Edit ${rule.name}`}
            >
              <Pencil className="size-4" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Info about ${rule.name}`}
            onClick={() => openItem("card-display-rule", rule.id, "view")}
          >
            <Info className="size-4" />
          </Button>
          {rule.isDefault
            ? null
            : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="
                  size-8 text-destructive
                  hover:text-destructive
                "
                aria-label={`Delete ${rule.name}`}
                disabled={remove.isPending}
                onClick={() => {
                  if (confirm(`Delete rule "${rule.name}"?`)) remove.mutate(rule.id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
        </div>
      </div>
    </RowCard>
  );
}
