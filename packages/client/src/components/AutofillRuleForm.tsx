// This module pairs the autofill rule form with the `NO_CATEGORY` sentinel it re-exports for consumers.

import type {
  AutofillRule,
  Category,
  CreateAutofillRuleInput,
  CustomProperty,
  MediaType,
  TagNode,
} from "@eesimple/types";

import { propertyAppliesToCategory } from "@eesimple/types";

import { AutofillRuleActivationSection } from "./AutofillRuleActivationSection";
import { NO_MEDIA_TYPE } from "./autofillRuleForm";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { RuleLocationsField } from "./RuleLocationsField";
import { RulePropertyField } from "./RulePropertyField";
import { RuleTagsField } from "./RuleTagsField";
import { useAutofillRuleForm } from "./useAutofillRuleForm";
import { NO_CATEGORY } from "../lib/autofillScope";

import { Separator } from "@/components/ui/separator";

/** Re-exported for the form's consumers; the canonical definitions live in `lib/autofillScope` / `./autofillRuleForm`. */
export { NO_CATEGORY };
export { NO_MEDIA_TYPE };

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
  /** Preselected location ids for a new rule's "then" (e.g. when creating from a location's page). */
  defaultLocationIds?: string[];
  /** Preselected YouTube channel ids for a new rule's "when" (e.g. when creating from a channel's page). */
  defaultChannelIds?: string[];
  /** Preselected Genres & Moods ids for a new rule's "when" (e.g. when creating from a Genres & Moods page). */
  defaultGenreMoodIds?: string[];
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
  rule, categories, mediaTypes, properties, tagTree, defaultCategoryId, defaultMediaTypeId, defaultWebsiteDomain, defaultTagIds, defaultLocationIds, defaultChannelIds, defaultGenreMoodIds, defaultOpenCustomProperties, submitLabel, resetOnSubmit, isError, errorMessage, onSubmit,
}: AutofillRuleFormProps) {
  const {
    form,
    locationTree,
    conditions,
    setConditions,
    conditionsError,
    setConditionsError,
    numberInputs,
    setNumberInputs,
    booleanInputs,
    setBooleanInputs,
    dateTimeInputs,
    setDateTimeInputs,
  } = useAutofillRuleForm({
    rule,
    properties,
    defaultCategoryId,
    defaultMediaTypeId,
    defaultTagIds,
    defaultLocationIds,
    defaultWebsiteDomain,
    defaultChannelIds,
    defaultGenreMoodIds,
    resetOnSubmit,
    onSubmit,
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
              locationIds: state.values.locationIds,
            })}
          >
            {({
              setCategoryId, setMediaTypeId, tagIds, locationIds,
            }) =>
              summarizePrefill({
                setCategoryId,
                setMediaTypeId,
                tagIds,
                locationIds,
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

        <form.Field name="locationIds">
          {field => (
            <RuleLocationsField
              locationTree={locationTree}
              selectedIds={field.state.value}
              onToggle={(id) => {
                const current = field.state.value;
                field.handleChange(
                  current.includes(id)
                    ? current.filter(locationId => locationId !== id)
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

interface PrefillSummaryArgs {
  setCategoryId: string;
  setMediaTypeId: string;
  tagIds: string[];
  locationIds: string[];
  categories: Category[];
  mediaTypes: MediaType[];
  properties: CustomProperty[];
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
}

/** One-line summary of the prefill actions for the collapsed section preview. */
function summarizePrefill({
  setCategoryId, setMediaTypeId, tagIds, locationIds, categories, mediaTypes, properties, numberInputs, booleanInputs, dateTimeInputs,
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

  if (locationIds.length > 0) parts.push(`${locationIds.length} ${locationIds.length === 1 ? "location" : "locations"}`);

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
