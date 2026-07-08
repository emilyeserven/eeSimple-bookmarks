/**
 * Pure O'Reilly (learning.oreilly.com / www.oreilly.com) product-URL helpers shared by the API
 * (`@eesimple/middleware`) and the React client. Unlike Amazon's ASIN, O'Reilly product URLs embed
 * the book's real ISBN-13 directly as a path segment (e.g.
 * `/library/view/{slug}/{isbn13}/` or `/api/v1/continue/{isbn13}/`) — so, like the Amazon
 * ASIN-is-ISBN case, this is pure URL parsing with no page-fetch fallback needed.
 */

import { isValidIsbn13 } from "./isbn.js";

/** Matches `oreilly.com`, optionally under one subdomain (e.g. `learning.oreilly.com`). */
const OREILLY_HOST_RE = /^(?:[a-z0-9-]+\.)?oreilly\.com$/i;

/** Find the first path segment that is a checksum-valid ISBN-13. */
function findIsbn13Segment(pathname: string): string | null {
  for (const segment of pathname.split("/").filter(Boolean)) {
    if (/^\d{13}$/.test(segment) && isValidIsbn13(segment)) return segment;
  }
  return null;
}

/**
 * Extract a checksum-valid ISBN-13 from an O'Reilly product URL's path, or `null` when the URL
 * isn't a recognizable O'Reilly host or carries no valid ISBN-13 path segment.
 */
export function extractIsbn13FromOreillyUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  if (!OREILLY_HOST_RE.test(host)) return null;
  return findIsbn13Segment(parsed.pathname);
}

/** True when `url` is a recognizable O'Reilly product page carrying an ISBN-13. */
export function isOreillyProductUrl(url: string): boolean {
  return extractIsbn13FromOreillyUrl(url) !== null;
}
