import type { WebsiteExtensionFillRule } from "@eesimple/types";

// Side-effect import: the classic extension script assigns `globalThis.eesimpleFillEngine`. This is the
// SAME file the browser extension injects, so an in-app preview matches the extension's extraction
// exactly (the test suite imports it the same way). It has no exports — the assignment is the point.
// eslint-disable-next-line import/no-unassigned-import
import "../../public/extension/fillEngine.js";

import { normalizeExtensionFillRules } from "./extensionFillClean";

/** One structured section entry the `sections` extraction produces (ids are assigned later, in the popup). */
export interface PreviewSectionEntry {
  name: string;
  type: string;
  startValue: string;
  url?: string;
  children?: PreviewSectionEntry[];
}

/** The per-rule result shape returned by the engine's `runRules` (one per input rule, in order). */
export interface FillEngineResult {
  ruleId: string;
  /** Flat extracted values (also the fallback list of a `sections` rule's start values). */
  values: string[];
  /** Present for a `sections` target — the structured (optionally tiered) entries. */
  entries?: PreviewSectionEntry[];
  /** Present for a `taxonomyDirect` `match`-mode rule — the scraped entity identifier. */
  resolveValue?: string;
  /** Present when the rule threw (invalid selector/regex); `values` is then empty. */
  error?: string;
}

interface FillEngineGlobal {
  runRules(rules: unknown[], doc?: Document): FillEngineResult[];
}

/**
 * Run the extension fill engine in-app against pasted HTML and return what it captures — the debug
 * preview. Rules are run through {@link normalizeExtensionFillRules} first (dropping incomplete rules /
 * stray fields) so the preview matches exactly what gets saved and shipped to the extension.
 *
 * Parity note: a `backgroundImage` read relies on `getComputedStyle`, which is empty for a detached
 * `DOMParser` document — that one read only resolves on the live page, not in this preview.
 */
export function runFillPreview(
  rules: WebsiteExtensionFillRule[],
  html: string,
): FillEngineResult[] {
  const engine = (globalThis as unknown as { eesimpleFillEngine?: FillEngineGlobal }).eesimpleFillEngine;
  if (!engine) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  return engine.runRules(normalizeExtensionFillRules(rules), doc);
}

/** The captured value a result is compared/displayed by: the structured entries if present, else the flat values. */
export function previewActual(result: FillEngineResult): unknown {
  return result.entries ?? result.values;
}

/** Key-order-independent structural equality (no deep-equal dependency in the client). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (typeof a === "object") {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(key => deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ));
  }
  return false;
}

/**
 * Compare a result against the user's expected JSON. `null` = no expectation given; `"invalid"` = the
 * expected text isn't valid JSON; otherwise `"match"`/`"mismatch"` on the captured value
 * ({@link previewActual}, i.e. entries when present else values).
 */
export function previewMatchesExpected(
  result: FillEngineResult,
  expectedText: string,
): "match" | "mismatch" | "invalid" | null {
  const trimmed = expectedText.trim();
  if (!trimmed) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  }
  catch {
    return "invalid";
  }
  return deepEqual(previewActual(result), parsed) ? "match" : "mismatch";
}
