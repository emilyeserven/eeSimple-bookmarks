import type { FillTransform } from "@eesimple/types";

/**
 * Pure TS mirror of the browser extension's transform runtime, used by the Transforms editor's
 * live preview so the user can test a rule's transforms against sample text without a live page.
 *
 * The canonical runtime is `public/extension/fillEngine.js` (`applyTransform` / `parseDurationSeconds`),
 * a classic non-module script the client bundle can't import — so this file reimplements the same
 * per-value logic and MUST stay in sync with it (`fillTransformPreview.test.ts` asserts parity).
 * Unlike the engine (which wraps each rule in try/catch), invalid `regex`/`replace` patterns here
 * yield an empty string rather than throwing, so the preview degrades gracefully mid-typing.
 */

// Seconds per unit (year = 365 d, month = 30 d — calendar-approximate). Keyed by the token's
// discriminating chars: "mo" for months, otherwise the first letter (y/d/h/m/s).
const DURATION_UNIT_SECONDS: Record<string, number> = {
  y: 31536000,
  mo: 2592000,
  d: 86400,
  h: 3600,
  m: 60,
  s: 1,
};

// `<number><unit>` scanner. The unit alternation lists `mo…` before `m…` so "2mo" is months and
// "34m" is minutes; each unit accepts its common spellings (h/hr/hour/hours, etc.).
const DURATION_TOKEN_SOURCE
  = "(\\d+(?:\\.\\d+)?)\\s*(y(?:ears?)?|mo(?:nths?)?|d(?:ays?)?|h(?:(?:ou)?rs?)?|m(?:in(?:ute)?s?)?|s(?:ec(?:ond)?s?)?)";

/** Parse a duration string into total seconds; "" when no `<number><unit>` token is present. */
export function parseDurationSeconds(value: string): string {
  const re = new RegExp(DURATION_TOKEN_SOURCE, "gi");
  let total = 0;
  let matched = false;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    const unit = m[2].toLowerCase();
    const key = unit.charAt(0) === "m" && unit.charAt(1) === "o" ? "mo" : unit.charAt(0);
    total += Number.parseFloat(m[1]) * DURATION_UNIT_SECONDS[key];
    matched = true;
  }
  return matched ? String(Math.round(total)) : "";
}

/** Apply one transform to a single value (empty string on a miss or an invalid regex/replace). */
export function applyFillTransform(value: string, transform: FillTransform): string {
  switch (transform.kind) {
    case "regex": {
      try {
        const re = new RegExp(transform.pattern, transform.flags ?? "");
        const m = re.exec(value);
        if (!m) return "";
        const group = typeof transform.group === "number" ? transform.group : 0;
        return m[group] == null ? "" : m[group];
      }
      catch {
        return "";
      }
    }
    case "number": {
      const digits = value.replace(/,/g, "").match(/\d+/);
      return digits ? digits[0] : "";
    }
    case "duration":
      return parseDurationSeconds(value);
    case "replace": {
      try {
        return value.replace(new RegExp(transform.pattern, transform.flags ?? ""), transform.replacement);
      }
      catch {
        return "";
      }
    }
    case "trim":
      return value.trim();
  }
}

/** Run a full transform list over one value, in order — the extension's per-value pipeline. */
export function applyFillTransforms(value: string, transforms: FillTransform[]): string {
  return transforms.reduce((current, transform) => applyFillTransform(current, transform), value);
}
