import type { CreateCustomPropertyInput, CustomProperty } from "@eesimple/types";

import { CUSTOM_PROPERTY_TYPES, DATE_TIME_FORMATS, NUMBER_FORMATS } from "@eesimple/types";
import { z } from "zod";

import { useAppForm } from "../lib/form";

/** One section of the property form, used to render a single tab on the edit pages. */
export type PropertyFormSection = "general" | "options" | "categories" | "media-types" | "display";

/** Which property-form sections render: all of them in the full form, or just the one named tab. */
export interface PropertySectionVisibility {
  full: boolean;
  showGeneral: boolean;
  showOptions: boolean;
  showCategories: boolean;
  showMediaTypes: boolean;
  showDisplay: boolean;
}

/**
 * Resolve which sections to show from the optional `section` tab. Extracted as a pure helper so the
 * five `full || section === …` derivations stay out of the component (keeping it under the cap).
 */
export function sectionVisibility(section?: PropertyFormSection): PropertySectionVisibility {
  const full = section === undefined;
  return {
    full,
    showGeneral: full || section === "general",
    showOptions: full || section === "options",
    showCategories: full || section === "categories",
    showMediaTypes: full || section === "media-types",
    showDisplay: full || section === "display",
  };
}

export const propertySchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    type: z.enum(CUSTOM_PROPERTY_TYPES),
    dateTimeFormat: z.enum(DATE_TIME_FORMATS),
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
    numberFormat: z.enum(NUMBER_FORMATS),
    // "Quick filter ± range" inputs. `quickFilterRange` holds the plain-number delta; the d/h/m/s
    // fields hold the breakdown for duration numbers (minutes/seconds) and datetime props (all four).
    // They are composed into a single canonical `quickFilterRange` (seconds for duration/datetime).
    quickFilterRange: z.string(),
    quickFilterRangeDays: z.string(),
    quickFilterRangeHours: z.string(),
    quickFilterRangeMinutes: z.string(),
    quickFilterRangeSeconds: z.string(),
    operandIds: z.array(z.string()),
    categoryIds: z.array(z.string()),
    allCategories: z.boolean(),
    mediaTypeIds: z.array(z.string()),
    allMediaTypes: z.boolean(),
    inForm: z.boolean(),
    showOutsideAdvanced: z.boolean(),
    showInListings: z.boolean(),
    showInGallery: z.boolean(),
    showInDetails: z.boolean(),
    editableOnCard: z.boolean(),
    enabled: z.boolean(),
    allowDefault: z.boolean(),
    propertyGroupId: z.string(),
    booleanLabelPreset: z.enum(["yes-no", "true-false", "enabled-disabled", "icons", "stars", "custom"]),
    booleanTrueLabel: z.string(),
    booleanFalseLabel: z.string(),
    ratingMax: z.enum(["3", "5"]),
    ratingAllowZero: z.boolean(),
    ratingAllowHalf: z.boolean(),
    ratingShowLabel: z.boolean(),
    ratingLabel: z.string(),
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
  quickFilterRange: "",
  quickFilterRangeDays: "",
  quickFilterRangeHours: "",
  quickFilterRangeMinutes: "",
  quickFilterRangeSeconds: "",
  operandIds: [],
  categoryIds: [],
  allCategories: false,
  mediaTypeIds: [],
  allMediaTypes: false,
  inForm: true,
  showOutsideAdvanced: true,
  showInListings: true,
  showInGallery: true,
  showInDetails: true,
  editableOnCard: false,
  enabled: true,
  allowDefault: true,
  propertyGroupId: "",
  booleanLabelPreset: "yes-no",
  booleanTrueLabel: "",
  booleanFalseLabel: "",
  ratingMax: "5",
  ratingAllowZero: false,
  ratingAllowHalf: false,
  ratingShowLabel: false,
  ratingLabel: "",
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

/** The five flat form fields that back the "Quick filter ± range" inputs. */
type QuickFilterRangeFields = Pick<
  PropertyFormValues,
  | "quickFilterRange"
  | "quickFilterRangeDays"
  | "quickFilterRangeHours"
  | "quickFilterRangeMinutes"
  | "quickFilterRangeSeconds"
>;

const EMPTY_QUICK_FILTER_RANGE: QuickFilterRangeFields = {
  quickFilterRange: "",
  quickFilterRangeDays: "",
  quickFilterRangeHours: "",
  quickFilterRangeMinutes: "",
  quickFilterRangeSeconds: "",
};

/** Stringify a positive integer for a breakdown field, leaving `0` blank so the input shows empty. */
function rangePart(value: number): string {
  return value > 0 ? String(value) : "";
}

/**
 * Decompose a stored `quickFilterRange` (raw units for a plain number, seconds for a duration number
 * and for a datetime) into the flat form fields for the property's type/format.
 */
function quickFilterRangeToFields(property: CustomProperty): QuickFilterRangeFields {
  const total = property.quickFilterRange;
  if (total === null) return EMPTY_QUICK_FILTER_RANGE;
  if (property.type === "number") {
    if (property.numberFormat === "duration") {
      const seconds = Math.max(0, Math.round(total));
      return {
        ...EMPTY_QUICK_FILTER_RANGE,
        quickFilterRangeMinutes: rangePart(Math.floor(seconds / 60)),
        quickFilterRangeSeconds: rangePart(seconds % 60),
      };
    }
    return {
      ...EMPTY_QUICK_FILTER_RANGE,
      quickFilterRange: String(total),
    };
  }
  if (property.type === "datetime") {
    const seconds = Math.max(0, Math.round(total));
    return {
      ...EMPTY_QUICK_FILTER_RANGE,
      quickFilterRangeDays: rangePart(Math.floor(seconds / 86_400)),
      quickFilterRangeHours: rangePart(Math.floor((seconds % 86_400) / 3600)),
      quickFilterRangeMinutes: rangePart(Math.floor((seconds % 3600) / 60)),
      quickFilterRangeSeconds: rangePart(seconds % 60),
    };
  }
  return EMPTY_QUICK_FILTER_RANGE;
}

/** Parse a breakdown field to a non-negative integer (blank/invalid → 0). */
function rangeNum(value: string): number {
  const n = Number(value.trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Compose the flat form fields back into a canonical `quickFilterRange` for the API: raw units for a
 * plain number, seconds for a duration number and for a datetime. Returns `null` (exact match) when
 * the type has no range or every input is blank.
 */
function quickFilterRangeFromValues(values: PropertyFormValues): number | null {
  if (values.type === "number") {
    if (values.numberFormat === "duration") {
      const seconds = rangeNum(values.quickFilterRangeMinutes) * 60
        + rangeNum(values.quickFilterRangeSeconds);
      return seconds > 0 ? seconds : null;
    }
    const raw = values.quickFilterRange.trim();
    if (raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  if (values.type === "datetime") {
    const seconds = rangeNum(values.quickFilterRangeDays) * 86_400
      + rangeNum(values.quickFilterRangeHours) * 3600
      + rangeNum(values.quickFilterRangeMinutes) * 60
      + rangeNum(values.quickFilterRangeSeconds);
    return seconds > 0 ? seconds : null;
  }
  return null;
}

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
    ...quickFilterRangeToFields(property),
    operandIds: property.operandPropertyIds,
    categoryIds: property.categoryIds,
    allCategories: property.allCategories,
    mediaTypeIds: property.mediaTypeIds,
    allMediaTypes: property.allMediaTypes,
    inForm: !property.hiddenFromForm,
    showOutsideAdvanced: property.showInForm,
    showInListings: property.showInListings,
    showInGallery: property.showInGallery,
    showInDetails: property.showInDetails,
    editableOnCard: property.editableOnCard,
    enabled: property.enabled,
    allowDefault: property.allowDefault ?? true,
    propertyGroupId: property.propertyGroupId ?? "",
    booleanLabelPreset: property.booleanLabelPreset ?? "yes-no",
    booleanTrueLabel: property.booleanTrueLabel ?? "",
    booleanFalseLabel: property.booleanFalseLabel ?? "",
    ratingMax: property.ratingMax === 3 ? "3" : "5",
    ratingAllowZero: property.ratingAllowZero,
    ratingAllowHalf: property.ratingAllowHalf,
    ratingShowLabel: property.ratingShowLabel,
    ratingLabel: property.ratingLabel ?? "",
  };
}

const trimOrNull = (value: string): string | null => (value.trim() ? value.trim() : null);

/** Number/calculate-only fields, nulled out for every other property type. */
function numberPayloadFields(values: PropertyFormValues): Pick<
  CreateCustomPropertyInput,
  "numberMin" | "numberMax" | "unitSingular" | "unitPlural" | "valuePrefix" | "zeroLabel" | "maxLabel" | "numberFormat"
> {
  const isNumber = values.type === "number";
  return {
    numberMin: isNumber && !values.disableMin ? Number(values.numberMin) : null,
    numberMax: isNumber && !values.disableMax ? Number(values.numberMax) : null,
    unitSingular: isNumber ? trimOrNull(values.unitSingular) : null,
    unitPlural: isNumber ? trimOrNull(values.unitPlural) : null,
    valuePrefix: isNumber ? trimOrNull(values.valuePrefix) : null,
    zeroLabel: isNumber ? trimOrNull(values.zeroLabel) : null,
    maxLabel: isNumber ? trimOrNull(values.maxLabel) : null,
    numberFormat: isNumber ? values.numberFormat : null,
  };
}

/** Boolean-only value-formatting fields, left `null` for every other property type. */
function booleanPayloadFields(values: PropertyFormValues): Pick<
  CreateCustomPropertyInput,
  "booleanLabelPreset" | "booleanTrueLabel" | "booleanFalseLabel"
> {
  const isBoolean = values.type === "boolean";
  const isCustom = isBoolean && values.booleanLabelPreset === "custom";
  return {
    booleanLabelPreset: isBoolean ? values.booleanLabelPreset : null,
    booleanTrueLabel: isCustom ? trimOrNull(values.booleanTrueLabel) : null,
    booleanFalseLabel: isCustom ? trimOrNull(values.booleanFalseLabel) : null,
  };
}

/** Rating-scale-only fields, nulled out / left `undefined` for every other property type. */
function ratingPayloadFields(values: PropertyFormValues): Pick<
  CreateCustomPropertyInput,
  "ratingMax" | "ratingAllowZero" | "ratingAllowHalf" | "ratingShowLabel" | "ratingLabel"
> {
  const isRating = values.type === "ratingScale";
  return {
    ratingMax: isRating ? (values.ratingMax === "3" ? 3 : 5) : null,
    ratingAllowZero: isRating ? values.ratingAllowZero : undefined,
    ratingAllowHalf: isRating ? values.ratingAllowHalf : undefined,
    ratingShowLabel: isRating ? values.ratingShowLabel : undefined,
    ratingLabel: isRating ? trimOrNull(values.ratingLabel) : null,
  };
}

/** Build the create/update payload from form values (`type` is ignored by the update route). */
export function payloadFromValues(values: PropertyFormValues): CreateCustomPropertyInput {
  return {
    name: values.name.trim(),
    type: values.type,
    dateTimeFormat: values.type === "datetime" ? values.dateTimeFormat : null,
    description: trimOrNull(values.description),
    quickFilterRange: quickFilterRangeFromValues(values),
    operandPropertyIds: values.type === "calculate" ? values.operandIds : undefined,
    categoryIds: values.categoryIds,
    allCategories: values.allCategories,
    mediaTypeIds: values.mediaTypeIds,
    allMediaTypes: values.allMediaTypes,
    hiddenFromForm: !values.inForm,
    showInForm: values.showOutsideAdvanced,
    showInListings: values.showInListings,
    showInGallery: values.showInGallery,
    showInDetails: values.showInDetails,
    // Calculate values are computed server-side, so they can never be edited from the card menu.
    editableOnCard: values.type === "calculate" ? false : values.editableOnCard,
    enabled: values.enabled,
    allowDefault: values.allowDefault,
    propertyGroupId: values.propertyGroupId || null,
    ...numberPayloadFields(values),
    ...booleanPayloadFields(values),
    ...ratingPayloadFields(values),
  };
}
