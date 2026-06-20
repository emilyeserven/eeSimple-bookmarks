import type { CreateCustomPropertyInput, CustomProperty } from "@eesimple/types";

import { z } from "zod";

import { useAppForm } from "../lib/form";

export const propertySchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    type: z.enum(["number", "boolean", "calculate", "datetime"]),
    dateTimeFormat: z.enum(["date", "time", "datetime"]),
    description: z.string(),
    numberMin: z.string(),
    numberMax: z.string(),
    disableMin: z.boolean(),
    disableMax: z.boolean(),
    unitSingular: z.string(),
    unitPlural: z.string(),
    valuePrefix: z.string(),
    zeroLabel: z.string(),
    maxLabel: z.string(),
    numberFormat: z.enum(["plain", "duration"]),
    operandIds: z.array(z.string()),
    categoryIds: z.array(z.string()),
    allCategories: z.boolean(),
    mediaTypeIds: z.array(z.string()),
    allMediaTypes: z.boolean(),
    inForm: z.boolean(),
    showOutsideAdvanced: z.boolean(),
    showInListings: z.boolean(),
    editableOnCard: z.boolean(),
    enabled: z.boolean(),
    allowDefault: z.boolean(),
    propertyGroupId: z.string(),
    showIfFalse: z.boolean(),
    booleanLabelPreset: z.enum(["yes-no", "true-false", "enabled-disabled", "icons", "stars", "custom"]),
    booleanTrueLabel: z.string(),
    booleanFalseLabel: z.string(),
    showLabelColon: z.boolean(),
    showValueBeforeLabel: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "calculate" && value.operandIds.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least two Number properties.",
        path: ["operandIds"],
      });
    }
  });

export type PropertyFormValues = z.infer<typeof propertySchema>;

export const CREATE_DEFAULTS: PropertyFormValues = {
  name: "",
  type: "number",
  dateTimeFormat: "date",
  description: "",
  // No minimum / maximum by default — the disable boxes start checked.
  numberMin: "0",
  numberMax: "100",
  disableMin: true,
  disableMax: true,
  unitSingular: "",
  unitPlural: "",
  valuePrefix: "",
  zeroLabel: "",
  maxLabel: "",
  numberFormat: "plain",
  operandIds: [],
  categoryIds: [],
  allCategories: false,
  mediaTypeIds: [],
  allMediaTypes: false,
  inForm: true,
  showOutsideAdvanced: true,
  showInListings: true,
  editableOnCard: false,
  enabled: true,
  allowDefault: true,
  propertyGroupId: "",
  showIfFalse: false,
  booleanLabelPreset: "yes-no",
  booleanTrueLabel: "",
  booleanFalseLabel: "",
  showLabelColon: true,
  showValueBeforeLabel: false,
};

/**
 * The exact `useAppForm` instance type for the property form, with `propertySchema` wired as the
 * `onChange` validator. Sub-components (e.g. `PropertyDisplaySection`) take the live form as a prop
 * typed with this so they share the parent's fully-inferred field types. Inferred from a sample
 * factory (never executed — it exists only for its return type) so the generic shape always matches
 * `PropertyForm`'s real `useAppForm` call, including the validator generics.
 */
function _propertyFormApiSample() {
  return useAppForm({
    defaultValues: CREATE_DEFAULTS,
    validators: {
      onChange: propertySchema,
    },
  });
}
export type PropertyFormApi = ReturnType<typeof _propertyFormApiSample>;

/** Map a saved property to editable form values (null bounds become the "disabled" state). */
export function valuesFromProperty(property: CustomProperty): PropertyFormValues {
  return {
    name: property.name,
    type: property.type,
    dateTimeFormat: property.dateTimeFormat ?? "date",
    description: property.description ?? "",
    numberMin: property.numberMin === null ? "0" : String(property.numberMin),
    numberMax: property.numberMax === null ? "100" : String(property.numberMax),
    disableMin: property.numberMin === null,
    disableMax: property.numberMax === null,
    unitSingular: property.unitSingular ?? "",
    unitPlural: property.unitPlural ?? "",
    valuePrefix: property.valuePrefix ?? "",
    zeroLabel: property.zeroLabel ?? "",
    maxLabel: property.maxLabel ?? "",
    numberFormat: property.numberFormat ?? "plain",
    operandIds: property.operandPropertyIds,
    categoryIds: property.categoryIds,
    allCategories: property.allCategories,
    mediaTypeIds: property.mediaTypeIds,
    allMediaTypes: property.allMediaTypes,
    inForm: !property.hiddenFromForm,
    showOutsideAdvanced: property.showInForm,
    showInListings: property.showInListings,
    editableOnCard: property.editableOnCard,
    enabled: property.enabled,
    allowDefault: property.allowDefault ?? true,
    propertyGroupId: property.propertyGroupId ?? "",
    showIfFalse: property.showIfFalse,
    booleanLabelPreset: property.booleanLabelPreset ?? "yes-no",
    booleanTrueLabel: property.booleanTrueLabel ?? "",
    booleanFalseLabel: property.booleanFalseLabel ?? "",
    showLabelColon: property.showLabelColon,
    showValueBeforeLabel: property.showValueBeforeLabel,
  };
}

/** Build the create/update payload from form values (`type` is ignored by the update route). */
export function payloadFromValues(values: PropertyFormValues): CreateCustomPropertyInput {
  const isNumber = values.type === "number";
  const trimOrNull = (value: string): string | null => (value.trim() ? value.trim() : null);
  return {
    name: values.name.trim(),
    type: values.type,
    dateTimeFormat: values.type === "datetime" ? values.dateTimeFormat : null,
    description: trimOrNull(values.description),
    numberMin: isNumber && !values.disableMin ? Number(values.numberMin) : null,
    numberMax: isNumber && !values.disableMax ? Number(values.numberMax) : null,
    unitSingular: isNumber ? trimOrNull(values.unitSingular) : null,
    unitPlural: isNumber ? trimOrNull(values.unitPlural) : null,
    valuePrefix: isNumber ? trimOrNull(values.valuePrefix) : null,
    zeroLabel: isNumber ? trimOrNull(values.zeroLabel) : null,
    maxLabel: isNumber ? trimOrNull(values.maxLabel) : null,
    numberFormat: isNumber ? values.numberFormat : null,
    operandPropertyIds: values.type === "calculate" ? values.operandIds : undefined,
    categoryIds: values.categoryIds,
    allCategories: values.allCategories,
    mediaTypeIds: values.mediaTypeIds,
    allMediaTypes: values.allMediaTypes,
    hiddenFromForm: !values.inForm,
    showInForm: values.showOutsideAdvanced,
    showInListings: values.showInListings,
    // Calculate values are computed server-side, so they can never be edited from the card menu.
    editableOnCard: values.type === "calculate" ? false : values.editableOnCard,
    enabled: values.enabled,
    allowDefault: values.allowDefault,
    propertyGroupId: values.propertyGroupId || null,
    showIfFalse: values.type === "boolean" ? values.showIfFalse : undefined,
    booleanLabelPreset: values.type === "boolean" ? values.booleanLabelPreset : null,
    booleanTrueLabel:
      values.type === "boolean" && values.booleanLabelPreset === "custom"
        ? trimOrNull(values.booleanTrueLabel)
        : null,
    booleanFalseLabel:
      values.type === "boolean" && values.booleanLabelPreset === "custom"
        ? trimOrNull(values.booleanFalseLabel)
        : null,
    showLabelColon: values.type === "boolean" ? values.showLabelColon : undefined,
    showValueBeforeLabel: values.type === "boolean" ? values.showValueBeforeLabel : undefined,
  };
}
