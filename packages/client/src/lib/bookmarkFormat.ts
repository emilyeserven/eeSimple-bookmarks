import type { CustomProperty } from "@eesimple/types";

import { formatDateTimeValue } from "./datetime";

/**
 * Format a count of seconds as a clock duration: `H:MM:SS` when an hour or more, otherwise `M:SS`
 * (e.g. `260` → `"4:20"`, `3723` → `"1:02:03"`). Negative/NaN values fall back to `"0:00"`.
 */
export function formatDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number): string => String(n).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

/**
 * Format a numeric value for display: durations as a clock (`H:MM:SS`), otherwise a custom zero
 * label, then a max/"no limit" label, otherwise the value with an optional prefix (e.g. `"$"`) and
 * its unit, pluralizing on a value of 1.
 */
export function formatNumber(value: number, property: CustomProperty): string {
  if (property.numberFormat === "duration") return formatDuration(value);
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

/** Format a `datetime` property's stored value for display, honoring its `dateTimeFormat`. */
export function formatDateTime(value: string, property: CustomProperty): string {
  return formatDateTimeValue(value, property.dateTimeFormat);
}
