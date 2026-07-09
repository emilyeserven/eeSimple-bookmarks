/**
 * Generic ISBN page-scrape helper shared by the API (`@eesimple/middleware`) and the React client.
 * This generalizes the site-specific `extractAmazonIsbn` (`./amazon.js`) / `extractHontoIsbn`
 * (`./honto.js`) extractors into one that reads an ISBN out of an arbitrary book page's HTML — used
 * by the per-website "Scan URL for ISBN" flag for sites with no dedicated connector. No network
 * access — the caller fetches the page.
 */

import { isbn10ToIsbn13, isValidIsbn10, isValidIsbn13 } from "./isbn.js";

/** Strip dashes/spaces from a candidate ISBN digit string. */
function cleanCandidate(value: string): string {
  return value.replace(/[\s-]/g, "");
}

/**
 * Extract a checksum-valid ISBN-13 from an already-fetched book page's HTML. Checks, in order of
 * reliability:
 *   1. A `schema.org/Book` (or any) JSON-LD block's `isbn` field.
 *   2. An "ISBN-13" / "ISBN13" label followed by the number (product-details bullets/table).
 *   3. An "ISBN-10" / "ISBN10" label, converted to ISBN-13.
 * The label regexes tolerate the dash-optional variants both Amazon (`ISBN-13`) and honto (`ISBN13`)
 * use. Returns `null` when none yield a checksum-valid ISBN. No network access.
 */
export function extractIsbnFromHtml(html: string): string | null {
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const isbnMatch = /"isbn"\s*:\s*"([\d\sXx-]+)"/.exec(match[1]);
    if (!isbnMatch) continue;
    const candidate = cleanCandidate(isbnMatch[1]);
    if (isValidIsbn13(candidate)) return candidate;
    if (isValidIsbn10(candidate)) return isbn10ToIsbn13(candidate);
  }

  const isbn13Match = /ISBN-?13[^0-9]*([\d-]{10,17})/i.exec(html);
  if (isbn13Match) {
    const candidate = cleanCandidate(isbn13Match[1]);
    if (isValidIsbn13(candidate)) return candidate;
  }

  const isbn10Match = /ISBN-?10[^0-9]*([\dXx-]{9,13})/i.exec(html);
  if (isbn10Match) {
    const candidate = cleanCandidate(isbn10Match[1]);
    if (isValidIsbn10(candidate)) return isbn10ToIsbn13(candidate);
  }

  return null;
}
