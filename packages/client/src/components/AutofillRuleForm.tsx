// This module pairs the autofill rule form with the `NO_CATEGORY` sentinel its consumers reuse.

import type {
  AutofillRule,
  Category,
  CategoryCondition,
  ConditionTree,
  CreateAutofillRuleInput,
  CustomProperty,
  TagCondition,
  TagNode,
  WebsiteCondition,
} from "@eesimple/types";

import { useState } from "react";

import {
  emptyConditionTree,
  propertyAppliesToCategory,
} from "@eesimple/types";
import { z } from "zod";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { ConditionsField } from "./conditions/ConditionsField";
import { DateTimePicker } from "./DateTimePicker";
import { LabeledSection } from "./LabeledSection";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { TagPicker } from "./TagPicker";
import { autofillConditionsValidator } from "../lib/conditionsSchema";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/** Sentinel select value standing in for "no category" (Radix selects can't hold an empty value). */
export const NO_CATEGORY = "none";

const ruleSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
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
  /** Preselected website domain for a new rule's "when" (e.g. when creating from a website's page). */
  defaultWebsiteDomain?: string;
  submitLabel: string;
  resetOnSubmit?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onSubmit: (input: CreateAutofillRuleInput) => void;
}

/** Shared create/edit form for an autofill rule: a "when" condition tree plus "then" actions. */
export function AutofillRuleForm({
  rule, categories, properties, tagTree, defaultCategoryId, defaultWebsiteDomain, submitLabel, resetOnSubmit, isError, errorMessage, onSubmit,
}: AutofillRuleFormProps) {
  // The condition tree and custom-property values live outside the typed form (they're dynamic and,
  // for the recursive tree, would blow up TanStack Form's deep type inference). A new rule created
  // from a website's page is seeded with that website as its "when".
  const [conditions, setConditions] = useState<ConditionTree>(
    rule?.conditions ?? seedConditions(defaultWebsiteDomain),
  );
  const [conditionsError, setConditionsError] = useState<string | null>(null);
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((rule?.numberValues ?? []).map(entry => [entry.propertyId, String(entry.value)])));
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((rule?.booleanValues ?? []).map(entry => [entry.propertyId, entry.value])));
  const [dateTimeInputs, setDateTimeInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((rule?.dateTimeValues ?? []).map(entry => [entry.propertyId, entry.value])));

  const form = useAppForm({
    defaultValues: {
      name: rule?.name ?? "",
      description: rule?.description ?? "",
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
        ? properties.filter(property => propertyAppliesToCategory(property, categoryId))
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
      const dateTimeValues = categoryProps
        .filter(property => property.type === "datetime")
        .map(property => ({
          propertyId: property.id,
          value: (dateTimeInputs[property.id] ?? "").trim(),
        }))
        .filter(entry => entry.value !== "");

      onSubmit({
        name: value.name.trim(),
        description: value.description.trim() || null,
        conditions,
        setCategoryId: categoryId,
        tagIds: value.tagIds,
        numberValues,
        booleanValues,
        dateTimeValues,
        sortOrder: value.sortOrder,
      });

      if (resetOnSubmit) {
        form.reset();
        setConditions(seedConditions(defaultWebsiteDomain));
        setConditionsError(null);
        setNumberInputs({});
        setBooleanInputs({});
        setDateTimeInputs({});
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
      <div className="space-y-4">
        <form.AppField name="name">
          {field => (
            <field.TextField
              label="Name"
              placeholder="e.g. Recipes from 101 Cookbooks"
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {field => (
            <field.TextareaField label="Description" />
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

      <Separator />

      <CollapsibleFormSection
        title="Activation Conditions"
        description="Conditions that decide whether this rule applies."
        defaultOpen={!rule}
        preview={summarizeConditions(conditions)}
      >
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
      </CollapsibleFormSection>

      <Separator />

      <LabeledSection
        title="Preview Bookmarks"
        description="Test which existing bookmarks match the activation conditions above."
      >
        <PreviewBookmarksSection
          conditions={conditions}
          tagTree={tagTree}
        />
      </LabeledSection>

      <Separator />

      <CollapsibleFormSection
        title="What Gets Prefilled"
        description="What to prefill on the bookmark when this rule matches."
        defaultOpen={!rule}
        preview={(
          <form.Subscribe
            selector={state => ({
              setCategoryId: state.values.setCategoryId,
              tagIds: state.values.tagIds,
            })}
          >
            {({
              setCategoryId, tagIds,
            }) =>
              summarizePrefill({
                setCategoryId,
                tagIds,
                categories,
                properties,
                numberInputs,
                booleanInputs,
                dateTimeInputs,
              })}
          </form.Subscribe>
        )}
      >
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
              dateTimeInputs={dateTimeInputs}
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
              onDateTimeChange={(id, value) =>
                setDateTimeInputs(current => ({
                  ...current,
                  [id]: value,
                }))}
            />
          )}
        </form.Subscribe>
      </CollapsibleFormSection>

      <Separator />

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
  dateTimeInputs: Record<string, string>;
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean) => void;
  onDateTimeChange: (propertyId: string, value: string) => void;
}

/** Property-value inputs for the rule's chosen category (calculate properties are computed). */
function RulePropertyFields({
  categoryId, properties, numberInputs, booleanInputs, dateTimeInputs,
  onNumberChange, onBooleanChange, onDateTimeChange,
}: RulePropertyFieldsProps) {
  if (!categoryId) return null;
  const categoryProps = properties.filter(property =>
    propertyAppliesToCategory(property, categoryId) && property.type !== "calculate");
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
          if (property.type === "datetime") {
            return (
              <div
                key={property.id}
                className="space-y-1"
              >
                <Label htmlFor={`rule-property-${property.id}`}>{property.name}</Label>
                <DateTimePicker
                  id={`rule-property-${property.id}`}
                  format={property.dateTimeFormat ?? "date"}
                  value={dateTimeInputs[property.id] ?? null}
                  onChange={value => onDateTimeChange(property.id, value ?? "")}
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

/** Initial "when" tree for a new rule: empty, or pre-scoped to a website when created from one. */
function seedConditions(defaultWebsiteDomain?: string): ConditionTree {
  const tree = emptyConditionTree();
  if (!defaultWebsiteDomain) return tree;
  return {
    ...tree,
    children: [{
      type: "website",
      domains: [defaultWebsiteDomain],
    }],
  };
}

/** One-line summary of the activation conditions for the collapsed section preview. */
function summarizeConditions(conditions: ConditionTree): string {
  const matchCount = conditions.children.filter(child => child.type === "match").length;
  const categoryLeaf = conditions.children.find((child): child is CategoryCondition => child.type === "category");
  const websiteLeaf = conditions.children.find((child): child is WebsiteCondition => child.type === "website");
  const tagLeaf = conditions.children.find((child): child is TagCondition => child.type === "tag");
  const propertyCount = conditions.children.filter(child => child.type === "property").length;
  const categoryCount = categoryLeaf?.categoryIds.length ?? 0;
  const websiteCount = websiteLeaf?.domains.length ?? 0;
  const tagCount = tagLeaf?.tagIds.length ?? 0;

  const parts: string[] = [];
  if (matchCount > 0) parts.push(`${matchCount} title ${matchCount === 1 ? "match" : "matches"}`);
  if (categoryCount > 0) parts.push(`${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`);
  if (websiteCount > 0) parts.push(`${websiteCount} ${websiteCount === 1 ? "website" : "websites"}`);
  if (tagCount > 0) parts.push(`${tagCount} ${tagCount === 1 ? "tag" : "tags"}`);
  if (propertyCount > 0) parts.push(`${propertyCount} ${propertyCount === 1 ? "property" : "properties"}`);

  return parts.length > 0 ? parts.join(" · ") : "No conditions set";
}

interface PrefillSummaryArgs {
  setCategoryId: string;
  tagIds: string[];
  categories: Category[];
  properties: CustomProperty[];
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
}

/** One-line summary of the prefill actions for the collapsed section preview. */
function summarizePrefill({
  setCategoryId, tagIds, categories, properties, numberInputs, booleanInputs, dateTimeInputs,
}: PrefillSummaryArgs): string {
  const parts: string[] = [];

  if (setCategoryId !== NO_CATEGORY) {
    const category = categories.find(item => item.id === setCategoryId);
    if (category) parts.push(`Category: ${category.name}`);
  }

  if (tagIds.length > 0) parts.push(`${tagIds.length} ${tagIds.length === 1 ? "tag" : "tags"}`);

  if (setCategoryId !== NO_CATEGORY) {
    const categoryProps = properties.filter(property =>
      propertyAppliesToCategory(property, setCategoryId) && property.type !== "calculate");
    const propertyCount = categoryProps.filter((property) => {
      if (property.type === "number") return (numberInputs[property.id] ?? "").trim() !== "";
      if (property.type === "boolean") return booleanInputs[property.id] === true;
      if (property.type === "datetime") return (dateTimeInputs[property.id] ?? "").trim() !== "";
      return false;
    }).length;
    if (propertyCount > 0) parts.push(`${propertyCount} ${propertyCount === 1 ? "property" : "properties"}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Nothing set yet";
}
