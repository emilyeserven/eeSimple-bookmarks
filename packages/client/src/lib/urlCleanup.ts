import type { Website, WebsiteParamRule } from "@eesimple/types";

export type UrlCleanupMode = "none" | "trackers" | "all";

export const TRACKING_PARAMS: ReadonlySet<string> = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "msclkid", "gbraid", "wbraid", "dclid",
  "mc_cid", "mc_eid", "yclid", "ttclid", "twclid",
  "_ga", "_gl", "hsa_acc", "hsa_ad", "hsa_cam", "hsa_grp",
  "hsa_kw", "hsa_mt", "hsa_net", "hsa_src", "hsa_tgt", "hsa_ver",
  "li_fat_id", "igshid", "awc", "ef_id", "s_kwcid", "siid",
]);

/** Data the canonicalizer reads: the cleanup mode plus the websites + ignore list it matches against. */
export interface CanonicalizeData {
  mode: UrlCleanupMode;
  websites: Website[];
  ignoreList: string[];
}

/** Outcome of canonicalizing a URL against the website rules. */
export interface CanonicalizeResult {
  /** The cleaned (possibly expanded + param-stripped) URL. */
  url: string;
  /** The website the URL resolves to (directly or via a verified shortened link), or `null`. */
  matchedWebsite: Website | null;
  /** Shortener classification of the input host. */
  shortener: "verified" | "generic" | null;
  /** Whether a verified shortened link was rewritten to its long form. */
  expanded: boolean;
  /** Whether to nudge the user to use the long link (short link kept or unexpandable). */
  nudge: boolean;
}

/** Host of a parsed URL, lower-cased with a leading `www.` stripped — mirrors the server's normalize. */
function hostOf(parsed: URL): string {
  return parsed.hostname.replace(/^www\./i, "").toLowerCase();
}

/** Find the website matching `host` directly, else via one of its verified shortened links. */
function matchWebsite(
  host: string,
  websites: Website[],
): { website: Website | null;
  viaShortened: { domain: string;
    expandTo: string | null;
    keepShortened: boolean; } | null; } {
  const direct = websites.find(w => w.domain === host);
  if (direct) return {
    website: direct,
    viaShortened: null,
  };
  for (const w of websites) {
    const link = w.shortenedLinks.find(s => s.domain === host);
    if (link) return {
      website: w,
      viaShortened: link,
    };
  }
  return {
    website: null,
    viaShortened: null,
  };
}

/** Substitute a shortened link's expansion template. `{id}`=first path segment, `{path}`=path minus `/`. */
function applyTemplate(template: string, parsed: URL): string {
  const id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
  const path = parsed.pathname.replace(/^\//, "");
  return template.replace(/\{id\}/g, id).replace(/\{path\}/g, path);
}

/** Keep only the params whitelisted for the longest path rule matching the URL; strip the rest. */
function applyParamRules(parsed: URL, rules: WebsiteParamRule[]): void {
  const matching = rules
    .filter(rule => rule.pathSuffix === "" || parsed.pathname.endsWith(rule.pathSuffix))
    .sort((a, b) => b.pathSuffix.length - a.pathSuffix.length)[0];
  const keep = matching?.params ?? [];
  const next = new URLSearchParams();
  for (const key of keep) {
    const value = parsed.searchParams.get(key);
    if (value !== null) next.set(key, value);
  }
  parsed.search = next.toString();
}

/**
 * Canonicalize a URL using data-driven website rules:
 *  - resolve verified shortened links (e.g. `youtu.be`) to their parent site, expanding to the long
 *    form when a rule exists (else keep + nudge);
 *  - generic shorteners in the ignore list can't be expanded → nudge;
 *  - apply the matched site's path-scoped param whitelist when it has one (independent of `mode`);
 *  - otherwise fall back to the `mode` cleaning (none/trackers/all).
 * Pure. Returns the input unchanged (and an empty result) when it isn't a parseable URL.
 */
export function canonicalize(url: string, {
  mode, websites, ignoreList,
}: CanonicalizeData): CanonicalizeResult {
  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return {
      url,
      matchedWebsite: null,
      shortener: null,
      expanded: false,
      nudge: false,
    };
  }

  const initial = matchWebsite(hostOf(parsed), websites);
  let matchedWebsite = initial.website;
  let shortener: "verified" | "generic" | null = null;
  let expanded = false;
  let nudge = false;

  if (initial.viaShortened) {
    shortener = "verified";
    const link = initial.viaShortened;
    if (link.expandTo && !link.keepShortened) {
      try {
        parsed = new URL(applyTemplate(link.expandTo, parsed));
        expanded = true;
        // Re-resolve against the expanded host (normally the parent site itself).
        matchedWebsite = matchWebsite(hostOf(parsed), websites).website ?? initial.website;
      }
      catch {
        // A malformed template leaves the short URL intact; nudge to use the long link.
        nudge = true;
      }
    }
    else {
      nudge = true;
    }
  }
  else if (!matchedWebsite && ignoreList.includes(hostOf(parsed))) {
    shortener = "generic";
    nudge = true;
  }

  const rules = matchedWebsite?.paramRules ?? [];
  const hasRules = rules.length > 0;
  if (hasRules) {
    applyParamRules(parsed, rules);
  }
  else if (mode === "all") {
    parsed.search = "";
  }
  else if (mode === "trackers") {
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key)) parsed.searchParams.delete(key);
    }
  }

  // Only re-serialize when something actually changed, so a `none`-mode no-op preserves the raw URL
  // (and doesn't introduce a spurious `originalUrl` diff via URL normalization).
  const changed = expanded || hasRules || mode === "all" || mode === "trackers";
  return {
    url: changed ? parsed.toString() : url,
    matchedWebsite,
    shortener,
    expanded,
    nudge,
  };
}

/** Convenience wrapper returning just the cleaned URL string (used by the submit path). */
export function cleanUrl(url: string, data: CanonicalizeData): string {
  return canonicalize(url, data).url;
}
