import type { Bookmark, CustomProperty } from "@eesimple/types";

/**
 * Whether the bookmark has at least one custom-property value that the detail view would render.
 * Mirrors the row filters in `BookmarkPropertySections` so callers (e.g. the tabbed detail layout)
 * can omit an empty "Properties" tab without rendering the component first.
 */
export function hasBookmarkPropertyRows(
  bookmark: Bookmark,
  properties: CustomProperty[],
): boolean {
  const byId = new Map(properties.map(property => [property.id, property]));
  // numberValues holds both formatted numbers and rating scales; either produces a visible row.
  const hasNumberOrRating = bookmark.numberValues.some(entry => byId.has(entry.propertyId));
  const hasBoolean = bookmark.booleanValues.some((entry) => {
    const property = byId.get(entry.propertyId);
    return property ? entry.value || property.showIfFalse : false;
  });
  const hasDateTime = bookmark.dateTimeValues.some(entry => byId.has(entry.propertyId));
  const hasFile = bookmark.fileValues.some((entry) => {
    const property = byId.get(entry.propertyId);
    return property ? property.showInDetails : false;
  });
  return hasNumberOrRating || hasBoolean || hasDateTime || hasFile;
}
