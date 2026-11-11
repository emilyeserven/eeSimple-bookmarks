import type { PathMatch, WebsiteExtensionFillRule } from "@eesimple/types";

/*
 * Per-rule path gates: a rule with a `pathMatch` applies only when the current tab's pathname matches.
 */

/** Evaluate a path gate. Absent gate (or blank value) = always applies; an invalid regex never matches. */
export function pathMatches(pm: PathMatch | null | undefined, pathname: string): boolean {
  if (!pm?.value) return true;
  switch (pm.mode) {
    case "prefix":
      return pathname.startsWith(pm.value);
    case "suffix":
      return pathname.endsWith(pm.value);
    case "contains":
      return pathname.includes(pm.value);
    case "regex":
      try {
        return new RegExp(pm.value).test(pathname);
      }
      catch {
        return false;
      }
    default:
      return true;
  }
}

/** A stored rule; older, un-migrated rules may still carry a legacy `pathSuffix`. */
type StoredRule = WebsiteExtensionFillRule & { pathSuffix?: string };

/**
 * A rule's effective path gate: its `pathMatch`, or a legacy `pathSuffix` read as a suffix gate
 * (mirrors the server migration `pathSuffix → {mode:"suffix"}`). Without this fallback a rule that
 * still carries only `pathSuffix` would leak onto every path.
 */
function ruleGate(rule: StoredRule): PathMatch | null {
  if (rule.pathMatch) return rule.pathMatch;
  if (rule.pathSuffix) return {
    mode: "suffix",
    value: rule.pathSuffix,
  };
  return null;
}

/** Keep only rules whose optional path gate matches the page URL's path. */
export function gateRules(rules: readonly WebsiteExtensionFillRule[], pageUrl: string): WebsiteExtensionFillRule[] {
  let pathname = "";
  try {
    pathname = new URL(pageUrl).pathname;
  }
  catch {
    pathname = "";
  }
  return rules.filter(rule => pathMatches(ruleGate(rule), pathname));
}
