/**
 * Shared fill-band math for the rating renderers (`StarRating` / `RatingTicks`). Given the current
 * value (and, for a read-only range, its high end), returns the `[bandStart, bandEnd]` interval each
 * glyph's fill is measured against — the per-glyph fill of the i-th glyph (position i+1) is
 * `max(0, min(i + 1, bandEnd) - max(i, bandStart))`.
 *
 * - **Single value** (or interactive): `bandStart = 0`, `bandEnd = display` — fills from the left.
 * - **Read-only range**: `bandEnd = rangeEnd`; `bandStart = value` (start-exclusive band, e.g. 3→5
 *   fills 4,5) unless `rangeIncludeStart`, which shifts it to `value - 1` so the start level's glyph
 *   fills too (3→5 fills 3,4,5 — an inclusive band).
 */
export function ratingFillBounds(opts: {
  /** The value to render fill up to (usually `hover ?? value`). */
  display: number;
  /** The low end of a range (the property's stored `value`). */
  value: number;
  /** The high end of a read-only range, or `null` for a single value. */
  rangeEnd: number | null;
  readOnly: boolean;
  /** When true, an inclusive range band (fills the start level's glyph too). */
  rangeIncludeStart: boolean;
}): { bandStart: number;
  bandEnd: number; } {
  const isRange = opts.readOnly && opts.rangeEnd !== null && opts.rangeEnd > opts.value;
  if (isRange) {
    return {
      bandStart: opts.rangeIncludeStart ? opts.value - 1 : opts.value,
      bandEnd: opts.rangeEnd as number,
    };
  }
  return {
    bandStart: 0,
    bandEnd: opts.display,
  };
}
