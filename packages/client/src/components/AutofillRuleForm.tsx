// This module pairs the autofill rule form with the `NO_CATEGORY` sentinel its consumers reuse.

import type {
  AutofillRule,
  Category,
  ConditionTree,
  CreateAutofillRuleInput,
  CustomProperty,
  MediaType,
  TagNode,
} from "@eesimple/types";

import { useState } from "react";

import {
  emptyConditionTree,
  propertyAppliesToCategory,
} from "@eesimple/types";
import { z } from "zod";

import { AutofillRuleActivationSection } from "./AutofillRuleActivationSection";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { RulePropertyField } from "./RulePropertyField";
import { RuleTagsField } from "./RuleTagsField";
import { autofillConditionsValidator } from "../lib/conditionsSchema";
import { useAppForm } from "../lib/form";

import { Separator } from "@/components/ui/separator";

/** Sentinel select value standing in for "no category" (Radix selects can't hold an empty value). */
export const NO_CATEGORY = "none";

/** Sentinel select value standing in for "no media type" (Radix selects can't hold an empty value). */
export const NO_MEDIA_TYPE = "none";

const ruleSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  setCategoryId: z.string(),
  setMediaTypeId: z.string(),
  tagIds: z.array(z.string()),
  sortOrder: z.number().int(),
});

interface AutofillRuleFormProps {
  rule?: AutofillRule;
  categories: Category[];
  mediaTypes: MediaType[];
  properties: CustomProperty[];
  tagTree: TagNode[];
  /** Preselected target category for a new rule (e.g. when creating from a category's edit page). */
  defaultCategoryId?: string;
  /** Preselected target media type for a new rule (e.g. when creating from a media type's page). */
  defaultMediaTypeId?: string;
  /** Preselected website domain for a new rule's "when" (e.g. when creating from a website's page). */
  defaultWebsiteDomain?: string;
  /** Preselected tag ids for a new rule's "then" (e.g. when creating from a tag's page). */
  defaultTagIds?: string[];
  /** Preselected YouTube channel ids for a new rule's "when" (e.g. when creating from a channel's page). */
  defaultChannelIds?: string[];
  /** When true, the Custom properties section in Activation Conditions starts expanded (e.g. when creating from a property's page). */
  defaultOpenCustomProperties?: boolean;
  submitLabel: string;
  resetOnSubmit?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onSubmit: (input: CreateAutofillRuleInput) => void;
}

/** Shared create/edit form for an autofill rule: a "when" condition tree plus "then" actions. */
export function AutofillRuleForm({
  rule, categories, mediaTypes, properties, tagTree, defaultCategoryId, defaultMediaTypeId, defaultWebsiteDomain, defaultTagIds, defaultChannelIds, defaultOpenCustomProperties, submitLabel, resetOnSubmit, isError, errorMessage, onSubmit,
}: AutofillRuleFormProps) {
  // The condition tree and custom-property values live outside the typed form (they're dynamic and,
  // for the recursive tree, would blow up TanStack Form's deep type inference). A new rule created
  // from a website's or channel's page is seeded with that entity as its "when".
  const [conditions, setConditions] = useState<ConditionTree>(
    rule?.conditions ?? seedConditions(defaultWebsiteDomain, defaultChannelIds, defaultCategoryId ? [defaultCategoryId] : undefined, defaultMediaTypeId ? [defaultMediaTypeId] : undefined),
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
      setMediaTypeId: rule?.setMediaTypeId ?? defaultMediaTypeId ?? NO_MEDIA_TYPE,
      tagIds: rule?.tagIds ?? defaultTagIds ?? ([] as string[]),
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
      const mediaTypeId = value.setMediaTypeId === NO_MEDIA_TYPE ? null : value.setMediaTypeId;
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
        setMediaTypeId: mediaTypeId,
        tagIds: value.tagIds,
        numberValues,
        booleanValues,
        dateTimeValues,
        sortOrder: value.sortOrder,
      });

      if (resetOnSubmit) {
        form.reset();
        setConditions(seedConditions(defaultWebsiteDomain, defaultChannelIds, defaultCategoryId ? [defaultCategoryId] : undefined, defaultMediaTypeId ? [defaultMediaTypeId] : undefined));
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

      <AutofillRuleActivationSection
        defaultOpen={!rule}
        conditions={conditions}
        conditionsError={conditionsError}
        onChange={(next) => {
          setConditions(next);
          setConditionsError(null);
        }}
        categories={categories}
        properties={properties}
        tagTree={tagTree}
        openCustomProperties={defaultOpenCustomProperties}
      />

      <Separator />

      <CollapsibleFormSection
        title="What Gets Prefilled"
        description="What to prefill on the bookmark when this rule matches."
        defaultOpen={!rule}
        preview={(
          <form.Subscribe
            selector={state => ({
              setCategoryId: state.values.setCategoryId,
              setMediaTypeId: state.values.setMediaTypeId,
              tagIds: state.values.tagIds,
            })}
          >
            {({
              setCategoryId, setMediaTypeId, tagIds,
            }) =>
              summarizePrefill({
                setCategoryId,
                setMediaTypeId,
                tagIds,
                categories,
                mediaTypes,
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

        <form.AppField name="setMediaTypeId">
          {field => (
            <field.SelectField
              label="Set media type"
              options={[
                {
                  value: NO_MEDIA_TYPE,
                  label: "— Leave unchanged —",
                },
                ...mediaTypes.map(mediaType => ({
                  value: mediaType.id,
                  label: mediaType.name,
                })),
              ]}
            />
          )}
        </form.AppField>

        <form.Field name="tagIds">
          {field => (
            <RuleTagsField
              tagTree={tagTree}
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
export function RulePropertyFields({
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
        {categoryProps.map(property => (
          <RulePropertyField
            key={property.id}
            property={property}
            numberInputs={numberInputs}
            booleanInputs={booleanInputs}
            dateTimeInputs={dateTimeInputs}
            onNumberChange={onNumberChange}
            onBooleanChange={onBooleanChange}
            onDateTimeChange={onDateTimeChange}
          />
        ))}
      </div>
    </div>
  );
}

/** Initial "when" tree for a new rule: empty, or pre-scoped to a website/channel/category/media-type when created from one. */
function seedConditions(
  defaultWebsiteDomain?: string,
  defaultChannelIds?: string[],
  defaultCategoryIds?: string[],
  defaultMediaTypeIds?: string[],
): ConditionTree {
  const tree = emptyConditionTree();
  const leaves: ConditionTree["children"] = [];
  if (defaultWebsiteDomain) {
    leaves.push({
      type: "website",
      domains: [defaultWebsiteDomain],
    });
  }
  if (defaultChannelIds && defaultChannelIds.length > 0) {
    leaves.push({
      type: "youtube-channel",
      channelIds: defaultChannelIds,
    });
  }
  if (defaultCategoryIds && defaultCategoryIds.length > 0) {
    leaves.push({
      type: "category",
      categoryIds: defaultCategoryIds,
    });
  }
  if (defaultMediaTypeIds && defaultMediaTypeIds.length > 0) {
    leaves.push({
      type: "media-type",
      mediaTypeIds: defaultMediaTypeIds,
    });
  }
  if (leaves.length === 0) return tree;
  return {
    ...tree,
    children: leaves,
  };
}

interface PrefillSummaryArgs {
  setCategoryId: string;
  setMediaTypeId: string;
  tagIds: string[];
  categories: Category[];
  mediaTypes: MediaType[];
  properties: CustomProperty[];
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
}

/** One-line summary of the prefill actions for the collapsed section preview. */
function summarizePrefill({
  setCategoryId, setMediaTypeId, tagIds, categories, mediaTypes, properties, numberInputs, booleanInputs, dateTimeInputs,
}: PrefillSummaryArgs): string {
  const parts: string[] = [];

  if (setCategoryId !== NO_CATEGORY) {
    const category = categories.find(item => item.id === setCategoryId);
    if (category) parts.push(`Category: ${category.name}`);
  }

  if (setMediaTypeId !== NO_MEDIA_TYPE) {
    const mediaType = mediaTypes.find(item => item.id === setMediaTypeId);
    if (mediaType) parts.push(`Media type: ${mediaType.name}`);
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
