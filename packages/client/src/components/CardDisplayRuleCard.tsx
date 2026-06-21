import type { CardDisplayRuleFormValues } from "./CardDisplayRuleForm";
import type { CardDisplayRule } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { ChevronDown, GripVertical, Lock } from "lucide-react";

import { CardDisplayRuleForm } from "./CardDisplayRuleForm";
import {
  useDeleteCardDisplayRule,
  useUpdateCardDisplayRule,
} from "../hooks/useCardDisplayRules";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CardDisplayRuleCardProps {
  rule: CardDisplayRule;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

const AUTOSAVE_DELAY_MS = 800;

/** A single rule row in the settings list: drag handle, name, and an expandable auto-saving editor. */
export function CardDisplayRuleCard({
  rule, dragHandleProps, isDragging,
}: CardDisplayRuleCardProps) {
  const [open, setOpen] = useState(false);
  const update = useUpdateCardDisplayRule();
  const remove = useDeleteCardDisplayRule();

  const latestValues = useRef<CardDisplayRuleFormValues | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  function handleFieldChange(values: CardDisplayRuleFormValues) {
    latestValues.current = values;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!latestValues.current) return;
      const v = latestValues.current;
      update.mutate({
        id: rule.id,
        input: {
          name: v.name.trim() || rule.name,
          description: v.description?.trim() || null,
          conditions: v.conditions,
          ...v.display,
        },
      });
    }, AUTOSAVE_DELAY_MS);
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "rounded-xl border bg-card transition-shadow",
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
        <span className="flex-1 text-base font-semibold">
          {rule.name}
          {rule.isDefault && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">baseline</span>
          )}
        </span>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={open ? "Collapse rule" : "Expand rule"}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180",
              )}
            />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-4 px-4 pb-4">
        {open
          ? (
            <CardDisplayRuleForm
              rule={rule}
              onChange={handleFieldChange}
              onCancel={() => setOpen(false)}
              onDelete={() => {
                if (confirm(`Delete rule "${rule.name}"?`)) {
                  remove.mutate(rule.id);
                }
              }}
              isDeleting={remove.isPending}
            />
          )
          : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
