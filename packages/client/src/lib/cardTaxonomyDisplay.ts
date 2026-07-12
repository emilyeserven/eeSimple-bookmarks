/**
 * How a multi-value taxonomy field (Tags, People, Groups, Genres & Moods, Locations) renders its
 * terms on a bookmark card, resolved from the field's `maxTerms` / `collapseToCount` placement knobs:
 * - `all` — every name (the default, and the pre-knob behavior).
 * - `limit` — the first `visible` names plus a "+`hidden` more" indicator.
 * - `count` — the field's icon + the total count instead of any names.
 */
export type TermDisplay
  = | { mode: "all" }
    | { mode: "limit";
      visible: number;
      hidden: number; }
      | { mode: "count";
        total: number; };

/** The resolved term-display knobs on a field's placement. */
export interface TermDisplayOptions {
  /** Cap on visible names; `null` = no cap. */
  maxTerms: number | null;
  /** When over the limit (or with no limit), collapse to the icon + count instead of "+N more". */
  collapseToCount: boolean;
}

/**
 * Decide how a field with `total` terms should render given its term-display knobs.
 *
 * - `collapseToCount` with no `maxTerms` → always a `count` (show `🏷 total`).
 * - `collapseToCount` with a `maxTerms` → names while `total <= maxTerms`, else a `count`.
 * - `maxTerms` alone → the first `maxTerms` names + a "+N more" (`limit`) once over the cap.
 * - neither → `all`.
 *
 * Pure — unit-tested directly.
 */
export function resolveTermDisplay(total: number, opts: TermDisplayOptions): TermDisplay {
  const {
    maxTerms, collapseToCount,
  } = opts;
  const overLimit = maxTerms != null && total > maxTerms;
  if (collapseToCount && (maxTerms == null || overLimit)) {
    return {
      mode: "count",
      total,
    };
  }
  if (overLimit) {
    return {
      mode: "limit",
      visible: maxTerms,
      hidden: total - maxTerms,
    };
  }
  return {
    mode: "all",
  };
}
