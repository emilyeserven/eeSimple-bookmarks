import type {
  AutofillRule,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CustomProperty,
  UpdateAutofillRuleInput,
} from "@eesimple/types";

import { useState } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";

import { NO_CATEGORY, NO_MEDIA_TYPE, RulePropertyFields } from "./AutofillRuleForm";
import { AutofillRulePrefillPickers } from "./AutofillRulePrefillPickers";
import { useUpdateAutofillRule } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useTagTree } from "../hooks/useTags";

const LABELS: Partial<Record<keyof UpdateAutofillRuleInput, string>> = {
  setCategoryId: "Category",
  setMediaTypeId: "Media Type",
  tagIds: "Tags",
  numberValues: "Number values",
  booleanValues: "Boolean values",
  dateTimeValues: "Date/Time values",
};

/** The custom properties that apply to the chosen category (excluding computed `calculate` props). */
function categoryProperties(properties: CustomProperty[], categoryId: string | null): CustomProperty[] {
  if (!categoryId) return [];
  return properties.filter(p => propertyAppliesToCategory(p, categoryId));
}

function buildNumberValues(
  props: CustomProperty[],
  numberInputs: Record<string, string>,
): BookmarkNumberValue[] {
  return props
    .filter(p => p.type === "number")
    .map(p => ({
      propertyId: p.id,
      raw: numberInputs[p.id] ?? "",
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
}

function buildBooleanValues(
  props: CustomProperty[],
  booleanInputs: Record<string, boolean>,
): BookmarkBooleanValue[] {
  return props
    .filter(p => p.type === "boolean")
    .map(p => ({
      propertyId: p.id,
      value: booleanInputs[p.id] ?? false,
    }));
}

function buildDateTimeValues(
  props: CustomProperty[],
  dateTimeInputs: Record<string, string>,
): BookmarkDateTimeValue[] {
  return props
    .filter(p => p.type === "datetime")
    .map(p => ({
      propertyId: p.id,
      value: (dateTimeInputs[p.id] ?? "").trim(),
    }))
    .filter(e => e.value !== "");
}

interface Props {
  rule: AutofillRule;
}

/**
 * Edit an autofill rule's prefill actions: category, media type, tags, and property values. Each
 * picker auto-saves its own field on change (no Save button).
 */
export function AutofillRulePrefillForm({
  rule,
}: Props) {
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: properties = [],
  } = useCustomProperties();
  const {
    data: tagTree = [],
  } = useTagTree();
  const {
    data: mediaTypes = [],
  } = useMediaTypes();
  const updateRule = useUpdateAutofillRule();

  const initialCategoryId = rule.setCategoryId ?? NO_CATEGORY;
  const initialMediaTypeId = rule.setMediaTypeId ?? NO_MEDIA_TYPE;
  const initialNumberInputs = Object.fromEntries(rule.numberValues.map(e => [e.propertyId, String(e.value)]));
  const initialBooleanInputs = Object.fromEntries(rule.booleanValues.map(e => [e.propertyId, e.value]));
  const initialDateTimeInputs = Object.fromEntries(rule.dateTimeValues.map(e => [e.propertyId, e.value]));

  const [setCategoryId, setSetCategoryId] = useState(initialCategoryId);
  const [setMediaTypeId, setSetMediaTypeId] = useState(initialMediaTypeId);
  const [tagIds, setTagIds] = useState<string[]>(rule.tagIds);
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>(initialNumberInputs);
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>(initialBooleanInputs);
  const [dateTimeInputs, setDateTimeInputs] = useState<Record<string, string>>(initialDateTimeInputs);

  const autoSave = useFieldAutoSave<UpdateAutofillRuleInput>({
    id: rule.id,
    update: updateRule,
    labels: LABELS,
    initial: {
      setCategoryId: rule.setCategoryId,
      setMediaTypeId: rule.setMediaTypeId,
      tagIds: rule.tagIds,
      numberValues: rule.numberValues,
      booleanValues: rule.booleanValues,
      dateTimeValues: rule.dateTimeValues,
    },
  });

  /** Resolve the category id from local sentinel state to the saved `null | id` form. */
  function resolvedCategoryId(sentinel: string): string | null {
    return sentinel === NO_CATEGORY ? null : sentinel;
  }

  function handleCategoryChange(value: string) {
    setSetCategoryId(value);
    autoSave.saveField("setCategoryId", resolvedCategoryId(value));
  }

  function handleMediaTypeChange(value: string) {
    setSetMediaTypeId(value);
    autoSave.saveField("setMediaTypeId", value === NO_MEDIA_TYPE ? null : value);
  }

  function handleToggleTag(id: string) {
    const next = tagIds.includes(id) ? tagIds.filter(t => t !== id) : [...tagIds, id];
    setTagIds(next);
    autoSave.saveField("tagIds", next);
  }

  function handleNumberChange(id: string, value: string) {
    const next = {
      ...numberInputs,
      [id]: value,
    };
    setNumberInputs(next);
    const props = categoryProperties(properties, resolvedCategoryId(setCategoryId));
    autoSave.saveField("numberValues", buildNumberValues(props, next));
  }

  function handleBooleanChange(id: string, value: boolean) {
    const next = {
      ...booleanInputs,
      [id]: value,
    };
    setBooleanInputs(next);
    const props = categoryProperties(properties, resolvedCategoryId(setCategoryId));
    autoSave.saveField("booleanValues", buildBooleanValues(props, next));
  }

  function handleDateTimeChange(id: string, value: string) {
    const next = {
      ...dateTimeInputs,
      [id]: value,
    };
    setDateTimeInputs(next);
    const props = categoryProperties(properties, resolvedCategoryId(setCategoryId));
    autoSave.saveField("dateTimeValues", buildDateTimeValues(props, next));
  }

  return (
    <div className="space-y-4">
      <AutofillRulePrefillPickers
        categories={categories}
        mediaTypes={mediaTypes}
        tagTree={tagTree}
        setCategoryId={setCategoryId}
        onCategoryChange={handleCategoryChange}
        setMediaTypeId={setMediaTypeId}
        onMediaTypeChange={handleMediaTypeChange}
        tagIds={tagIds}
        onToggleTag={handleToggleTag}
      />

      <RulePropertyFields
        categoryId={setCategoryId === NO_CATEGORY ? "" : setCategoryId}
        properties={properties}
        numberInputs={numberInputs}
        booleanInputs={booleanInputs}
        dateTimeInputs={dateTimeInputs}
        onNumberChange={handleNumberChange}
        onBooleanChange={handleBooleanChange}
        onDateTimeChange={handleDateTimeChange}
      />
    </div>
  );
}
