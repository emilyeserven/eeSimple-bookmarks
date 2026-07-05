import type { Bookmark, CustomProperty } from "@eesimple/types";

import { formatBoolean, formatDateTime, formatNumber } from "../../lib/bookmarkFormat";

import i18n from "@/i18n";

/**
 * Format a single custom-property value for a bookmark, or `null` when it has no displayable value.
 * `showIfFalse` (for booleans) is resolved from the Default card display rule by the caller.
 */
export function formatPropertyValue(
  bookmark: Bookmark,
  property: CustomProperty,
  showIfFalse: boolean,
): string | null {
  if (property.type === "number" || property.type === "calculate") {
    const entry = bookmark.numberValues.find(value => value.propertyId === property.id);
    return entry ? formatNumber(entry.value, property) : null;
  }
  if (property.type === "boolean") {
    const entry = bookmark.booleanValues.find(value => value.propertyId === property.id);
    if (!entry) return null;
    if (!entry.value && !showIfFalse) return null;
    return formatBoolean(entry.value, property);
  }
  if (property.type === "image" || property.type === "file") {
    const entry = bookmark.fileValues.find(value => value.propertyId === property.id);
    if (!entry) return null;
    return property.type === "image" ? i18n.t("Image") : (entry.originalFilename ?? i18n.t("File"));
  }
  const entry = bookmark.dateTimeValues.find(value => value.propertyId === property.id);
  return entry ? formatDateTime(entry.value, property) : null;
}
