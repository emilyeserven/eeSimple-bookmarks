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

// Month name → 1-based number (full names + common abbreviations), lowercased keys.
const DATE_MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

/** Assemble `"YYYY-MM-DD"` (day given) or `"YYYY-MM"`; `""` when month/day is out of range. */
function isoDateParts(year: string, month: number, day: string | undefined): string {
  if (!(month >= 1 && month <= 12)) return "";
  const out = `${year.padStart(4, "0")}-${String(month).padStart(2, "0")}`;
  if (day == null || day === "") return out;
  const d = Number(day);
  if (!(d >= 1 && d <= 31)) return "";
  return `${out}-${String(d).padStart(2, "0")}`;
}

/**
 * Normalize a human date string to canonical `"YYYY-MM-DD"` / `"YYYY-MM"`; `""` when unrecognized.
 * Mirror of `parseNormalizedDate` in `public/extension/fillEngine.js` — keep the two in sync.
 */
export function normalizeDateValue(value: string): string {
  const text = value.trim();
  let m: RegExpExecArray | null;
  // ISO passthrough: YYYY-MM or YYYY-MM-DD.
  m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(text);
  if (m) return isoDateParts(m[1], Number(m[2]), m[3]);
  // Numeric year-first: YYYY/MM or YYYY/MM/DD.
  m = /^(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?$/.exec(text);
  if (m) return isoDateParts(m[1], Number(m[2]), m[3]);
  // Numeric month-first (US): MM/YYYY or MM/DD/YYYY.
  m = /^(\d{1,2})(?:\/(\d{1,2}))?\/(\d{4})$/.exec(text);
  if (m) return isoDateParts(m[3], Number(m[1]), m[2]);
  // Month name + day + year: "June 21, 2026", "Jun 21 2026".
  m = /^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/.exec(text);
  if (m) return DATE_MONTHS[m[1].toLowerCase()] ? isoDateParts(m[3], DATE_MONTHS[m[1].toLowerCase()], m[2]) : "";
  // Day + month name + year: "21 June 2026", "21st Jun 2026".
  m = /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?,?\s+(\d{4})$/.exec(text);
  if (m) return DATE_MONTHS[m[2].toLowerCase()] ? isoDateParts(m[3], DATE_MONTHS[m[2].toLowerCase()], m[1]) : "";
  // Month name + year: "June 2026", "Jun 2026".
  m = /^([A-Za-z]+)\.?\s+(\d{4})$/.exec(text);
  if (m) return DATE_MONTHS[m[1].toLowerCase()] ? isoDateParts(m[2], DATE_MONTHS[m[1].toLowerCase()], undefined) : "";
  return "";
}

/**
 * Apply one transform to a single value (empty string on a miss or an invalid regex/replace).
 * `baseUrl` is the page URL an `absoluteUrl` transform resolves against; empty = no-op passthrough.
 */
export function applyFillTransform(value: string, transform: FillTransform, baseUrl = ""): string {
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
    case "date":
      return normalizeDateValue(value);
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
    case "affix":
      return (transform.prefix ?? "") + value + (transform.suffix ?? "");
    case "absoluteUrl": {
      if (!baseUrl) return value;
      try {
        return new URL(value, baseUrl).href;
      }
      catch {
        return value;
      }
    }
  }
}

/** Run a full transform list over one value, in order — the extension's per-value pipeline. */
export function applyFillTransforms(value: string, transforms: FillTransform[], baseUrl = ""): string {
  return transforms.reduce((current, transform) => applyFillTransform(current, transform, baseUrl), value);
}
