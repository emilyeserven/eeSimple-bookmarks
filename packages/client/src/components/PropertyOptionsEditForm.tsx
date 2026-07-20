import type { PropertyFormApi } from "./propertyFormSchema";
import type { OptionsKey } from "./propertyOptionsKeys";
import type { CustomProperty, UpdateCustomPropertyInput } from "@eesimple/types";

import { useEffect, useRef } from "react";

import i18n from "../i18n";
import { payloadFromValues, propertySchema, valuesFromProperty } from "./propertyFormParts";
import { OPTIONS_KEYS } from "./propertyOptionsKeys";
import { PropertyOptionsSection } from "./PropertyOptionsSection";
import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useAppForm } from "../lib/form";

const LABELS: Partial<Record<OptionsKey, string>> = {
  numberMin: i18n.t("Slider minimum"),
  numberMax: i18n.t("Slider maximum"),
  unitSingular: i18n.t("Unit"),
  unitPlural: i18n.t("Unit"),
  valuePrefix: i18n.t("Value prefix"),
  zeroLabel: i18n.t("Zero label"),
  maxLabel: i18n.t("Maximum label"),
  numberFormat: i18n.t("Number format"),
  quickFilterRange: i18n.t("Quick filter range"),
  operandPropertyIds: i18n.t("Operands"),
  dateTimeFormat: i18n.t("Captures"),
  booleanLabelPreset: i18n.t("Value display"),
  booleanTrueLabel: i18n.t("True label"),
  booleanFalseLabel: i18n.t("False label"),
  ratingMax: i18n.t("Scale"),
  ratingAllowZero: i18n.t("Allow zero"),
  ratingAllowHalf: i18n.t("Allow half ratings"),
  ratingShowLabel: i18n.t("Rating label"),
  ratingLabel: i18n.t("Rating label"),
  ratingAllowRange: i18n.t("Allow a range"),
  ratingLabels: i18n.t("Rating labels"),
  ratingCategoryLabels: i18n.t("Per-category labels"),
  ratingDisplay: i18n.t("Display style"),
  ratingRangeIncludeStart: i18n.t("Include start in range"),
  choicesItems: i18n.t("Choices"),
  choicesDisplay: i18n.t("Display"),
  choicesMultiple: i18n.t("Selection mode"),
  itemInItemsBeforeText: i18n.t("Before text"),
  itemInItemsBetweenText: i18n.t("Between text"),
  itemInItemsAfterText: i18n.t("After text"),
  itemInItemsMediaTypeTexts: i18n.t("Per media type text"),
  itemInItemsSourcePropertyId: i18n.t("Source property"),
  sectionsDefaultType: i18n.t("Default entry type"),
  sectionsAllowedTypes: i18n.t("Allowed entry types"),
  sectionsTiered: i18n.t("Tiered sections"),
  allowDefault: i18n.t("Default value"),
  showInDetails: i18n.t("Show in detail view"),
  showInGallery: i18n.t("Show in Media Management"),
};

interface PropertyOptionsEditFormProps {
  property: CustomProperty;
  numberProperties: CustomProperty[];
}

/**
 * The Options edit tab: reuses the shared `PropertyOptionsSection` markup bound to a local form, and
 * auto-saves each type-specific option **on blur** (no Save button, no per-keystroke writes) — a text
 * input settles when you leave it, a select/toggle when focus moves off it. A section-level `onBlur`
 * (React's focus-out bubbles from every child field) runs the save pass; the per-field no-op guard in
 * `useFieldAutoSave` means only the key(s) that actually changed PATCH and toast. An unmount flush
 * covers a control changed as the very last action (leaving the tab before any blur fires).
 */
export function PropertyOptionsEditForm({
  property,
  numberProperties,
}: PropertyOptionsEditFormProps) {
  const updateProperty = useUpdateCustomProperty();
  const {
    saveField,
  } = useFieldAutoSave<UpdateCustomPropertyInput, CustomProperty>({
    id: property.id,
    update: updateProperty,
    labels: LABELS,
    initial: payloadFromValues(valuesFromProperty(property)),
  });

  const form: PropertyFormApi = useAppForm({
    defaultValues: valuesFromProperty(property),
    validators: {
      onChange: propertySchema,
    },
  });

  /** Persist whichever Options-owned keys changed since the last save. Reused by blur and unmount. */
  function saveChangedOptions() {
    const payload = payloadFromValues(form.state.values);
    for (const key of OPTIONS_KEYS) {
      const value = payload[key];
      if (value === undefined) continue;
      saveField(key, value as UpdateCustomPropertyInput[typeof key]);
    }
  }

  // Flush on unmount so a value changed as the last action (which never blurred, e.g. leaving the tab)
  // still persists. The ref keeps the empty-deps cleanup pointed at the latest closure.
  const saveRef = useRef(saveChangedOptions);
  saveRef.current = saveChangedOptions;
  useEffect(() => () => saveRef.current(), []);

  return (
    <div onBlur={saveChangedOptions}>
      <PropertyOptionsSection
        form={form}
        idPrefix={`property-${property.id}`}
        mode="edit"
        numberProperties={numberProperties}
        section="options"
        full={false}
      />
    </div>
  );
}
