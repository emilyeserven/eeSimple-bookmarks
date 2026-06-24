import type { CustomProperty, CustomPropertyType, DateTimeFormat, NumberFormat, BookmarkProgressValue } from "@eesimple/types";

/** Human labels for each custom-property type, shared by the detail view and listing previews. */
export const TYPE_LABELS: Record<CustomPropertyType, string> = {
  number: "Number",
  boolean: "Boolean",
  calculate: "Calculate (Sum)",
  datetime: "Date / Time",
  ratingScale: "Rating Scale",
  image: "Image",
  file: "File",
  choices: "Choices",
  itemInItems: "Item in Items",
};

/** Format an itemInItems value using the property's configured text segments. */
export function formatProgressValue(value: BookmarkProgressValue, property: CustomProperty): string {
  const before = property.itemInItemsBeforeText ?? "";
  const between = property.itemInItemsBetweenText ?? " of ";
  const after = property.itemInItemsAfterText ?? "";
  return `${before}${value.current}${between}${value.total}${after}`;
}

/** Human labels for what a `datetime` property captures. */
export const DATE_TIME_FORMAT_LABELS: Record<DateTimeFormat, string> = {
  date: "Date only",
  time: "Time only",
  datetime: "Date & time",
};

/** Human labels for how a `number` property's value is displayed. */
export const NUMBER_FORMAT_LABELS: Record<NumberFormat, string> = {
  plain: "Plain",
  duration: "Duration",
};
