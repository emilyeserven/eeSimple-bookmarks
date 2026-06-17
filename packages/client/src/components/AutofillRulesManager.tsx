import type {
  AutofillRule,
  Category,
  CreateAutofillRuleInput,
  CustomProperty,
  TagNode,
} from "@eesimple/types";

import { useState } from "react";

import { z } from "zod";

import { TagPicker } from "./TagPicker";
import {
  useAutofillRules,
  useCreateAutofillRule,
  useDeleteAutofillRule,
  useUpdateAutofillRule,
} from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";
import { useAppForm } from "../lib/form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Sentinel select value standing in for "no category" (Radix selects can't hold an empty value). */
const NO_CATEGORY = "none";

const FIELD_OPTIONS = [
  {
    value: "url",
    label: "URL",
  },
  {
    value: "title",
    label: "Title",
  },
];

const OPERATOR_OPTIONS = [
  {
    value: "contains",
    label: "Contains",
  },
  {
    value: "starts_with",
    label: "Starts with",
  },
  {
    value: "regex",
    label: "Regex",
  },
  {
    value: "domain",
    label: "Domain is",
  },
];

const OPERATOR_LABELS: Record<string, string> = {
  contains: "contains",
  starts_with: "starts with",
  regex: "matches",
  domain: "domain is",
};

const ruleSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    field: z.enum(["url", "title"]),
    operator: z.enum(["contains", "starts_with", "regex", "domain"]),
    pattern: z.string().trim().min(1, "Pattern is required"),
    setCategoryId: z.string(),
    tagIds: z.array(z.string()),
    sortOrder: z.number().int(),
  })
  .superRefine((value, ctx) => {
    if (value.operator === "regex") {
      try {
        new RegExp(value.pattern);
      }
      catch {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid regular expression.",
          path: ["pattern"],
        });
      }
    }
  });

/** Create, list, edit, and delete autofill rules. */
export function AutofillRulesManager() {
  const {
    data: rules, isLoading, error,
  } = useAutofillRules();
  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();
  const createRule = useCreateAutofillRule();

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New rule</CardTitle>
        </CardHeader>
        <CardContent>
          <RuleForm
            categories={categories ?? []}
            properties={properties ?? []}
            tagTree={tagTree ?? []}
            submitLabel="Add rule"
            resetOnSubmit
            isError={createRule.isError}
            errorMessage={createRule.error?.message}
            onSubmit={input => createRule.mutate(input)}
          />
        </CardContent>
      </Card>

      {isLoading ? <p className="text-muted-foreground">Loading rules…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && (rules?.length ?? 0) === 0
        ? <p className="text-muted-foreground">No autofill rules yet. Create one above.</p>
        : null}

      <div className="space-y-4">
        {(rules ?? []).map(rule => (
          <RuleCard
            key={rule.id}
            rule={rule}
            categories={categories ?? []}
            properties={properties ?? []}
            tagTree={tagTree ?? []}
          />
        ))}
      </div>
    </section>
  );
}

interface RuleCardProps {
  rule: AutofillRule;
  categories: Category[];
  properties: CustomProperty[];
  tagTree: TagNode[];
}

function RuleCard({
  rule, categories, properties, tagTree,
}: RuleCardProps) {
  const updateRule = useUpdateAutofillRule();
  const deleteRule = useDeleteAutofillRule();

  const categoryName = rule.setCategoryId
    ? categories.find(category => category.id === rule.setCategoryId)?.name
    : null;
  const fieldLabel = rule.operator === "domain" ? "URL" : rule.field === "url" ? "URL" : "Title";

  return (
    <Card>
      <CardHeader
        className="flex-row items-center justify-between gap-2 space-y-0"
      >
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{rule.name}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {`${fieldLabel} ${OPERATOR_LABELS[rule.operator]} “${rule.pattern}”`}
          </span>
          {categoryName ? <Badge variant="secondary">{categoryName}</Badge> : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => deleteRule.mutate(rule.id)}
        >
          Delete
        </Button>
      </CardHeader>
      <CardContent>
        <RuleForm
          rule={rule}
          categories={categories}
          properties={properties}
          tagTree={tagTree}
          submitLabel="Save changes"
          isError={updateRule.isError}
          errorMessage={updateRule.error?.message}
          onSubmit={input =>
            updateRule.mutate({
              id: rule.id,
              input,
            })}
        />
      </CardContent>
    </Card>
  );
}

interface RuleFormProps {
  rule?: AutofillRule;
  categories: Category[];
  properties: CustomProperty[];
  tagTree: TagNode[];
  submitLabel: string;
  resetOnSubmit?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onSubmit: (input: CreateAutofillRuleInput) => void;
}

/** Shared create/edit form for an autofill rule (matcher + category/tags/property actions). */
function RuleForm({
  rule, categories, properties, tagTree, submitLabel, resetOnSubmit, isError, errorMessage, onSubmit,
}: RuleFormProps) {
  // Custom-property values live outside the typed form (they're dynamic), like the bookmark form.
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((rule?.numberValues ?? []).map(entry => [entry.propertyId, String(entry.value)])));
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((rule?.booleanValues ?? []).map(entry => [entry.propertyId, entry.value])));

  const form = useAppForm({
    defaultValues: {
      name: rule?.name ?? "",
      field: rule?.field ?? ("url" as AutofillRule["field"]),
      operator: rule?.operator ?? ("contains" as AutofillRule["operator"]),
      pattern: rule?.pattern ?? "",
      setCategoryId: rule?.setCategoryId ?? NO_CATEGORY,
      tagIds: rule?.tagIds ?? ([] as string[]),
      sortOrder: rule?.sortOrder ?? 0,
    },
    validators: {
      onChange: ruleSchema,
    },
    onSubmit: ({
      value,
    }) => {
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
        // `domain` always inspects the URL, so pin the stored field to keep the data coherent.
        field: value.operator === "domain" ? "url" : value.field,
        operator: value.operator,
        pattern: value.pattern.trim(),
        setCategoryId: categoryId,
        tagIds: value.tagIds,
        numberValues,
        booleanValues,
        sortOrder: value.sortOrder,
      });

      if (resetOnSubmit) {
        form.reset();
        setNumberInputs({});
        setBooleanInputs({});
      }
    },
  });

  return (
    <form
      className="space-y-4"
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

        <form.AppField name="operator">
          {field => (
            <field.SelectField
              label="Match"
              options={OPERATOR_OPTIONS}
            />
          )}
        </form.AppField>

        <form.Subscribe selector={state => state.values.operator}>
          {operator =>
            operator === "domain"
              ? (
                <div className="space-y-1 self-end">
                  <p className="text-xs text-muted-foreground">
                    Matches the bookmark URL’s domain (a leading “www.” is ignored).
                  </p>
                </div>
              )
              : (
                <form.AppField name="field">
                  {field => (
                    <field.SelectField
                      label="Field"
                      options={FIELD_OPTIONS}
                    />
                  )}
                </form.AppField>
              )}
        </form.Subscribe>

        <form.Subscribe selector={state => state.values.operator}>
          {operator => (
            <form.AppField name="pattern">
              {field => (
                <field.TextField
                  className="sm:col-span-2"
                  label={operator === "domain" ? "Domain" : "Pattern"}
                  placeholder={operator === "domain" ? "e.g. 101cookbooks.com" : "e.g. Ponzu"}
                />
              )}
            </form.AppField>
          )}
        </form.Subscribe>

        <form.AppField name="setCategoryId">
          {field => (
            <field.SelectField
              label="Set category"
              className="sm:col-span-2"
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
      </div>

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
