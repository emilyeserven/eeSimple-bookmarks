// This module pairs the autofill rule form with the `NO_CATEGORY` sentinel its consumers reuse.

import type {
  AutofillRule,
  Category,
  ConditionTree,
  CreateAutofillRuleInput,
  CustomProperty,
  TagNode,
} from "@eesimple/types";

import { useState } from "react";

import { emptyConditionTree } from "@eesimple/types";
import { z } from "zod";

import { autofillConditionsValidator } from "../lib/conditionsSchema";
import { useAppForm } from "../lib/form";
import { ConditionsField } from "./conditions/ConditionsField";
import { TagPicker } from "./TagPicker";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Sentinel select value standing in for "no category" (Radix selects can't hold an empty value). */
export const NO_CATEGORY = "none";

const ruleSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  setCategoryId: z.string(),
  tagIds: z.array(z.string()),
  sortOrder: z.number().int(),
});

interface AutofillRuleFormProps {
  rule?: AutofillRule;
  categories: Category[];
  properties: CustomProperty[];
  tagTree: TagNode[];
  /** Preselected target category for a new rule (e.g. when creating from a category's edit page). */
  defaultCategoryId?: string;
  submitLabel: string;
  resetOnSubmit?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onSubmit: (input: CreateAutofillRuleInput) => void;
}

/** Shared create/edit form for an autofill rule: a "when" condition tree plus "then" actions. */
export function AutofillRuleForm({
  rule, categories, properties, tagTree, defaultCategoryId, submitLabel, resetOnSubmit, isError, errorMessage, onSubmit,
}: AutofillRuleFormProps) {
  // The condition tree and custom-property values live outside the typed form (they're dynamic and,
  // for the recursive tree, would blow up TanStack Form's deep type inference).
  const [conditions, setConditions] = useState<ConditionTree>(rule?.conditions ?? emptyConditionTree());
  const [conditionsError, setConditionsError] = useState<string | null>(null);
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((rule?.numberValues ?? []).map(entry => [entry.propertyId, String(entry.value)])));
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((rule?.booleanValues ?? []).map(entry => [entry.propertyId, entry.value])));

  const form = useAppForm({
    defaultValues: {
      name: rule?.name ?? "",
      setCategoryId: rule?.setCategoryId ?? defaultCategoryId ?? NO_CATEGORY,
      tagIds: rule?.tagIds ?? ([] as string[]),
      sortOrder: rule?.sortOrder ?? 0,
    },
    validators: {
      onChange: ruleSchema,
    },
    onSubmit: ({
      value,
    }) => {
      const parsedConditions = autofillConditionsValidator.safeParse(conditions);
      if (!parsedConditions.success) {
        setConditionsError(parsedConditions.error.issues.map(issue => issue.message).join(" "));
        return;
      }
      setConditionsError(null);

      const categoryId = value.setCategoryId === NO_CATEGORY ? null : value.setCategoryId;
      // Only persist property values for properties assigned to the rule's category.
      const categoryProps = categoryId
        ? properties.filter(property => property.categoryIds.includes(categoryId))
        : [];
      const numberValues = categoryProps
        .filter(property => property.type === "number")
        .map(property => ({
          propertyId: property.id,
          raw: numberInputs[property.id] ?? "",
        }))
        .filter(({
          raw,
        }) => raw.trim() !== "" && !Number.isNaN(Number(raw)))
        .map(({
          propertyId, raw,
        }) => ({
          propertyId,
          value: Number(raw),
        }));
      const booleanValues = categoryProps
        .filter(property => property.type === "boolean")
        .map(property => ({
          propertyId: property.id,
          value: booleanInputs[property.id] ?? false,
        }));

      onSubmit({
        name: value.name.trim(),
        conditions,
        setCategoryId: categoryId,
        tagIds: value.tagIds,
        numberValues,
        booleanValues,
        sortOrder: value.sortOrder,
      });

      if (resetOnSubmit) {
        form.reset();
        setConditions(emptyConditionTree());
        setConditionsError(null);
        setNumberInputs({});
        setBooleanInputs({});
      }
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <form.AppField name="name">
          {field => (
            <field.TextField
              label="Name"
              placeholder="e.g. Recipes from 101 Cookbooks"
            />
          )}
        </form.AppField>

        <form.AppField name="sortOrder">
          {field => (
            <field.NumberField
              label="Priority"
              className="max-w-32"
              hint="Higher numbers win when rules conflict on the category."
            />
          )}
        </form.AppField>
      </div>

      <section className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold">When a bookmark matches</h3>
          <p className="text-xs text-muted-foreground">
            Conditions that decide whether this rule applies.
          </p>
        </div>
        <div className="space-y-1">
          <ConditionsField
            value={conditions}
            onChange={(next) => {
              setConditions(next);
              setConditionsError(null);
            }}
            categories={categories}
            properties={properties}
            tagTree={tagTree}
          />
          {conditionsError ? <p className="text-sm text-destructive">{conditionsError}</p> : null}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Then apply</h3>
          <p className="text-xs text-muted-foreground">
            What to prefill on the bookmark when this rule matches.
          </p>
        </div>

        <form.AppField name="setCategoryId">
          {field => (
            <field.SelectField
              label="Set category"
              options={[
                {
                  value: NO_CATEGORY,
                  label: "— Leave unchanged —",
                },
                ...categories.map(category => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
            />
          )}
        </form.AppField>

        <form.Field name="tagIds">
          {field => (
            <div className="space-y-1">
              <Label>Apply tags</Label>
              <div className="rounded-md border p-2">
                <TagPicker
                  tree={tagTree}
                  selectedIds={field.state.value}
                  onToggle={(id) => {
                    const current = field.state.value;
                    field.handleChange(
                      current.includes(id)
                        ? current.filter(tagId => tagId !== id)
                        : [...current, id],
                    );
                  }}
                />
              </div>
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={state => state.values.setCategoryId}>
          {setCategoryId => (
            <RulePropertyFields
              categoryId={setCategoryId === NO_CATEGORY ? "" : setCategoryId}
              properties={properties}
              numberInputs={numberInputs}
              booleanInputs={booleanInputs}
              onNumberChange={(id, value) =>
                setNumberInputs(current => ({
                  ...current,
                  [id]: value,
                }))}
              onBooleanChange={(id, value) =>
                setBooleanInputs(current => ({
                  ...current,
                  [id]: value,
                }))}
            />
          )}
        </form.Subscribe>
      </section>

      <form.AppForm>
        <form.SubmitButton label={submitLabel} />
      </form.AppForm>
      {isError ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
    </form>
  );
}

interface RulePropertyFieldsProps {
  categoryId: string;
  properties: CustomProperty[];
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean) => void;
}

/** Property-value inputs for the rule's chosen category (calculate properties are computed). */
function RulePropertyFields({
  categoryId, properties, numberInputs, booleanInputs, onNumberChange, onBooleanChange,
}: RulePropertyFieldsProps) {
  if (!categoryId) return null;
  const categoryProps = properties.filter(property =>
    property.categoryIds.includes(categoryId) && property.type !== "calculate");
  if (categoryProps.length === 0) return null;

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">Set properties</span>
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        {categoryProps.map((property) => {
          if (property.type === "number") {
            return (
              <div
                key={property.id}
                className="space-y-1"
              >
                <Label htmlFor={`rule-property-${property.id}`}>
                  {property.name}
                  {property.unitPlural ? ` (${property.unitPlural})` : ""}
                </Label>
                <Input
                  id={`rule-property-${property.id}`}
                  type="number"
                  value={numberInputs[property.id] ?? ""}
                  onChange={event => onNumberChange(property.id, event.target.value)}
                />
              </div>
            );
          }
          return (
            <div
              key={property.id}
              className="flex items-center gap-2 self-end"
            >
              <Checkbox
                id={`rule-property-${property.id}`}
                checked={booleanInputs[property.id] ?? false}
                onCheckedChange={checked => onBooleanChange(property.id, checked === true)}
              />
              <Label htmlFor={`rule-property-${property.id}`}>{property.name}</Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
