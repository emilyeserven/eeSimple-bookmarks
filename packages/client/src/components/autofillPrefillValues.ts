import type {
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CustomProperty,
} from "@eesimple/types";

import { propertyAppliesToCategory } from "@eesimple/types";

/** The custom properties that apply to the chosen category (excluding computed `calculate` props). */
export function categoryProperties(properties: CustomProperty[], categoryId: string | null): CustomProperty[] {
  if (!categoryId) return [];
  return properties.filter(p => propertyAppliesToCategory(p, categoryId));
}

export function buildNumberValues(
  props: CustomProperty[],
  numberInputs: Record<string, string>,
): BookmarkNumberValue[] {
  return props
    .filter(p => p.type === "number")
    .map(p => ({
      propertyId: p.id,
      raw: numberInputs[p.id] ?? "",
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

export function buildBooleanValues(
  props: CustomProperty[],
  booleanInputs: Record<string, boolean>,
): BookmarkBooleanValue[] {
  return props
    .filter(p => p.type === "boolean")
    .map(p => ({
      propertyId: p.id,
      value: booleanInputs[p.id] ?? false,
    }));
}

export function buildDateTimeValues(
  props: CustomProperty[],
  dateTimeInputs: Record<string, string>,
): BookmarkDateTimeValue[] {
  return props
    .filter(p => p.type === "datetime")
    .map(p => ({
      propertyId: p.id,
      value: (dateTimeInputs[p.id] ?? "").trim(),
    }))
    .filter(e => e.value !== "");
}
