import type { AutofillRule, Category } from "@eesimple/types";

import { LabeledSection } from "./LabeledSection";
import { summarizeConditions } from "../lib/conditionsSummary";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AutofillRuleDetailProps {
  rule: AutofillRule;
  categories: Category[];
  onEdit?: () => void;
  onDelete?: () => void;
  deleteIsPending?: boolean;
}

/** Read-only view of a single autofill rule — shared by the full-page view and the panel View mode. */
export function AutofillRuleDetail({
  rule, categories, onEdit, onDelete, deleteIsPending,
}: AutofillRuleDetailProps) {
  const categoryName = rule.setCategoryId
    ? (categories.find(c => c.id === rule.setCategoryId)?.name ?? null)
    : null;

  const prefillParts: string[] = [];
  if (categoryName) prefillParts.push(`Category: ${categoryName}`);
  if (rule.tagIds.length > 0) {
    prefillParts.push(`${rule.tagIds.length} ${rule.tagIds.length === 1 ? "tag" : "tags"}`);
  }
  const propertyCount = rule.numberValues.length + rule.booleanValues.length;
  if (propertyCount > 0) {
    prefillParts.push(`${propertyCount} ${propertyCount === 1 ? "property" : "properties"}`);
  }
  const prefillSummary = prefillParts.length > 0 ? prefillParts.join(" · ") : "Nothing prefilled";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{rule.name}</h2>
          {rule.description
            ? <p className="text-sm text-muted-foreground">{rule.description}</p>
            : null}
        </div>
        <div className="flex gap-2">
          {onEdit
            ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                Edit
              </Button>
            )
            : null}
          {onDelete
            ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={deleteIsPending}
                onClick={onDelete}
              >
                {deleteIsPending ? "Deleting…" : "Delete"}
              </Button>
            )
            : null}
        </div>
      </div>

      <Separator />

      <LabeledSection
        title="Activation Conditions"
        description={summarizeConditions(rule.conditions)}
      />

      <Separator />

      <LabeledSection
        title="What Gets Prefilled"
        description={prefillSummary}
      />

      <Separator />

      <p className="text-xs text-muted-foreground">Priority: {rule.sortOrder}</p>
    </div>
  );
}
