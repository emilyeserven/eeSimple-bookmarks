import type { CustomProperty } from "@eesimple/types";

/** Format a numeric value with its property's unit, pluralizing on a value of 1. */
export function formatNumber(value: number, property: CustomProperty): string {
  if (!property.unitSingular && !property.unitPlural) return String(value);
  const unit = value === 1
    ? (property.unitSingular ?? property.unitPlural)
    : (property.unitPlural ?? property.unitSingular);
  return unit ? `${value} ${unit}` : String(value);
}
