/**
 * A per-website log of structural facts the server scanner learns while fetching a site's pages —
 * e.g. it blocks crawlers, only renders under a headless browser, is unreachable, or resolves
 * redirects unreliably. Auto-populated during `GET /api/scan` and stored as nullable jsonb on
 * `websites.scan_observations` (mirrors `extensionFillRules`); operators can also edit the list by
 * hand on the website's edit page. Display/diagnostic data only — never matchable, never touches the
 * bookmark cache.
 */

/** The built-in observation kinds the scanner can record. Add a kind here + a label below. */
export const WEBSITE_SCAN_OBSERVATION_KINDS = [
  "blocks-crawlers",
  "redirect-failure",
  "unreachable",
  "needs-hosted-metadata",
] as const;
export type WebsiteScanObservationKind = typeof WEBSITE_SCAN_OBSERVATION_KINDS[number];

/** Human labels for each observation kind (derive UI option lists from this — one edit point). */
export const WEBSITE_SCAN_OBSERVATION_LABELS: Record<WebsiteScanObservationKind, string> = {
  "blocks-crawlers": "Blocks crawlers",
  "redirect-failure": "Redirect resolution fails",
  "unreachable": "Unreachable / times out",
  "needs-hosted-metadata": "Needs headless rendering",
};

/** One recorded fact about a website. */
export interface WebsiteScanObservation {
  kind: WebsiteScanObservationKind;
  /** Short human detail, e.g. `"HTTP 403"` or the redirect-resolution error. */
  detail?: string;
  /** Whether the scanner detected this automatically, or a user added it by hand. */
  source: "scanner" | "manual";
  /** ISO-8601 timestamp of the last update; stamped server-side. */
  updatedAt?: string;
}

/** The raw signals a single scan produces, from which observation kinds are derived. */
export interface ScanObservationSignals {
  /** The redirect-resolution error string, if resolution failed (`null`/absent = ok). */
  redirectError?: string | null;
  /** The HTTP status of a failed direct head fetch (`http_error`), if any. */
  headFetchStatus?: number;
  /** A non-HTTP direct head-fetch failure kind, if any. */
  headFetchFailure?: "timeout" | "network_error";
  /** True when the direct scrape came back empty but the hosted/headless provider filled it in. */
  usedHostedFallback?: boolean;
}

/** A freshly-detected observation before it is merged into the stored list. */
export interface DetectedScanObservation {
  kind: WebsiteScanObservationKind;
  detail?: string;
}

/** HTTP statuses that indicate the site actively blocked the (browser-impersonating) crawler. */
const BLOCKING_STATUSES = new Set([401, 403, 429]);

/**
 * Derive the observation kinds a single scan's raw signals imply. Pure — the scanner passes the
 * signals it gathered and gets back the facts to record (deduped by kind, first-detail-wins).
 */
export function deriveScanObservations(signals: ScanObservationSignals): DetectedScanObservation[] {
  const detected: DetectedScanObservation[] = [];
  const seen = new Set<WebsiteScanObservationKind>();
  const add = (kind: WebsiteScanObservationKind, detail?: string): void => {
    if (seen.has(kind)) return;
    seen.add(kind);
    detected.push(detail
      ? {
        kind,
        detail,
      }
      : {
        kind,
      });
  };

  if (signals.redirectError) add("redirect-failure", signals.redirectError);
  if (signals.headFetchStatus !== undefined && BLOCKING_STATUSES.has(signals.headFetchStatus)) {
    add("blocks-crawlers", `HTTP ${signals.headFetchStatus}`);
  }
  if (signals.headFetchFailure) {
    add("unreachable", signals.headFetchFailure === "timeout" ? "Timed out" : "Network error");
  }
  if (signals.usedHostedFallback) add("needs-hosted-metadata");

  return detected;
}

/**
 * Merge freshly-detected scanner observations into a website's stored list: each detected kind is
 * upserted as a `scanner` entry (refreshing `detail` + `updatedAt`), while **manual** entries and
 * scanner entries of other kinds are preserved. Result is deduped by kind and ordered
 * existing-first. Returns `null` when nothing changed, so the write-back can no-op. `now` is passed
 * in (ISO-8601) to keep this pure.
 */
export function mergeScanObservations(
  existing: WebsiteScanObservation[],
  detected: DetectedScanObservation[],
  now: string,
): WebsiteScanObservation[] | null {
  if (detected.length === 0) return null;
  const detectedByKind = new Map(detected.map(d => [d.kind, d]));
  let changed = false;

  // Update existing entries in place where a detection matches; keep everything else.
  const merged: WebsiteScanObservation[] = existing.map((entry) => {
    const hit = detectedByKind.get(entry.kind);
    if (!hit) return entry;
    detectedByKind.delete(entry.kind);
    const next: WebsiteScanObservation = {
      kind: entry.kind,
      source: "scanner",
      updatedAt: now,
      ...(hit.detail
        ? {
          detail: hit.detail,
        }
        : {}),
    };
    if (entry.source !== next.source || entry.detail !== next.detail) changed = true;
    return next;
  });

  // Append any detections not already present.
  for (const hit of detectedByKind.values()) {
    merged.push({
      kind: hit.kind,
      source: "scanner",
      updatedAt: now,
      ...(hit.detail
        ? {
          detail: hit.detail,
        }
        : {}),
    });
    changed = true;
  }

  return changed ? merged : null;
}
