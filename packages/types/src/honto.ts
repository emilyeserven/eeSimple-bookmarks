/**
 * Pure honto.jp product-URL helpers shared by the API (`@eesimple/middleware`) and the React
 * client. Unlike Amazon's ASIN, honto.jp product URLs don't encode an ISBN — every honto.jp lookup
 * needs the product page's own structured details, so this module only recognizes product URLs and
 * scrapes an already-fetched page; there is no pure URL→ISBN path.
 */

import { isbn10ToIsbn13, isValidIsbn10, isValidIsbn13 } from "./isbn.js";

/** Matches `honto.jp`, optionally under one subdomain (e.g. `www.honto.jp`). */
const HONTO_HOST_RE = /^(?:[a-z0-9-]+\.)?honto\.jp$/i;

/** honto.jp product pages live at `/netstore/pd-<slug>.html`. */
const HONTO_PRODUCT_PATH_RE = /^\/netstore\/pd-/i;

/** True when `url` is a recognizable honto.jp product page. */
export function isHontoProductUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return false;
  }
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  if (!HONTO_HOST_RE.test(host)) return false;
  return HONTO_PRODUCT_PATH_RE.test(parsed.pathname);
}

/** Strip dashes/spaces from a candidate ISBN digit string. */
function cleanCandidate(value: string): string {
  return value.replace(/[\s-]/g, "");
}

/**
 * Extract a checksum-valid ISBN-13 from an already-fetched honto.jp product page. Checks, in order
 * of reliability:
 *   1. A `schema.org/Book` JSON-LD block's `isbn` field.
 *   2. An "ISBN13" row in the product-details table.
 *   3. An "ISBN10" row, converted to ISBN-13.
 * Returns `null` when none of these yield a checksum-valid ISBN. No network access — the caller
 * fetches the page.
 */
export function extractHontoIsbn(html: string): string | null {
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const isbnMatch = /"isbn"\s*:\s*"([\d\sXx-]+)"/.exec(match[1]);
    if (!isbnMatch) continue;
    const candidate = cleanCandidate(isbnMatch[1]);
    if (isValidIsbn13(candidate)) return candidate;
    if (isValidIsbn10(candidate)) return isbn10ToIsbn13(candidate);
  }

  const isbn13Match = /ISBN13[^0-9]*([\d-]{10,17})/i.exec(html);
  if (isbn13Match) {
    const candidate = cleanCandidate(isbn13Match[1]);
    if (isValidIsbn13(candidate)) return candidate;
  }

  const isbn10Match = /ISBN10[^0-9]*([\dXx-]{9,13})/i.exec(html);
  if (isbn10Match) {
    const candidate = cleanCandidate(isbn10Match[1]);
    if (isValidIsbn10(candidate)) return isbn10ToIsbn13(candidate);
  }

  return null;
}
