import type { BookmarkNumberValue, CustomProperty } from "@eesimple/types";

/**
 * Separator used to encode a `ratingScale` **range** inside the single-string `numberInputs` channel
 * (`"from~to"`). A plain number string (no separator) stays a single value, so existing non-range
 * number/rating inputs are untouched. Range awareness is localized to {@link parseNumberInput} /
 * {@link encodeRatingRange} and their few callers rather than threaded as a parallel input record.
 */
export const RATING_RANGE_SEPARATOR = "~";

/**
 * Parse a raw `numberInputs` string into a stored value shape. A `"from~to"` string yields a range
 * (`value` = low end, `valueEnd` = high end, normalized so `value ≤ valueEnd`; equal ends collapse to
 * a single value); a plain number yields `{ value, valueEnd: null }`. Returns `null` for blank or
 * non-numeric input (so the caller drops it).
 */
export function parseNumberInput(raw: string): { value: number;
  valueEnd: number | null; } | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (trimmed.includes(RATING_RANGE_SEPARATOR)) {
    const [fromStr, toStr] = trimmed.split(RATING_RANGE_SEPARATOR);
    const from = Number(fromStr);
    const to = Number(toStr);
    if (Number.isNaN(from) || Number.isNaN(to)) return null;
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    return {
      value: lo,
      valueEnd: lo === hi ? null : hi,
    };
  }
  const value = Number(trimmed);
  if (Number.isNaN(value)) return null;
  return {
    value,
    valueEnd: null,
  };
}

/** Encode a From/To pair into a `numberInputs` string; collapses to a single number when equal/absent. */
export function encodeRatingRange(from: number, to: number | null | undefined): string {
  if (to === null || to === undefined || to === from) return String(from);
  return `${from}${RATING_RANGE_SEPARATOR}${to}`;
}

/**
 * Build the typed numeric property values from a record of raw string inputs, keeping only the
 * `number`/`ratingScale` properties (both stored in `bookmarkNumberValues`) whose input parses to a
 * finite number. A `ratingScale` input may encode a range (`"from~to"`) — see {@link parseNumberInput};
 * `number`/`calculate` inputs are always single values. Shared by the bookmark form, autofill-rule
 * form, and category-defaults section, which each pass their own pre-filtered property list (so their
 * differing category/enabled/calculate filtering is preserved).
 */
export function buildNumberValuesFromInputs(
  properties: CustomProperty[],
  numberInputs: Record<string, string>,
): BookmarkNumberValue[] {
  return properties
    .filter(property => property.type === "number" || property.type === "ratingScale")
    .map((property): BookmarkNumberValue | null => {
      const parsed = parseNumberInput(numberInputs[property.id] ?? "");
      if (parsed === null) return null;
      // Only a range-enabled ratingScale keeps its high end; everything else is a single value.
      const valueEnd = property.type === "ratingScale" && property.ratingAllowRange ? parsed.valueEnd : null;
      return {
        propertyId: property.id,
        value: parsed.value,
        valueEnd,
      };
    })
    .filter((entry): entry is BookmarkNumberValue => entry !== null);
}
