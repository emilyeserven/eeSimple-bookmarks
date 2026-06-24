// Shared constants and pure helpers for the custom-property forms — used by the whole `PropertyForm`
// (create page + right panel) and by the per-tab edit forms (`Property*Form`) so the two stay in sync.
import type { CustomProperty, DateTimeFormat } from "@eesimple/types";

import {
  CHOICES_DISPLAY_LABELS,
  CHOICES_DISPLAY_TYPES,
  CUSTOM_PROPERTY_TYPE_LABELS,
  CUSTOM_PROPERTY_TYPES,
  DATE_TIME_FORMATS,
  NUMBER_FORMAT_LABELS,
  NUMBER_FORMATS,
} from "@eesimple/types";

/** True when the property has a "Property options" section/tab (everything but `calculate`). */
export function hasPropertyOptions(property: CustomProperty): boolean {
  return property.type !== "calculate";
}

/** Type options for the property Type select. Derived from the shared `@eesimple/types` dictionary. */
export const TYPE_OPTIONS = CUSTOM_PROPERTY_TYPES.map(value => ({
  value,
  label: CUSTOM_PROPERTY_TYPE_LABELS[value],
}));

/** Supported `ratingScale` maxima (1–3 or 1–5 stars). */
export const RATING_MAX_OPTIONS = [
  {
    value: "3",
    label: "1 – 3",
  },
  {
    value: "5",
    label: "1 – 5",
  },
];

/** How `true`/`false` values of a `boolean` property are rendered. */
export const BOOLEAN_LABEL_PRESET_OPTIONS = [
  {
    value: "yes-no",
    label: "Yes / No",
  },
  {
    value: "true-false",
    label: "True / False",
  },
  {
    value: "enabled-disabled",
    label: "Enabled / Disabled",
  },
  {
    value: "icons",
    label: "✓ / ✗",
  },
  {
    value: "stars",
    label: "★ / ☆",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

/** Client-facing labels for the `datetime` capture modes (presentation differs from the type docs). */
const DATE_TIME_FORMAT_LABELS: Record<DateTimeFormat, string> = {
  date: "Date only",
  time: "Time only",
  datetime: "Date & time",
};

/** What a `datetime` property captures. Derived from the shared `@eesimple/types` variant list. */
export const DATE_TIME_FORMAT_OPTIONS = DATE_TIME_FORMATS.map(value => ({
  value,
  label: DATE_TIME_FORMAT_LABELS[value],
}));

/** How a `number` property's value is displayed. Derived from the shared `@eesimple/types` dictionary. */
export const NUMBER_FORMAT_OPTIONS = NUMBER_FORMATS.map(value => ({
  value,
  label: NUMBER_FORMAT_LABELS[value],
}));

/** Display mode options for a `choices` property. Derived from the shared `@eesimple/types` dictionary. */
export const CHOICES_DISPLAY_OPTIONS = CHOICES_DISPLAY_TYPES.map(value => ({
  value,
  label: CHOICES_DISPLAY_LABELS[value],
}));

/** Add or remove `id` from `ids`, returning a new array. */
export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

/** One-line summary of the number options for a collapsed "Property options" preview. */
export function summarizeNumberOptions(values: {
  disableMin: boolean;
  disableMax: boolean;
  numberMin: string;
  numberMax: string;
  unitPlural: string;
  valuePrefix: string;
}): string {
  const parts: string[] = [];
  const min = values.disableMin ? "auto" : (values.numberMin.trim() || "auto");
  const max = values.disableMax ? "auto" : (values.numberMax.trim() || "auto");
  if (min !== "auto" || max !== "auto") {
    parts.push(`${min}–${max}${values.unitPlural.trim() ? ` ${values.unitPlural.trim()}` : ""}`);
  }
  else if (values.unitPlural.trim()) {
    parts.push(values.unitPlural.trim());
  }
  if (values.valuePrefix.trim()) parts.push(`prefix ${values.valuePrefix.trim()}`);
  return parts.length > 0 ? parts.join(" · ") : "No options set";
}

/**
 * One-line summary of the boolean value-formatting options for a collapsed "Property options"
 * preview. The per-card display knobs (hide label / clickable / show-if-false / colon / value-first)
 * now live on the Card Display Rule field placements, not here.
 */
export function summarizeBooleanOptions(values: {
  booleanLabelPreset: string;
  booleanTrueLabel: string;
  booleanFalseLabel: string;
}): string {
  const preset = BOOLEAN_LABEL_PRESET_OPTIONS.find(o => o.value === values.booleanLabelPreset);
  if (values.booleanLabelPreset === "custom") {
    const trueText = values.booleanTrueLabel.trim() || "Yes";
    const falseText = values.booleanFalseLabel.trim() || "No";
    return `${trueText} / ${falseText}`;
  }
  return preset?.label ?? "Yes / No";
}

/** One-line summary of the rating options for a collapsed "Property options" preview. */
export function summarizeRatingOptions(values: {
  ratingMax: string;
  ratingAllowZero: boolean;
  ratingAllowHalf: boolean;
  ratingShowLabel: boolean;
  ratingLabel: string;
}): string {
  const min = values.ratingAllowZero ? 0 : 1;
  const parts: string[] = [`${min}–${values.ratingMax.trim() || "5"} stars`];
  if (values.ratingAllowHalf) parts.push("half steps");
  if (values.ratingShowLabel && values.ratingLabel.trim()) parts.push(`label "${values.ratingLabel.trim()}"`);
  return parts.join(" · ");
}

/** One-line summary of the itemInItems text-segment options for a collapsed "Property options" preview. */
export function summarizeItemInItemsOptions(values: {
  itemInItemsBeforeText: string;
  itemInItemsBetweenText: string;
  itemInItemsAfterText: string;
}): string {
  const before = values.itemInItemsBeforeText || "";
  const between = values.itemInItemsBetweenText || " of ";
  const after = values.itemInItemsAfterText || "";
  return `${before}10${between}100${after}`;
}

/** One-line summary of the category selection for a collapsed "Categories" preview. */
export function summarizeCategories(allCategories: boolean, selectedIds: string[]): string {
  if (allCategories) return "All categories";
  const count = selectedIds.length;
  if (count === 0) return "No categories";
  return `${count} ${count === 1 ? "category" : "categories"}`;
}

/** One-line summary of the media-type selection for a collapsed "Media Types" preview. */
export function summarizeMediaTypes(allMediaTypes: boolean, selectedIds: string[]): string {
  if (allMediaTypes) return "All media types";
  const count = selectedIds.length;
  if (count === 0) return "No media types";
  return `${count} media ${count === 1 ? "type" : "types"}`;
}
