import type { Bookmark, CardFieldZones, CustomProperty } from "@eesimple/types";

import { resolveBooleanDisplay } from "./bookmarkCardValues";

/**
 * Whether the bookmark has at least one custom-property value that the detail view would render.
 * Mirrors the row filters in `BookmarkPropertySections` so callers (e.g. the tabbed detail layout)
 * can omit an empty "Properties" tab without rendering the component first. The boolean show-if-false
 * gate is resolved from the **Default** card display rule's field placement (`defaultZones`).
 */
export function hasBookmarkPropertyRows(
  bookmark: Bookmark,
  properties: CustomProperty[],
  defaultZones?: CardFieldZones,
): boolean {
  const byId = new Map(properties.map(property => [property.id, property]));
  // numberValues holds both formatted numbers and rating scales; either produces a visible row.
  const hasNumberOrRating = bookmark.numberValues.some(entry => byId.has(entry.propertyId));
  const hasBoolean = bookmark.booleanValues.some((entry) => {
    const property = byId.get(entry.propertyId);
    if (!property) return false;
    return entry.value || resolveBooleanDisplay(defaultZones, property.id).showIfFalse;
  });
  const hasDateTime = bookmark.dateTimeValues.some(entry => byId.has(entry.propertyId));
  const hasFile = bookmark.fileValues.some((entry) => {
    const property = byId.get(entry.propertyId);
    return property ? property.showInDetails : false;
  });
  return hasNumberOrRating || hasBoolean || hasDateTime || hasFile;
}
