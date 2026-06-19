import type { BookmarkNumberValue, CustomProperty } from "@eesimple/types";

/**
 * Build the typed `number` property values from a record of raw string inputs, keeping only the
 * `number`-typed properties whose input parses to a finite number. Shared by the bookmark form,
 * autofill-rule form, and category-defaults section, which each pass their own pre-filtered
 * property list (so their differing category/enabled/calculate filtering is preserved).
 */
export function buildNumberValuesFromInputs(
  properties: CustomProperty[],
  numberInputs: Record<string, string>,
): BookmarkNumberValue[] {
  return properties
    .filter(property => property.type === "number")
    .map(property => ({
      propertyId: property.id,
      raw: numberInputs[property.id] ?? "",
    }))
    .filter(({
      raw,
    }) => raw.trim() !== "" && !Number.isNaN(Number(raw)))
    .map(({
      propertyId, raw,
    }) => ({
      propertyId,
      value: Number(raw),
    }));
}
