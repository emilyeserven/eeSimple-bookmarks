import type {
  AutofillRule,
  UpdateAutofillRuleInput,
} from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import {
  buildBooleanValues,
  buildDateTimeValues,
  buildNumberValues,
  categoryProperties,
} from "./autofillPrefillValues";
import { NO_CATEGORY, NO_MEDIA_TYPE, RulePropertyFields } from "./AutofillRuleForm";
import { AutofillRulePrefillPickers } from "./AutofillRulePrefillPickers";
import { useAutofillPrefillData } from "./useAutofillPrefillData";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

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
    t,
  } = useTranslation();
  const {
    categories, properties, tagTree, mediaTypeTree, locationTree, updateRule,
  } = useAutofillPrefillData();

  const LABELS: Partial<Record<keyof UpdateAutofillRuleInput, string>> = {
    setCategoryId: t("Category"),
    setMediaTypeId: t("Media Type"),
    tagIds: t("Tags"),
    locationIds: t("Locations"),
    numberValues: t("Number values"),
    booleanValues: t("Boolean values"),
    dateTimeValues: t("Date/Time values"),
  };

  const initialCategoryId = rule.setCategoryId ?? NO_CATEGORY;
  const initialMediaTypeId = rule.setMediaTypeId ?? NO_MEDIA_TYPE;
  const initialNumberInputs = Object.fromEntries(rule.numberValues.map(e => [e.propertyId, String(e.value)]));
  const initialBooleanInputs = Object.fromEntries(rule.booleanValues.map(e => [e.propertyId, e.value]));
  const initialDateTimeInputs = Object.fromEntries(rule.dateTimeValues.map(e => [e.propertyId, e.value]));

  const [setCategoryId, setSetCategoryId] = useState(initialCategoryId);
  const [setMediaTypeId, setSetMediaTypeId] = useState(initialMediaTypeId);
  const [tagIds, setTagIds] = useState<string[]>(rule.tagIds);
  const [locationIds, setLocationIds] = useState<string[]>(rule.locationIds);
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
      locationIds: rule.locationIds,
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

  function handleToggleLocation(id: string) {
    const next = locationIds.includes(id) ? locationIds.filter(l => l !== id) : [...locationIds, id];
    setLocationIds(next);
    autoSave.saveField("locationIds", next);
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
        mediaTypeTree={mediaTypeTree}
        tagTree={tagTree}
        locationTree={locationTree}
        setCategoryId={setCategoryId}
        onCategoryChange={handleCategoryChange}
        setMediaTypeId={setMediaTypeId}
        onMediaTypeChange={handleMediaTypeChange}
        tagIds={tagIds}
        onToggleTag={handleToggleTag}
        locationIds={locationIds}
        onToggleLocation={handleToggleLocation}
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
