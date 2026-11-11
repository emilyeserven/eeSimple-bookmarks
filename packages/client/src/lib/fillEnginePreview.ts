import type { FillRunResult } from "@eesimple/extension/fill";
import type { WebsiteExtensionFillRule } from "@eesimple/types";

// The SAME engine module the browser extension injects into pages (`packages/extension`), so an in-app
// preview matches the extension's extraction exactly.
import { runRules } from "@eesimple/extension/fill";

import { normalizeExtensionFillRules } from "./extensionFillClean";

/** The per-rule result shape returned by the engine's `runRules` (one per input rule, in order). */
export type FillEngineResult = FillRunResult;

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
  const doc = new DOMParser().parseFromString(html, "text/html");
  return runRules(normalizeExtensionFillRules(rules), doc);
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
