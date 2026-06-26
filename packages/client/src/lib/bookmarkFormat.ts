import type { BookmarkBooleanValue, CustomProperty } from "@eesimple/types";

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

/**
 * Format a boolean value for display, honoring the property's `booleanLabelPreset` and custom labels.
 * When `opts.hideIcon` is set for an icon-like preset (`icons`/`stars`), the glyph IS the value, so it
 * falls back to the property's custom labels or "Yes"/"No" text instead of showing nothing.
 */
export function formatBoolean(
  value: boolean,
  property: CustomProperty,
  opts: { hideIcon?: boolean } = {},
): string {
  const preset = property.booleanLabelPreset ?? "yes-no";
  if (opts.hideIcon && (preset === "icons" || preset === "stars")) {
    return value
      ? (property.booleanTrueLabel || "Yes")
      : (property.booleanFalseLabel || "No");
  }
  switch (preset) {
    case "yes-no": return value ? "Yes" : "No";
    case "true-false": return value ? "True" : "False";
    case "enabled-disabled": return value ? "Enabled" : "Disabled";
    case "icons": return value ? "✓" : "✗";
    case "stars": return value ? "★" : "☆";
    case "custom":
      return value
        ? (property.booleanTrueLabel || "Yes")
        : (property.booleanFalseLabel || "No");
    default: return value ? "Yes" : "No";
  }
}

/**
 * Per-card display knobs for a boolean badge. These used to live on the property; they now come from
 * the Card Display Rule field placement (or the Default rule for non-listing surfaces).
 */
export interface BooleanBadgeDisplay {
  /** Omit the property name, showing only the value. */
  hideLabel?: boolean;
  /** Icon presets only: drop the ✓/✗/★/☆ glyph, falling back to the custom/Yes-No text value. */
  hideIcon?: boolean;
  /** Icon presets only: show the colon after the label. Defaults to true. */
  showLabelColon?: boolean;
  /** Icon presets only: render the value before the label. Defaults to false. */
  showValueBeforeLabel?: boolean;
}

/**
 * Build the full badge/label string for a boolean property value, applying `showLabelColon` and
 * `showValueBeforeLabel` when the preset is icon-like ("icons" or "stars"). The layout knobs come from
 * the field placement (`display`), not the property.
 */
export function formatBooleanBadge(
  value: boolean,
  property: CustomProperty,
  display: BooleanBadgeDisplay = {},
): string {
  const formatted = formatBoolean(value, property, {
    hideIcon: display.hideIcon,
  });
  if (display.hideLabel) return formatted;
  // Once the icon glyph is hidden the value is plain text, so it uses the ordinary `Name: value` form.
  const isIconPreset = !display.hideIcon
    && (property.booleanLabelPreset === "icons" || property.booleanLabelPreset === "stars");
  if (!isIconPreset) return `${property.name}: ${formatted}`;
  const colon = display.showLabelColon !== false;
  const sep = colon ? ": " : " ";
  return display.showValueBeforeLabel
    ? `${formatted}${sep}${property.name}`
    : `${property.name}${sep}${formatted}`;
}

/**
 * Format selected choices values for display: looks up each selected slug's label from the
 * property's items and joins them with ", ". Returns an empty string when nothing is selected.
 */
export function formatChoices(values: string[], property: CustomProperty): string {
  if (values.length === 0) return "";
  const labelMap = new Map(property.choicesItems.map(item => [item.value, item.label]));
  return values.map(v => labelMap.get(v) ?? v).join(", ");
}

/** Replace the entry for `propertyId` with `value`, or append it when the property has no value yet. */
export function mergeBooleanValue(
  values: BookmarkBooleanValue[],
  propertyId: string,
  value: boolean,
): BookmarkBooleanValue[] {
  return values.some(entry => entry.propertyId === propertyId)
    ? values.map(entry => (entry.propertyId === propertyId
      ? {
        propertyId,
        value,
      }
      : entry))
    : [...values, {
      propertyId,
      value,
    }];
}
