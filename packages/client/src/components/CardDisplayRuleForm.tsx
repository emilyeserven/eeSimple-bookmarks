import type { RuleDisplayValue } from "./CardDisplayRuleDisplaySettings";
import type { CardDisplayRule, ConditionTree } from "@eesimple/types";

import { useRef, useState } from "react";

import { emptyConditionTree } from "@eesimple/types";

import { CardDisplayRuleDisplaySettings } from "./CardDisplayRuleDisplaySettings";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { ConditionsField } from "./conditions/ConditionsField";
import { conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export interface CardDisplayRuleFormValues {
  name: string;
  description: string | null;
  conditions: ConditionTree;
  display: RuleDisplayValue;
}

function initialFromRule(rule?: CardDisplayRule): CardDisplayRuleFormValues {
  return {
    name: rule?.name ?? "",
    description: rule?.description ?? "",
    conditions: rule?.conditions ?? emptyConditionTree(),
    display: {
      hiddenCardFields: rule?.hiddenCardFields ?? (rule?.isDefault ? [] : null),
      imageMode: rule?.imageMode ?? (rule?.isDefault ? "natural" : null),
      imageVisibility: rule?.imageVisibility ?? (rule?.isDefault ? "shown" : null),
      imageLayout: rule?.imageLayout ?? (rule?.isDefault ? "above" : null),
      cornerOverlays: rule?.cornerOverlays ?? (rule?.isDefault ? true : null),
      hideWebsiteForYouTube: rule?.hideWebsiteForYouTube ?? (rule?.isDefault ? false : null),
    },
  };
}

interface CardDisplayRuleFormProps {
  rule?: CardDisplayRule;
  /** Explicit-save mode (create): called when the Save button is clicked. */
  onSave?: (values: CardDisplayRuleFormValues) => void;
  /** Auto-save mode (edit): called on every field change so the parent can debounce + persist. */
  onChange?: (values: CardDisplayRuleFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
  /** When provided (editing a non-default rule), renders a Delete button. */
  onDelete?: () => void;
  isDeleting?: boolean;
}

/**
 * Create/edit form for a card display rule: name + description, a condition tree (the "when"), and the
 * per-card display overrides. The Default rule hides the name/description/conditions and edits only its
 * concrete display config.
 */
export function CardDisplayRuleForm({
  rule, onSave, onChange, onCancel, isPending, onDelete, isDeleting,
}: CardDisplayRuleFormProps) {
  const isDefault = rule?.isDefault ?? false;
  const initialValues = initialFromRule(rule);
  const [values, setValues] = useState<CardDisplayRuleFormValues>(initialValues);
  const valuesRef = useRef<CardDisplayRuleFormValues>(initialValues);

  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();

  function setFields(patch: Partial<CardDisplayRuleFormValues>): void {
    const next = {
      ...valuesRef.current,
      ...patch,
    };
    valuesRef.current = next;
    setValues(next);
    onChange?.(next);
  }

  function setDisplay(patch: Partial<RuleDisplayValue>): void {
    setFields({
      display: {
        ...valuesRef.current.display,
        ...patch,
      },
    });
  }

  const isAutoSave = onChange !== undefined;
  const idPrefix = `rule-${rule?.id ?? "new"}`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave?.({
      ...valuesRef.current,
      name: valuesRef.current.name.trim(),
      description: valuesRef.current.description?.trim() || null,
    });
  }

  const displayControls = (
    <CardDisplayRuleDisplaySettings
      idPrefix={idPrefix}
      value={values.display}
      onChange={setDisplay}
      properties={properties ?? []}
      isDefault={isDefault}
    />
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {isDefault
        ? (
          <>
            <p className="text-sm text-muted-foreground">
              The Default rule is the baseline applied to every bookmark card. Other rules override it
              for the bookmarks they match.
            </p>
            {displayControls}
          </>
        )
        : (
          <>
            <CollapsibleFormSection
              title="General"
              description="Name and optional note for this rule."
              defaultOpen
              preview={values.name.trim() || "Untitled rule"}
            >
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-name`}>Name</Label>
                <Input
                  id={`${idPrefix}-name`}
                  value={values.name}
                  onChange={e => setFields({
                    name: e.target.value,
                  })}
                  placeholder="Rule name"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-description`}>Description</Label>
                <Textarea
                  id={`${idPrefix}-description`}
                  value={values.description ?? ""}
                  onChange={e => setFields({
                    description: e.target.value,
                  })}
                  placeholder="Optional note"
                  rows={2}
                />
              </div>
            </CollapsibleFormSection>

            <Separator />

            <CollapsibleFormSection
              title="When"
              description="Which bookmarks this rule applies to. Combine conditions with AND/OR."
              defaultOpen={(rule?.conditions.children.length ?? 0) > 0}
              preview={conditionsSummaryLabel(values.conditions)}
            >
              <ConditionsField
                value={values.conditions}
                onChange={v => setFields({
                  conditions: v,
                })}
                categories={categories ?? []}
                properties={properties ?? []}
                tagTree={tagTree ?? []}
              />
            </CollapsibleFormSection>

            <Separator />

            <CollapsibleFormSection
              title="Display"
              description="How matching bookmark cards are shown. Unset attributes inherit from lower-priority rules."
              defaultOpen={!rule}
              preview="Card field & image overrides"
            >
              {displayControls}
            </CollapsibleFormSection>

            <Separator />

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Preview Bookmarks</h3>
                <p className="text-xs text-muted-foreground">
                  Which existing bookmarks match this rule.
                </p>
              </div>
              <PreviewBookmarksSection conditions={values.conditions} />
            </section>
          </>
        )}

      <Separator />

      <div className="flex flex-wrap gap-2">
        {isAutoSave
          ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Done
            </Button>
          )
          : (
            <>
              <Button
                type="submit"
                disabled={isPending || !values.name.trim()}
              >
                {isPending ? "Saving…" : "Save rule"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            </>
          )}
        {onDelete && !isDefault
          ? (
            <Button
              type="button"
              variant="destructive"
              className="ml-auto"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete rule"}
            </Button>
          )
          : null}
      </div>
    </form>
  );
}
