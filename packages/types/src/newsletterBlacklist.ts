/**
 * Newsletter scan blacklist — shared, pure matching helpers used on both sides of the wire.
 *
 * When a user rejects a parsed newsletter link they can also blacklist it so it (or similar links)
 * is dropped from FUTURE scans. The middleware filters resolved candidates through `isBlacklisted`
 * during ingest; the client's reject UI derives the three candidate entries with
 * `blacklistPatternsFor`. Keeping both here means one definition of "matches" for both surfaces.
 */

/** How a blacklist entry matches a URL. */
export const NEWSLETTER_BLACKLIST_KINDS = ["exact", "domain", "path-prefix"] as const;

export type NewsletterBlacklistKind = typeof NEWSLETTER_BLACKLIST_KINDS[number];

/**
 * One blacklist rule. `value` is normalized for its kind:
 * - `exact`       → `host + pathname` (no scheme/query/fragment), trailing slash trimmed.
 * - `domain`      → bare host (lower-cased, leading `www.` stripped).
 * - `path-prefix` → `host + pathname`, trailing slash trimmed.
 */
export interface NewsletterBlacklistEntry {
  kind: NewsletterBlacklistKind;
  value: string;
}

/** Lower-cased host with a leading `www.` stripped. */
function normalizeHost(host: string): string {
  return host.replace(/^www\./i, "").toLowerCase();
}

/** Drop a trailing slash (but keep a bare "/"). */
function trimTrailingSlash(path: string): string {
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}

/**
 * `host + pathname` for a parsed URL, host-normalized, lower-cased, and trailing-slash-trimmed.
 * Matching is case-insensitive on the path so a blacklist entry catches case variants too.
 */
function hostPath(parsed: URL): string {
  return `${normalizeHost(parsed.hostname)}${trimTrailingSlash(parsed.pathname.toLowerCase())}`;
}

/** True when `host` equals `base` or is a subdomain of it. */
function hostMatchesDomain(host: string, base: string): boolean {
  return host === base || host.endsWith(`.${base}`);
}

/** Whether a resolved URL is blocked by any blacklist entry. Pure; bad URLs never match. */
export function isBlacklisted(url: string, entries: NewsletterBlacklistEntry[]): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return false;
  }
  const host = normalizeHost(parsed.hostname);
  const path = hostPath(parsed);
  return entries.some((entry) => {
    const value = entry.value.trim().toLowerCase();
    if (value.length === 0) return false;
    if (entry.kind === "domain") return hostMatchesDomain(host, normalizeHost(value));
    if (entry.kind === "exact") return path === trimTrailingSlash(value);
    // path-prefix: same host, and the path is the prefix or a sub-path of it.
    const prefix = trimTrailingSlash(value);
    return path === prefix || path.startsWith(`${prefix}/`);
  });
}

/** The three candidate blacklist entries derived from a resolved URL (for the reject UI). */
export function blacklistPatternsFor(url: string): {
  exact: NewsletterBlacklistEntry;
  domain: NewsletterBlacklistEntry;
  pathPrefix: NewsletterBlacklistEntry;
} {
  const parsed = new URL(url);
  const host = normalizeHost(parsed.hostname);
  const path = hostPath(parsed);
  return {
    exact: {
      kind: "exact",
      value: path,
    },
    domain: {
      kind: "domain",
      value: host,
    },
    pathPrefix: {
      kind: "path-prefix",
      value: path,
    },
  };
}

/** Normalize + de-dupe a blacklist (trim, lower-case, host-strip, drop empties). Pure. */
export function normalizeBlacklist(entries: NewsletterBlacklistEntry[]): NewsletterBlacklistEntry[] {
  const seen = new Set<string>();
  const out: NewsletterBlacklistEntry[] = [];
  for (const entry of entries) {
    if (!NEWSLETTER_BLACKLIST_KINDS.includes(entry.kind)) continue;
    const raw = entry.value.trim().toLowerCase();
    const value = entry.kind === "domain" ? normalizeHost(raw) : trimTrailingSlash(raw);
    if (value.length === 0) continue;
    const key = `${entry.kind}:${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      kind: entry.kind,
      value,
    });
  }
  return out;
}
