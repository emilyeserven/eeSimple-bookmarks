import type {
  FillFilter,
  FillTransform,
  PathMatch,
  TextMatch,
  WebsiteExtensionFillRule,
} from "@eesimple/types";

import { randomId } from "./utils";

// ---------------------------------------------------------------------------
// Blank drafts / defaults
// ---------------------------------------------------------------------------

/** A blank text match for the text-based filter variants. */
export function newTextMatch(): TextMatch {
  return {
    mode: "contains",
    value: "",
  };
}

/** A blank path-match gate — defaults to `prefix` (the natural fit for `/course/` vs `/library/view/`). */
export function newPathMatch(): PathMatch {
  return {
    mode: "prefix",
    value: "",
  };
}

/** A blank extraction rule with a stable id (secure-context-safe), default field target + selector. */
export function newFillRuleDraft(): WebsiteExtensionFillRule {
  return {
    id: randomId(),
    label: "",
    target: {
      kind: "field",
      field: "title",
    },
    extract: {
      selector: "",
    },
  };
}

/** Deep-clone an existing rule with a fresh id, for the editor's "duplicate" action. */
export function duplicateFillRule(rule: WebsiteExtensionFillRule): WebsiteExtensionFillRule {
  const clone = JSON.parse(JSON.stringify(rule)) as WebsiteExtensionFillRule;
  return {
    ...clone,
    id: randomId(),
  };
}

/** A blank filter row (a self-text "contains" match). */
export function newFillFilter(): FillFilter {
  return {
    kind: "selfText",
    match: newTextMatch(),
  };
}

/** A blank transform row (numeric extraction — the most common case). */
export function newFillTransform(): FillTransform {
  return {
    kind: "number",
  };
}

// ---------------------------------------------------------------------------
// Immutable list reorder
// ---------------------------------------------------------------------------

/** Move `arr[from]` to index `to`, returning the original array when `to` is out of range. */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
