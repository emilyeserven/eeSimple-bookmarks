/**
 * Link Health — on-demand dead-link checking. A batch job probes every bookmark URL's HTTP
 * reachability and persists the outcome on the bookmark row (`linkCheckStatus` /
 * `linkCheckDetail` / `linkCheckedAt`); the Settings → Advanced → Link Health page lists the
 * broken ones. The result columns are display-only maintenance data — they deliberately do NOT
 * ride the hydrated `Bookmark` type or the bookmark cache.
 */

/** Non-HTTP failure kinds a link check can record (HTTP failures record the status code instead). */
export const LINK_CHECK_ERROR_KINDS = ["timeout", "network_error", "blocked"] as const;

export type LinkCheckErrorKind = typeof LINK_CHECK_ERROR_KINDS[number];

/** A bookmark whose last link check failed, as listed by `GET /api/link-health/broken`. */
export interface BrokenBookmark {
  id: string;
  title: string;
  url: string;
  /** HTTP status code as a string (e.g. `"404"`) or a {@link LinkCheckErrorKind}. */
  detail: string | null;
  checkedAt: string | null;
}

/** Outcome of re-checking a single bookmark's link on demand. */
export interface LinkRecheckResult {
  status: "ok" | "broken";
  /** HTTP status code as a string (e.g. `"404"`) or a {@link LinkCheckErrorKind}; null when ok. */
  detail: string | null;
  checkedAt: string;
}
