// Shared constants and pure helpers for the custom-property forms — used by the whole `PropertyForm`
// (create page + right panel) and by the per-tab edit forms (`Property*Form`) so the two stay in sync.
import type { CustomProperty } from "@eesimple/types";

/** True when the property has a "Property options" section/tab (number/datetime/boolean — not calculate). */
export function hasPropertyOptions(property: CustomProperty): boolean {
  return property.type !== "calculate";
}

/** Type options for the property Type select. */
export const TYPE_OPTIONS = [
  {
    value: "number",
    label: "Number",
  },
  {
    value: "boolean",
    label: "Boolean",
  },
  {
    value: "calculate",
    label: "Calculate (Sum)",
  },
  {
    value: "datetime",
    label: "Date / Time",
  },
];

/** How `true`/`false` values of a `boolean` property are rendered. */
export const BOOLEAN_LABEL_PRESET_OPTIONS = [
  { value: "yes-no", label: "Yes / No" },
  { value: "true-false", label: "True / False" },
  { value: "enabled-disabled", label: "Enabled / Disabled" },
  { value: "icons", label: "✓ / ✗" },
  { value: "custom", label: "Custom" },
];

/** What a `datetime` property captures. */
export const DATE_TIME_FORMAT_OPTIONS = [
  {
    value: "date",
    label: "Date only",
  },
  {
    value: "time",
    label: "Time only",
  },
  {
    value: "datetime",
    label: "Date & time",
  },
];

/** Add or remove `id` from `ids`, returning a new array. */
export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

/** One-line summary of the number options for a collapsed "Property options" preview. */
export function summarizeNumberOptions(values: {
  disableMin: boolean;
  disableMax: boolean;
  numberMin: string;
  numberMax: string;
  unitPlural: string;
  valuePrefix: string;
}): string {
  const parts: string[] = [];
  const min = values.disableMin ? "auto" : (values.numberMin.trim() || "auto");
  const max = values.disableMax ? "auto" : (values.numberMax.trim() || "auto");
  if (min !== "auto" || max !== "auto") {
    parts.push(`${min}–${max}${values.unitPlural.trim() ? ` ${values.unitPlural.trim()}` : ""}`);
  }
  else if (values.unitPlural.trim()) {
    parts.push(values.unitPlural.trim());
  }
  if (values.valuePrefix.trim()) parts.push(`prefix ${values.valuePrefix.trim()}`);
  return parts.length > 0 ? parts.join(" · ") : "No options set";
}

/** One-line summary of the boolean options for a collapsed "Property options" preview. */
export function summarizeBooleanOptions(values: {
  showIfFalse: boolean;
  booleanLabelPreset: string;
  booleanTrueLabel: string;
  booleanFalseLabel: string;
}): string {
  const preset = BOOLEAN_LABEL_PRESET_OPTIONS.find(o => o.value === values.booleanLabelPreset);
  const parts: string[] = [preset?.label ?? "Yes / No"];
  if (values.booleanLabelPreset === "custom") {
    const trueText = values.booleanTrueLabel.trim() || "Yes";
    const falseText = values.booleanFalseLabel.trim() || "No";
    parts[0] = `${trueText} / ${falseText}`;
  }
  if (values.showIfFalse) parts.push("show if false");
  return parts.join(" · ");
}

/** One-line summary of the category selection for a collapsed "Categories" preview. */
export function summarizeCategories(allCategories: boolean, selectedIds: string[]): string {
  if (allCategories) return "All categories";
  const count = selectedIds.length;
  if (count === 0) return "No categories";
  return `${count} ${count === 1 ? "category" : "categories"}`;
}
