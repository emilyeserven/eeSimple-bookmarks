import type { CreateCustomPropertyInput, CustomProperty } from "@eesimple/types";

import { CHOICES_DISPLAY_TYPES, clampRatingMax, CUSTOM_PROPERTY_TYPES, DATE_TIME_FORMATS, NUMBER_FORMATS, RATING_DISPLAYS, RATING_MAX_LIMIT, RATING_MAX_MIN, SECTION_ENTRY_TYPES } from "@eesimple/types";
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
    dateTimeAllowYearMonth: z.boolean(),
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
    showInListings: z.boolean(),
    showInGallery: z.boolean(),
    showInDetails: z.boolean(),
    editableOnCard: z.boolean(),
    editableViaCmdk: z.boolean(),
    enabledInInbox: z.boolean(),
    enabled: z.boolean(),
    allowDefault: z.boolean(),
    booleanLabelPreset: z.enum(["yes-no", "true-false", "enabled-disabled", "icons", "stars", "custom"]),
    booleanTrueLabel: z.string(),
    booleanFalseLabel: z.string(),
    ratingMax: z.string().refine((value) => {
      const n = Number(value.trim());
      return Number.isInteger(n) && n >= RATING_MAX_MIN && n <= RATING_MAX_LIMIT;
    }, `Scale must be a whole number between ${RATING_MAX_MIN} and ${RATING_MAX_LIMIT}`),
    ratingAllowZero: z.boolean(),
    ratingAllowHalf: z.boolean(),
    ratingShowLabel: z.boolean(),
    ratingLabel: z.string(),
    ratingAllowRange: z.boolean(),
    // Per-level labels keyed by the level as a string ("0".."ratingMax"); empty/absent = the number.
    ratingLabels: z.record(z.string(), z.string()),
    // Per-category overrides of the level labels, editable as an array of rows (record-keyed jsonb
    // on the wire; a blank level inherits the base label above).
    ratingCategoryLabels: z.array(z.object({
      categoryId: z.string(),
      labels: z.record(z.string(), z.string()),
    })),
    ratingDisplay: z.enum(RATING_DISPLAYS),
    ratingRangeIncludeStart: z.boolean(),
    choicesItems: z.array(z.object({
      label: z.string(),
      value: z.string(),
      isDefault: z.boolean().optional(),
    })),
    choicesDisplay: z.enum(CHOICES_DISPLAY_TYPES),
    choicesMultiple: z.boolean(),
    itemInItemsBeforeText: z.string(),
    itemInItemsBetweenText: z.string(),
    itemInItemsAfterText: z.string(),
    // Editable as an array of rows (record-keyed jsonb on the wire; empty string = inherit base).
    itemInItemsMediaTypeTexts: z.array(z.object({
      mediaTypeId: z.string(),
      beforeText: z.string(),
      betweenText: z.string(),
      afterText: z.string(),
    })),
    // Empty string = no source (manual entry); plays nicely with the string-typed ComboboxField.
    itemInItemsSourcePropertyId: z.string(),
    sectionsDefaultType: z.enum(SECTION_ENTRY_TYPES).nullable(),
    sectionsAllowedTypes: z.array(z.enum(SECTION_ENTRY_TYPES)),
    sectionsTiered: z.boolean(),
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
  dateTimeAllowYearMonth: false,
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
  showInListings: true,
  showInGallery: true,
  showInDetails: true,
  editableOnCard: false,
  editableViaCmdk: false,
  enabledInInbox: false,
  enabled: true,
  allowDefault: true,
  booleanLabelPreset: "yes-no",
  booleanTrueLabel: "",
  booleanFalseLabel: "",
  ratingMax: "5",
  ratingAllowZero: false,
  ratingAllowHalf: false,
  ratingShowLabel: false,
  ratingLabel: "",
  ratingAllowRange: false,
  ratingLabels: {},
  ratingCategoryLabels: [],
  ratingDisplay: "stars",
  ratingRangeIncludeStart: false,
  choicesItems: [],
  choicesDisplay: "radio",
  choicesMultiple: false,
  itemInItemsBeforeText: "",
  itemInItemsBetweenText: " of ",
  itemInItemsAfterText: "",
  itemInItemsMediaTypeTexts: [],
  itemInItemsSourcePropertyId: "",
  sectionsDefaultType: null,
  sectionsAllowedTypes: [],
  sectionsTiered: false,
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
    dateTimeAllowYearMonth: property.dateTimeAllowYearMonth ?? false,
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
    showInListings: property.showInListings,
    showInGallery: property.showInGallery,
    showInDetails: property.showInDetails,
    editableOnCard: property.editableOnCard,
    editableViaCmdk: property.editableViaCmdk,
    enabledInInbox: property.enabledInInbox,
    enabled: property.enabled,
    allowDefault: property.allowDefault ?? true,
    booleanLabelPreset: property.booleanLabelPreset ?? "yes-no",
    booleanTrueLabel: property.booleanTrueLabel ?? "",
    booleanFalseLabel: property.booleanFalseLabel ?? "",
    ratingMax: String(property.ratingMax ?? 5),
    ratingAllowZero: property.ratingAllowZero,
    ratingAllowHalf: property.ratingAllowHalf,
    ratingShowLabel: property.ratingShowLabel,
    ratingLabel: property.ratingLabel ?? "",
    ratingAllowRange: property.ratingAllowRange,
    ratingLabels: property.ratingLabels ?? {},
    // Rows for since-deleted categories are kept so the editor can surface them for removal
    // rather than silently dropping the stored override on the next save.
    ratingCategoryLabels: Object.entries(property.ratingCategoryLabels ?? {}).map(
      ([categoryId, labels]) => ({
        categoryId,
        labels: {
          ...labels,
        },
      }),
    ),
    ratingDisplay: property.ratingDisplay ?? "stars",
    ratingRangeIncludeStart: property.ratingRangeIncludeStart,
    choicesItems: property.choicesItems,
    choicesDisplay: property.choicesDisplay ?? "radio",
    choicesMultiple: property.choicesMultiple,
    itemInItemsBeforeText: property.itemInItemsBeforeText ?? "",
    itemInItemsBetweenText: property.itemInItemsBetweenText ?? " of ",
    itemInItemsAfterText: property.itemInItemsAfterText ?? "",
    itemInItemsMediaTypeTexts: Object.entries(property.itemInItemsMediaTypeTexts ?? {}).map(
      ([mediaTypeId, texts]) => ({
        mediaTypeId,
        beforeText: texts.beforeText ?? "",
        betweenText: texts.betweenText ?? "",
        afterText: texts.afterText ?? "",
      }),
    ),
    itemInItemsSourcePropertyId: property.itemInItemsSourcePropertyId ?? "",
    sectionsDefaultType: property.sectionsDefaultType ?? null,
    sectionsAllowedTypes: property.sectionsAllowedTypes ?? [],
    sectionsTiered: property.sectionsTiered ?? false,
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

/**
 * Keep only non-empty label entries for levels the scale can actually reach (drops stale keys left
 * behind when the max was lowered or zero was disallowed), so the stored map has no dead values.
 */
function pruneRatingLabels(
  labels: Record<string, string>,
  max: number,
  allowZero: boolean,
): Record<string, string> | null {
  const min = allowZero ? 0 : 1;
  const entries = Object.entries(labels).filter(([level, label]) => {
    const n = Number(level);
    return label.trim() !== "" && Number.isFinite(n) && n >= min && n <= max;
  });
  if (entries.length === 0) return null;
  return Object.fromEntries(entries.map(([level, label]) => [level, label.trim()]));
}

/**
 * Rows editable as an array in the form become the category-keyed jsonb; a row with no category or
 * with every level blank contributes nothing (blank = inherit the base label).
 */
function pruneRatingCategoryLabels(
  rows: PropertyFormValues["ratingCategoryLabels"],
  max: number,
  allowZero: boolean,
): CreateCustomPropertyInput["ratingCategoryLabels"] {
  const entries = rows
    .filter(row => row.categoryId !== "")
    .map(row => [row.categoryId, pruneRatingLabels(row.labels, max, allowZero)] as const)
    .filter((entry): entry is [string, Record<string, string>] => entry[1] !== null);
  if (entries.length === 0) return null;
  return Object.fromEntries(entries);
}

/** Rating-scale-only fields, nulled out / left `undefined` for every other property type. */
function ratingPayloadFields(values: PropertyFormValues): Pick<
  CreateCustomPropertyInput,
  "ratingMax" | "ratingAllowZero" | "ratingAllowHalf" | "ratingShowLabel" | "ratingLabel"
  | "ratingAllowRange" | "ratingLabels" | "ratingCategoryLabels" | "ratingDisplay"
  | "ratingRangeIncludeStart"
> {
  const isRating = values.type === "ratingScale";
  const max = clampRatingMax(Number(values.ratingMax.trim()));
  return {
    ratingMax: isRating ? max : null,
    ratingAllowZero: isRating ? values.ratingAllowZero : undefined,
    ratingAllowHalf: isRating ? values.ratingAllowHalf : undefined,
    ratingShowLabel: isRating ? values.ratingShowLabel : undefined,
    ratingLabel: isRating ? trimOrNull(values.ratingLabel) : null,
    ratingAllowRange: isRating ? values.ratingAllowRange : undefined,
    ratingLabels: isRating ? pruneRatingLabels(values.ratingLabels, max, values.ratingAllowZero) : null,
    ratingCategoryLabels: isRating
      ? pruneRatingCategoryLabels(values.ratingCategoryLabels, max, values.ratingAllowZero)
      : null,
    ratingDisplay: isRating ? values.ratingDisplay : null,
    ratingRangeIncludeStart: isRating ? values.ratingRangeIncludeStart : undefined,
  };
}

/** Choices-only fields, nulled out / left undefined for every other property type. */
function choicesPayloadFields(values: PropertyFormValues): Pick<
  CreateCustomPropertyInput,
  "choicesItems" | "choicesDisplay" | "choicesMultiple"
> {
  const isChoices = values.type === "choices";
  return {
    choicesItems: isChoices ? values.choicesItems : undefined,
    choicesDisplay: isChoices ? values.choicesDisplay : undefined,
    choicesMultiple: isChoices ? values.choicesMultiple : undefined,
  };
}

/** itemInItems-only text-segment fields, nulled out for every other property type. */
function itemInItemsPayloadFields(values: PropertyFormValues): Pick<
  CreateCustomPropertyInput,
  "itemInItemsBeforeText" | "itemInItemsBetweenText" | "itemInItemsAfterText"
  | "itemInItemsMediaTypeTexts" | "itemInItemsSourcePropertyId"
> {
  const isItemInItems = values.type === "itemInItems";
  // Rows editable as an array in the form become the record-keyed jsonb; a row with no media type
  // or with every segment blank contributes nothing (blank = inherit the base text).
  const overrides = Object.fromEntries(
    values.itemInItemsMediaTypeTexts
      .filter(row => row.mediaTypeId && (row.beforeText || row.betweenText || row.afterText))
      .map(row => [row.mediaTypeId, {
        beforeText: row.beforeText || null,
        betweenText: row.betweenText || null,
        afterText: row.afterText || null,
      }]),
  );
  return {
    itemInItemsBeforeText: isItemInItems ? (values.itemInItemsBeforeText || null) : null,
    itemInItemsBetweenText: isItemInItems ? (values.itemInItemsBetweenText || null) : null,
    itemInItemsAfterText: isItemInItems ? (values.itemInItemsAfterText || null) : null,
    itemInItemsMediaTypeTexts: isItemInItems && Object.keys(overrides).length > 0 ? overrides : null,
    itemInItemsSourcePropertyId: isItemInItems ? (values.itemInItemsSourcePropertyId || null) : null,
  };
}

/** Sections-only config fields, nulled out for every other property type. */
function sectionsPayloadFields(values: PropertyFormValues): Pick<
  CreateCustomPropertyInput,
  "sectionsDefaultType" | "sectionsAllowedTypes" | "sectionsTiered"
> {
  const isSections = values.type === "sections";
  return {
    sectionsDefaultType: isSections ? (values.sectionsDefaultType ?? null) : null,
    sectionsAllowedTypes: isSections && values.sectionsAllowedTypes.length > 0
      ? values.sectionsAllowedTypes
      : null,
    sectionsTiered: isSections ? values.sectionsTiered : null,
  };
}

/** Build the create/update payload from form values (`type` is ignored by the update route). */
export function payloadFromValues(values: PropertyFormValues): CreateCustomPropertyInput {
  return {
    name: values.name.trim(),
    type: values.type,
    dateTimeFormat: values.type === "datetime" ? values.dateTimeFormat : null,
    dateTimeAllowYearMonth: values.type === "datetime" ? values.dateTimeAllowYearMonth : false,
    description: trimOrNull(values.description),
    quickFilterRange: quickFilterRangeFromValues(values),
    operandPropertyIds: values.type === "calculate" ? values.operandIds : undefined,
    categoryIds: values.categoryIds,
    allCategories: values.allCategories,
    mediaTypeIds: values.mediaTypeIds,
    allMediaTypes: values.allMediaTypes,
    // Bookmark form placement is now managed centrally in Settings → Display → Bookmark Add Form,
    // not from this form. New properties land in the Advanced area by default (adjustable there).
    hiddenFromForm: false,
    showInForm: false,
    showInListings: values.showInListings,
    showInGallery: values.showInGallery,
    showInDetails: values.showInDetails,
    // Calculate values are computed server-side, so they can never be edited from the card menu or CMD+K.
    editableOnCard: values.type === "calculate" ? false : values.editableOnCard,
    editableViaCmdk: values.type === "calculate" ? false : values.editableViaCmdk,
    enabledInInbox: values.enabledInInbox,
    enabled: values.enabled,
    allowDefault: values.allowDefault,
    ...numberPayloadFields(values),
    ...booleanPayloadFields(values),
    ...ratingPayloadFields(values),
    ...choicesPayloadFields(values),
    ...itemInItemsPayloadFields(values),
    ...sectionsPayloadFields(values),
  };
}
