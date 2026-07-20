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
  RATING_DISPLAY_LABELS,
  RATING_DISPLAYS,
} from "@eesimple/types";

import i18n from "../i18n";
import { joinProgressDisplay } from "./propertyFormat";

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
    label: i18n.t("1 – 3"),
  },
  {
    value: "5",
    label: i18n.t("1 – 5"),
  },
];

/** `ratingScale` display styles for the Display select. Derived from {@link RATING_DISPLAYS}. */
export const RATING_DISPLAY_OPTIONS = RATING_DISPLAYS.map(value => ({
  value,
  label: i18n.t(RATING_DISPLAY_LABELS[value]),
}));

/** How `true`/`false` values of a `boolean` property are rendered. */
export const BOOLEAN_LABEL_PRESET_OPTIONS = [
  {
    value: "yes-no",
    label: i18n.t("Yes / No"),
  },
  {
    value: "true-false",
    label: i18n.t("True / False"),
  },
  {
    value: "enabled-disabled",
    label: i18n.t("Enabled / Disabled"),
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
    label: i18n.t("Custom"),
  },
];

/** Client-facing labels for the `datetime` capture modes (presentation differs from the type docs). */
const DATE_TIME_FORMAT_LABELS: Record<DateTimeFormat, string> = {
  date: i18n.t("Date only"),
  time: i18n.t("Time only"),
  datetime: i18n.t("Date & time"),
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
  const isMinAuto = values.disableMin || !values.numberMin.trim();
  const isMaxAuto = values.disableMax || !values.numberMax.trim();
  const min = isMinAuto ? i18n.t("auto") : values.numberMin.trim();
  const max = isMaxAuto ? i18n.t("auto") : values.numberMax.trim();
  if (!isMinAuto || !isMaxAuto) {
    parts.push(`${min}–${max}${values.unitPlural.trim() ? ` ${values.unitPlural.trim()}` : ""}`);
  }
  else if (values.unitPlural.trim()) {
    parts.push(values.unitPlural.trim());
  }
  if (values.valuePrefix.trim()) parts.push(i18n.t("prefix {{prefix}}", {
    prefix: values.valuePrefix.trim(),
  }));
  return parts.length > 0 ? parts.join(" · ") : i18n.t("No options set");
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
    const trueText = values.booleanTrueLabel.trim() || i18n.t("Yes");
    const falseText = values.booleanFalseLabel.trim() || i18n.t("No");
    return `${trueText} / ${falseText}`;
  }
  return preset?.label ?? i18n.t("Yes / No");
}

/** One-line summary of the rating options for a collapsed "Property options" preview. */
export function summarizeRatingOptions(values: {
  ratingMax: string;
  ratingAllowZero: boolean;
  ratingAllowHalf: boolean;
  ratingShowLabel: boolean;
  ratingLabel: string;
  ratingAllowRange?: boolean;
  ratingLabelCount?: number;
  ratingDisplay?: string;
  ratingRangeIncludeStart?: boolean;
}): string {
  const min = values.ratingAllowZero ? 0 : 1;
  const unit = values.ratingDisplay === "ticks"
    ? i18n.t("{{min}}–{{max}} ticks", {
      min,
      max: values.ratingMax.trim() || "5",
    })
    : i18n.t("{{min}}–{{max}} stars", {
      min,
      max: values.ratingMax.trim() || "5",
    });
  const parts: string[] = [unit];
  if (values.ratingAllowHalf) parts.push(i18n.t("half steps"));
  if (values.ratingAllowRange) parts.push(i18n.t("range"));
  if (values.ratingRangeIncludeStart) parts.push(i18n.t("incl. start"));
  if (values.ratingShowLabel && values.ratingLabel.trim()) parts.push(i18n.t("label \"{{label}}\"", {
    label: values.ratingLabel.trim(),
  }));
  if (values.ratingLabelCount && values.ratingLabelCount > 0) {
    parts.push(i18n.t("{{count}} level labels", {
      count: values.ratingLabelCount,
    }));
  }
  return parts.join(" · ");
}

/** One-line summary of the itemInItems text-segment options for a collapsed "Property options" preview. */
export function summarizeItemInItemsOptions(values: {
  itemInItemsBeforeText: string;
  itemInItemsBetweenText: string;
  itemInItemsAfterText: string;
  /** Number of per-media-type text overrides, appended to the preview when > 0. */
  overrideCount?: number;
}): string {
  const before = values.itemInItemsBeforeText || "";
  const between = values.itemInItemsBetweenText || ` ${i18n.t("of")} `;
  const after = values.itemInItemsAfterText || "";
  const sample = joinProgressDisplay(before, 10, between, 100, after);
  return values.overrideCount
    ? `${sample} · ${i18n.t("{{count}} media type override", {
      count: values.overrideCount,
    })}`
    : sample;
}

/**
 * One-line summary of the category selection for a collapsed "Categories" preview. An empty selection
 * means "all categories" (see `propertyAppliesToCategory` in `@eesimple/types`), so it reads the same
 * as the explicit `allCategories` flag rather than "No categories".
 */
export function summarizeCategories(allCategories: boolean, selectedIds: string[]): string {
  if (allCategories || selectedIds.length === 0) return i18n.t("All categories");
  const count = selectedIds.length;
  return count === 1
    ? i18n.t("{{count}} category", {
      count,
    })
    : i18n.t("{{count}} categories", {
      count,
    });
}

/** One-line summary of the media-type selection for a collapsed "Media Types" preview. */
export function summarizeMediaTypes(allMediaTypes: boolean, selectedIds: string[]): string {
  if (allMediaTypes) return i18n.t("All media types");
  const count = selectedIds.length;
  if (count === 0) return i18n.t("No media types");
  return count === 1
    ? i18n.t("{{count}} media type", {
      count,
    })
    : i18n.t("{{count}} media types", {
      count,
    });
}
