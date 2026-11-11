import type { ExtractedSectionEntry } from "./fillSections";
import type { FillTarget, RatingLevelDetector, TextMatch, WebsiteExtensionFillRule } from "@eesimple/types";

import { matchesText, runExtract } from "./fillExtract";
import { runSectionsRule } from "./fillSections";

/*
 * eeSimple Bookmarks — extension fill extraction engine.
 *
 * `runRules(rules, doc = document)` returns one `{ ruleId, values, error? }` per input rule, in order.
 * Each rule runs an extraction pipeline: selector -> filters (in order, each narrowing or mapping the
 * candidate set) -> read -> transforms (in order) -> split. Each rule is wrapped in try/catch so one
 * bad rule (invalid selector/regex) yields an `error` and never poisons the batch. "No candidates
 * matched" is an empty result, not an error.
 *
 * The popup injects the bundled `/fillEngine.js` unlisted script (which assigns
 * `globalThis.eesimpleFillEngine`) into the page and calls `runRules` against the live DOM; the web
 * app's in-app rule preview and the jsdom tests import this module directly.
 */

/** The rule fields the engine reads (a stored rule, or a synthetic one like the picker's sample). */
export type EngineRule = Pick<WebsiteExtensionFillRule, "id" | "target" | "extract">;

/** The per-rule result shape (one per input rule, in order). */
export interface FillRunResult {
  ruleId: string;
  /** Flat extracted values (also the fallback list of a `sections` rule's start values). */
  values: string[];
  /** Present for a `sections` target — the structured (optionally tiered) entries. */
  entries?: ExtractedSectionEntry[];
  /** Present for a `taxonomyDirect` `match`-mode rule — the scraped entity identifier. */
  resolveValue?: string;
  /** Present when the rule threw (invalid selector/regex); `values` is then empty. */
  error?: string;
}

type CustomPropertyTarget = Extract<FillTarget, { kind: "customProperty" }>;
/** A stored level detector; pre-shared-selector rules may still carry a full `match` object. */
type StoredLevelDetector = RatingLevelDetector & { match?: TextMatch };

/** The effective text match of one level detector (new `matchText` shape, or the legacy `match`). */
function levelMatch(det: StoredLevelDetector, target: CustomPropertyTarget): TextMatch | undefined {
  if (det.matchText != null && det.matchText !== "") {
    return {
      mode: target.ratingMatchExact === false ? "contains" : "equals",
      value: det.matchText,
      caseSensitive: target.ratingMatchCaseSensitive === true,
    };
  }
  return det.match;
}

/** Whether one level detector is present on the page (an invalid selector counts as absent). */
function levelPresent(det: StoredLevelDetector, target: CustomPropertyTarget, doc: Document): boolean {
  const selector = (det.selector ?? "").trim() || (target.ratingSelector ?? "").trim();
  if (!selector) return false;
  let els: Element[];
  try {
    els = Array.from(doc.querySelectorAll(selector));
  }
  catch {
    return false;
  }
  const match = levelMatch(det, target);
  return match ? els.some(el => matchesText((el.textContent ?? "").trim(), match)) : els.length > 0;
}

/**
 * Rating "detect range" mode: evaluate each per-level detector against the page and return the sorted
 * list of present levels. The popup turns these into From (min) / To (max).
 */
function detectRatingLevels(target: CustomPropertyTarget, doc: Document): number[] {
  const present = new Set<number>();
  for (const det of (target.ratingLevels ?? []) as (StoredLevelDetector | null)[]) {
    if (det && levelPresent(det, target, doc)) present.add(det.level);
  }
  return [...present].sort((a, b) => a - b);
}

function runOne(rule: EngineRule, doc: Document): FillRunResult {
  const target = rule.target as FillTarget | undefined;
  const extract = rule.extract ?? {};
  if (target?.kind === "sections") {
    const entries = runSectionsRule(target, extract, doc);
    return {
      ruleId: rule.id,
      values: entries.map(e => e.startValue),
      entries,
    };
  }
  // Detect-range mode: the values are the present rating levels (as strings), not a scraped scalar.
  if (target?.kind === "customProperty" && target.ratingBound === "range") {
    return {
      ruleId: rule.id,
      values: detectRatingLevels(target, doc).map(String),
    };
  }
  const out: FillRunResult = {
    ruleId: rule.id,
    values: runExtract(extract, doc),
  };
  // A `taxonomyDirect` match-mode rule needs a second extraction: the entity identifier.
  if (target?.kind === "taxonomyDirect" && target.resolve?.mode === "match" && target.resolve.select) {
    out.resolveValue = runExtract(target.resolve.select, doc)[0] ?? "";
  }
  return out;
}

/** Run every rule against `doc`, isolating per-rule failures. */
export function runRules(rules: readonly EngineRule[] | null | undefined, doc: Document = document): FillRunResult[] {
  return (rules ?? []).map((rule) => {
    try {
      return runOne(rule, doc);
    }
    catch (err) {
      return {
        ruleId: rule.id,
        values: [],
        error: err instanceof Error && err.message ? err.message : String(err),
      };
    }
  });
}
