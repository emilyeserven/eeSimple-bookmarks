import type { AutofillRule, UpdateAutofillRuleInput } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import {
  buildBooleanValues,
  buildDateTimeValues,
  buildNumberValues,
  categoryProperties,
} from "./autofillPrefillValues";
import { NO_CATEGORY, NO_MEDIA_TYPE, RulePropertyFields } from "./AutofillRuleForm";
import {
  AutofillCategoryPicker,
  AutofillLocationsPicker,
  AutofillMediaTypePicker,
  AutofillTagsPicker,
} from "./AutofillRulePrefillPickers";
import { useUpdateAutofillRule } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useLocationTree } from "../hooks/useLocations";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
import { useTagTree } from "../hooks/useTags";

/**
 * The autofill rule's prefill actions as five independently-placeable edit fields (#1197). Each
 * owns its own taxonomy query + single-field {@link useFieldAutoSave}, so it auto-saves on change
 * with a field-named toast and can be surfaced on its own Page Layouts field — no shared form
 * controller is needed (mirrors the newsletter `NewsletterCategoryEdit`/`NewsletterMediaTypeEdit`
 * split). The lone cross-field link — the property inputs scope to the chosen category — resolves
 * by reading the persisted `rule.setCategoryId`.
 */

/** Edit field: the category this rule sets on a matched bookmark. */
export function AutofillPrefillCategoryField({
  rule,
}: { rule: AutofillRule }) {
  const {
    t,
  } = useTranslation();
  const {
    data: categories = [],
  } = useCategories();
  const updateRule = useUpdateAutofillRule();
  const [value, setValue] = useState(rule.setCategoryId ?? NO_CATEGORY);

  const autoSave = useFieldAutoSave<UpdateAutofillRuleInput>({
    id: rule.id,
    update: updateRule,
    labels: {
      setCategoryId: t("Category"),
    },
    initial: {
      setCategoryId: rule.setCategoryId,
    },
  });

  function handleChange(next: string) {
    setValue(next);
    autoSave.saveField("setCategoryId", next === NO_CATEGORY ? null : next);
  }

  return (
    <AutofillCategoryPicker
      categories={categories}
      value={value}
      onChange={handleChange}
    />
  );
}

/** Edit field: the media type this rule sets on a matched bookmark. */
export function AutofillPrefillMediaTypeField({
  rule,
}: { rule: AutofillRule }) {
  const {
    t,
  } = useTranslation();
  const {
    data: mediaTypeTree = [],
  } = useMediaTypeTree();
  const updateRule = useUpdateAutofillRule();
  const [value, setValue] = useState(rule.setMediaTypeId ?? NO_MEDIA_TYPE);

  const autoSave = useFieldAutoSave<UpdateAutofillRuleInput>({
    id: rule.id,
    update: updateRule,
    labels: {
      setMediaTypeId: t("Media Type"),
    },
    initial: {
      setMediaTypeId: rule.setMediaTypeId,
    },
  });

  function handleChange(next: string) {
    setValue(next);
    autoSave.saveField("setMediaTypeId", next === NO_MEDIA_TYPE ? null : next);
  }

  return (
    <AutofillMediaTypePicker
      mediaTypeTree={mediaTypeTree}
      value={value}
      onChange={handleChange}
    />
  );
}

/** Edit field: the tags this rule applies to a matched bookmark. */
export function AutofillPrefillTagsField({
  rule,
}: { rule: AutofillRule }) {
  const {
    t,
  } = useTranslation();
  const {
    data: tagTree = [],
  } = useTagTree();
  const updateRule = useUpdateAutofillRule();
  const [tagIds, setTagIds] = useState<string[]>(rule.tagIds);

  const autoSave = useFieldAutoSave<UpdateAutofillRuleInput>({
    id: rule.id,
    update: updateRule,
    labels: {
      tagIds: t("Tags"),
    },
    initial: {
      tagIds: rule.tagIds,
    },
  });

  function handleToggle(id: string) {
    const next = tagIds.includes(id) ? tagIds.filter(tagId => tagId !== id) : [...tagIds, id];
    setTagIds(next);
    autoSave.saveField("tagIds", next);
  }

  return (
    <AutofillTagsPicker
      tagTree={tagTree}
      selectedIds={tagIds}
      onToggle={handleToggle}
    />
  );
}

/** Edit field: the locations this rule applies to a matched bookmark. */
export function AutofillPrefillLocationsField({
  rule,
}: { rule: AutofillRule }) {
  const {
    t,
  } = useTranslation();
  const {
    data: locationTree = [],
  } = useLocationTree();
  const updateRule = useUpdateAutofillRule();
  const [locationIds, setLocationIds] = useState<string[]>(rule.locationIds);

  const autoSave = useFieldAutoSave<UpdateAutofillRuleInput>({
    id: rule.id,
    update: updateRule,
    labels: {
      locationIds: t("Locations"),
    },
    initial: {
      locationIds: rule.locationIds,
    },
  });

  function handleToggle(id: string) {
    const next = locationIds.includes(id) ? locationIds.filter(locId => locId !== id) : [...locationIds, id];
    setLocationIds(next);
    autoSave.saveField("locationIds", next);
  }

  return (
    <AutofillLocationsPicker
      locationTree={locationTree}
      selectedIds={locationIds}
      onToggle={handleToggle}
    />
  );
}

/**
 * Edit field: the custom-property values this rule sets. A category-scoped composite (the shown
 * inputs depend on the rule's chosen category, like the Conditions builder) — one field, not one
 * per property. Scopes off the persisted `rule.setCategoryId`.
 */
export function AutofillPrefillPropertiesField({
  rule,
}: { rule: AutofillRule }) {
  const {
    t,
  } = useTranslation();
  const {
    data: properties = [],
  } = useCustomProperties();
  const updateRule = useUpdateAutofillRule();

  const [numberInputs, setNumberInputs] = useState<Record<string, string>>(
    Object.fromEntries(rule.numberValues.map(e => [e.propertyId, String(e.value)])),
  );
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>(
    Object.fromEntries(rule.booleanValues.map(e => [e.propertyId, e.value])),
  );
  const [dateTimeInputs, setDateTimeInputs] = useState<Record<string, string>>(
    Object.fromEntries(rule.dateTimeValues.map(e => [e.propertyId, e.value])),
  );

  const autoSave = useFieldAutoSave<UpdateAutofillRuleInput>({
    id: rule.id,
    update: updateRule,
    labels: {
      numberValues: t("Number values"),
      booleanValues: t("Boolean values"),
      dateTimeValues: t("Date/Time values"),
    },
    initial: {
      numberValues: rule.numberValues,
      booleanValues: rule.booleanValues,
      dateTimeValues: rule.dateTimeValues,
    },
  });

  const scopedProps = categoryProperties(properties, rule.setCategoryId);

  function handleNumberChange(id: string, value: string) {
    const next = {
      ...numberInputs,
      [id]: value,
    };
    setNumberInputs(next);
    autoSave.saveField("numberValues", buildNumberValues(scopedProps, next));
  }

  function handleBooleanChange(id: string, value: boolean) {
    const next = {
      ...booleanInputs,
      [id]: value,
    };
    setBooleanInputs(next);
    autoSave.saveField("booleanValues", buildBooleanValues(scopedProps, next));
  }

  function handleDateTimeChange(id: string, value: string) {
    const next = {
      ...dateTimeInputs,
      [id]: value,
    };
    setDateTimeInputs(next);
    autoSave.saveField("dateTimeValues", buildDateTimeValues(scopedProps, next));
  }

  return (
    <RulePropertyFields
      categoryId={rule.setCategoryId ?? ""}
      properties={properties}
      numberInputs={numberInputs}
      booleanInputs={booleanInputs}
      dateTimeInputs={dateTimeInputs}
      onNumberChange={handleNumberChange}
      onBooleanChange={handleBooleanChange}
      onDateTimeChange={handleDateTimeChange}
    />
  );
}
