/**
 * Pure honto.jp product-URL helpers shared by the API (`@eesimple/middleware`) and the React
 * client. Unlike Amazon's ASIN, honto.jp product URLs don't encode an ISBN — every honto.jp lookup
 * needs the product page's own structured details, so this module only recognizes product URLs and
 * scrapes an already-fetched page; there is no pure URL→ISBN path.
 */

import { scrapeIsbnFromHtml } from "./isbn.js";

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
  return scrapeIsbnFromHtml(
    html,
    /ISBN13[^0-9]*([\d-]{10,17})/i,
    /ISBN10[^0-9]*([\dXx-]{9,13})/i,
  );
}
