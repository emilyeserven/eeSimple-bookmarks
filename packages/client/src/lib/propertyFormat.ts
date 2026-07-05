import type { BookmarkProgressValue, BookmarkSectionsValue, CustomProperty, CustomPropertyType, DateTimeFormat, NumberFormat, SectionEntry } from "@eesimple/types";

import { SECTION_ENTRY_TYPE_LABELS } from "@eesimple/types";

import i18n from "../i18n";

/** Human labels for each custom-property type, shared by the detail view and listing previews. */
export const TYPE_LABELS: Record<CustomPropertyType, string> = {
  number: i18n.t("Number"),
  boolean: i18n.t("Boolean"),
  calculate: i18n.t("Calculate (Sum)"),
  datetime: i18n.t("Date / Time"),
  ratingScale: i18n.t("Rating Scale"),
  image: i18n.t("Image"),
  file: i18n.t("File"),
  choices: i18n.t("Choices"),
  itemInItems: i18n.t("Item in Items"),
  sections: i18n.t("Sections"),
  text: i18n.t("Text"),
};

/** Format an itemInItems value using the property's configured text segments. */
export function formatProgressValue(value: BookmarkProgressValue, property: CustomProperty): string {
  const before = property.itemInItemsBeforeText ?? "";
  const between = property.itemInItemsBetweenText ?? i18n.t(" of ");
  const after = property.itemInItemsAfterText ?? "";
  return `${before}${value.current}${between}${value.total}${after}`;
}

/** Human labels for what a `datetime` property captures. */
export const DATE_TIME_FORMAT_LABELS: Record<DateTimeFormat, string> = {
  date: i18n.t("Date only"),
  time: i18n.t("Time only"),
  datetime: i18n.t("Date & time"),
};

/** Human labels for how a `number` property's value is displayed. */
export const NUMBER_FORMAT_LABELS: Record<NumberFormat, string> = {
  plain: i18n.t("Plain"),
  duration: i18n.t("Duration"),
};

/** Format a single section entry as a one-line summary (e.g. "Chapter 1: pp. 1–10" or "Intro: 0:00–5:30"). */
export function formatSectionEntry(entry: SectionEntry): string {
  const typeSuffix = SECTION_ENTRY_TYPE_LABELS[entry.type];
  const range = entry.endValue ? `${entry.startValue}–${entry.endValue}` : entry.startValue;
  return `${entry.name}: ${range} (${typeSuffix})`;
}

/** Format a sections value as a compact summary (e.g. "3 sections (exhaustive)"). */
export function formatSectionsValue(value: BookmarkSectionsValue): string {
  const count = value.sections.length;
  const label = count === 1 ? "1 section" : `${count} sections`;
  return value.exhaustive ? `${label} (exhaustive)` : label;
}

/** Default Lucide icon name for each custom-property type. */
export const CUSTOM_PROPERTY_TYPE_ICONS: Record<CustomPropertyType, string> = {
  number: "Hash",
  boolean: "ToggleLeft",
  calculate: "Sigma",
  datetime: "Calendar",
  ratingScale: "Star",
  image: "Image",
  file: "Paperclip",
  choices: "ListChecks",
  itemInItems: "Layers",
  sections: "BookOpen",
  text: "ALargeSmall",
};

/**
 * Resolve the effective icon name for a property type.
 * Applies a user override when present, otherwise returns the default.
 */
export function resolvePropertyTypeIcon(
  type: CustomPropertyType,
  overrides: Partial<Record<CustomPropertyType, string>> | null | undefined,
): string {
  return overrides?.[type] ?? CUSTOM_PROPERTY_TYPE_ICONS[type];
}
