import type { CustomProperty } from "@eesimple/types";

/**
 * Format a numeric value for display: a custom zero label, then a max/"no limit" label, otherwise the
 * value with an optional prefix (e.g. `"$"`) and its unit, pluralizing on a value of 1.
 */
export function formatNumber(value: number, property: CustomProperty): string {
  if (value === 0 && property.zeroLabel) return property.zeroLabel;
  if (property.numberMax !== null && value >= property.numberMax && property.maxLabel) {
    return property.maxLabel;
  }
  const prefix = property.valuePrefix ?? "";
  if (!property.unitSingular && !property.unitPlural) return `${prefix}${value}`;
  const unit = value === 1
    ? (property.unitSingular ?? property.unitPlural)
    : (property.unitPlural ?? property.unitSingular);
  return unit ? `${prefix}${value} ${unit}` : `${prefix}${value}`;
}
