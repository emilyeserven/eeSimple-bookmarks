import type { FillRow, ValuePatchKey } from "./rowTypes";
import type {
  Bookmark,
  CustomProperty,
  CustomPropertyType,
  FillTarget,
  WebsiteExtensionFillRule,
} from "@eesimple/types";

import { coerceBoolean, formatBoolean, formatScalar, toFiniteNumber } from "./format";
import { baseRow, diffRow } from "./rowTypes";
import { seedValueMap, storedValue } from "./valueMaps";

type PropertyTarget = Extract<FillTarget, { kind: "customProperty" }>;

/** Which bookmark value array a fill writes for each fillable property type. */
const VALUE_PATCH_KEY: Partial<Record<CustomPropertyType, ValuePatchKey>> = {
  number: "numberValues",
  boolean: "booleanValues",
  text: "textValues",
  datetime: "dateTimeValues",
  itemInItems: "progressValues",
  ratingScale: "numberValues",
  choices: "choicesValues",
};

/** A `customProperty` row: dispatches on the property's type. */
export function buildPropertyRow(
  rule: WebsiteExtensionFillRule,
  target: PropertyTarget,
  values: string[],
  bookmark: Bookmark,
  properties: readonly CustomProperty[],
): FillRow {
  const property = properties.find(p => p.id === target.propertyId);
  const patchKey = property ? VALUE_PATCH_KEY[property.type] : undefined;
  if (!property || !patchKey) {
    return baseRow(rule, "", values[0] ?? "", false, "unsupported");
  }
  // "Detect range" consumes the full values list (the present levels) — handled before the
  // single-value collapse so an empty result is a clean "not found".
  if (property.type === "ratingScale" && target.ratingBound === "range") {
    return buildRatingRangeRow(rule, property, values, bookmark);
  }
  const extracted = values[0] ?? "";
  if (!extracted) return baseRow(rule, "", "", false, "not found");
  switch (property.type) {
    case "itemInItems":
      return buildProgressRow(rule, target, property, extracted, bookmark);
    case "ratingScale":
      return buildRatingRow(rule, target, property, extracted, bookmark);
    case "choices":
      return buildChoicesRow(rule, target, property, extracted, bookmark);
    case "number":
      return buildNumberRow(rule, property, extracted, bookmark);
    case "boolean":
      return buildBooleanRow(rule, property, extracted, bookmark);
    default:
      return buildStringRow(rule, property, extracted, bookmark, patchKey === "dateTimeValues" ? "dateTimeValues" : "textValues");
  }
}

function buildNumberRow(rule: WebsiteExtensionFillRule, property: CustomProperty, extracted: string, bookmark: Bookmark): FillRow {
  const current = storedValue(bookmark, "numberValues", property.id)?.value;
  const num = toFiniteNumber(extracted);
  if (num === null) return baseRow(rule, formatScalar(current), extracted, false, "not found");
  const row = diffRow(rule, formatScalar(current), String(num), current !== num);
  row.apply = (_patch, state) => {
    seedValueMap(state, "numberValues", bookmark).set(property.id, {
      propertyId: property.id,
      value: num,
    });
  };
  return row;
}

function buildBooleanRow(rule: WebsiteExtensionFillRule, property: CustomProperty, extracted: string, bookmark: Bookmark): FillRow {
  const current = storedValue(bookmark, "booleanValues", property.id)?.value;
  const bool = coerceBoolean(extracted);
  if (bool === null) return baseRow(rule, formatBoolean(current), extracted, false, "not found");
  const row = diffRow(rule, formatBoolean(current), formatBoolean(bool), current !== bool);
  row.apply = (_patch, state) => {
    seedValueMap(state, "booleanValues", bookmark).set(property.id, {
      propertyId: property.id,
      value: bool,
    });
  };
  return row;
}

/** text | datetime — stored as a plain string value. */
function buildStringRow(
  rule: WebsiteExtensionFillRule,
  property: CustomProperty,
  extracted: string,
  bookmark: Bookmark,
  key: "textValues" | "dateTimeValues",
): FillRow {
  const current = storedValue(bookmark, key, property.id)?.value;
  const row = diffRow(rule, formatScalar(current), extracted, (current ?? "") !== extracted);
  row.apply = (_patch, state) => {
    seedValueMap(state, key, bookmark).set(property.id, {
      propertyId: property.id,
      value: extracted,
    });
  };
  return row;
}

/** itemInItems (Two Numbers): fill only the rule-selected sub-number, preserving the sibling. */
function buildProgressRow(
  rule: WebsiteExtensionFillRule,
  target: PropertyTarget,
  property: CustomProperty,
  extracted: string,
  bookmark: Bookmark,
): FillRow {
  const subField = target.subField === "total" ? "total" : "current";
  const existing = storedValue(bookmark, "progressValues", property.id);
  const current = existing?.[subField];
  const num = toFiniteNumber(extracted);
  if (num === null) return baseRow(rule, formatScalar(current), extracted, false, "not found");
  const row = diffRow(rule, `${subField}: ${formatScalar(current)}`, `${subField}: ${num}`, current !== num);
  row.apply = (_patch, state) => {
    const map = seedValueMap(state, "progressValues", bookmark);
    const entry = map.get(property.id) ?? {
      propertyId: property.id,
      current: 0,
      total: 0,
    };
    map.set(property.id, {
      ...entry,
      [subField]: num,
    });
  };
  return row;
}

/** The per-number label for a rating level, or the number itself when unlabeled. */
function ratingLabelFor(property: CustomProperty, level: number): string {
  const label = property.ratingLabels?.[String(level)];
  return label && label.trim() !== "" ? label : String(level);
}

/**
 * ratingScale: a range-enabled rating fills only the rule-selected end (keeping value <= valueEnd);
 * a single-value rating replaces the whole value.
 */
function buildRatingRow(
  rule: WebsiteExtensionFillRule,
  target: PropertyTarget,
  property: CustomProperty,
  extracted: string,
  bookmark: Bookmark,
): FillRow {
  const existing = storedValue(bookmark, "numberValues", property.id);
  const num = toFiniteNumber(extracted);
  if (num === null) {
    return baseRow(rule, existing ? formatScalar(existing.value) : "", extracted, false, "not found");
  }
  if (!property.ratingAllowRange) {
    const current = existing?.value;
    const row = diffRow(
      rule,
      current === undefined ? "" : ratingLabelFor(property, current),
      ratingLabelFor(property, num),
      current !== num,
    );
    row.apply = (_patch, state) => {
      seedValueMap(state, "numberValues", bookmark).set(property.id, {
        propertyId: property.id,
        value: num,
        valueEnd: null,
      });
    };
    return row;
  }
  const bound = target.ratingBound === "to" ? "to" : "from";
  let current: number | undefined;
  if (existing) current = bound === "to" ? (existing.valueEnd ?? existing.value) : existing.value;
  const row = diffRow(
    rule,
    `${bound}: ${current === undefined ? "" : ratingLabelFor(property, current)}`,
    `${bound}: ${ratingLabelFor(property, num)}`,
    current !== num,
  );
  row.apply = (_patch, state) => {
    const map = seedValueMap(state, "numberValues", bookmark);
    const entry = {
      ...(map.get(property.id) ?? {
        propertyId: property.id,
        value: num,
        valueEnd: null,
      }),
    };
    if (bound === "from") {
      entry.value = num;
      if (entry.valueEnd != null && entry.valueEnd < num) entry.valueEnd = num;
    }
    else {
      entry.valueEnd = num;
      if (entry.value > num) entry.value = num;
    }
    map.set(property.id, entry);
  };
  return row;
}

function ratingRangeText(property: CustomProperty, from: number, to: number | null | undefined): string {
  return to != null && to !== from
    ? `${ratingLabelFor(property, from)} → ${ratingLabelFor(property, to)}`
    : ratingLabelFor(property, from);
}

/**
 * ratingScale "detect range": `values` are the present level numbers. From = min, To = max (a single
 * value when only one level is present). Replaces both ends.
 */
function buildRatingRangeRow(rule: WebsiteExtensionFillRule, property: CustomProperty, values: string[], bookmark: Bookmark): FillRow {
  const levels = values.map(Number).filter(Number.isFinite);
  const existing = storedValue(bookmark, "numberValues", property.id);
  const currentText = existing ? ratingRangeText(property, existing.value, existing.valueEnd) : "";
  if (levels.length === 0) return baseRow(rule, currentText, "", false, "not found");
  const from = Math.min(...levels);
  const to = Math.max(...levels);
  const valueEnd = from === to ? null : to;
  const changed = !existing || existing.value !== from || (existing.valueEnd ?? null) !== valueEnd;
  const row = diffRow(rule, currentText, ratingRangeText(property, from, valueEnd), changed);
  row.apply = (_patch, state) => {
    seedValueMap(state, "numberValues", bookmark).set(property.id, {
      propertyId: property.id,
      value: from,
      valueEnd,
    });
  };
  return row;
}

/** choices: add the rule-selected option; a single-select property is replaced, a multi-select unions. */
function buildChoicesRow(
  rule: WebsiteExtensionFillRule,
  target: PropertyTarget,
  property: CustomProperty,
  extracted: string,
  bookmark: Bookmark,
): FillRow {
  const choiceValue = target.choiceValue;
  if (!choiceValue) return baseRow(rule, "", extracted, false, "unsupported");
  const items = property.choicesItems ?? [];
  const labelOf = (value: string): string => items.find(item => item.value === value)?.label ?? value;
  const currentValues = storedValue(bookmark, "choicesValues", property.id)?.values ?? [];
  const changed = property.choicesMultiple
    ? !currentValues.includes(choiceValue)
    : currentValues.length !== 1 || currentValues[0] !== choiceValue;
  const row = diffRow(rule, currentValues.map(labelOf).join(", ") || "—", labelOf(choiceValue), changed);
  row.apply = (_patch, state) => {
    const map = seedValueMap(state, "choicesValues", bookmark);
    const prior = map.get(property.id)?.values ?? [];
    map.set(property.id, {
      propertyId: property.id,
      values: property.choicesMultiple ? Array.from(new Set([...prior, choiceValue])) : [choiceValue],
    });
  };
  return row;
}
