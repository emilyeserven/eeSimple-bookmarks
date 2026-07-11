/**
 * Pure Amazon product-URL helpers shared by the API (`@eesimple/middleware`) and the React client.
 * No network access — just URL parsing plus the ISBN checksum math in `./isbn.js` — so an Amazon
 * ASIN can be recognized as a real ISBN without ever scraping the product page.
 */

import { isbn10ToIsbn13, isValidIsbn10, scrapeIsbnFromHtml } from "./isbn.js";

/** Amazon's real storefront TLDs — an explicit allowlist so `amazon.fake.com` doesn't match. */
const AMAZON_TLDS = [
  "com", "co.uk", "de", "fr", "it", "es", "ca", "co.jp", "in", "com.au",
  "com.br", "com.mx", "nl", "se", "pl", "eg", "sa", "ae", "sg", "com.tr", "cn",
];

/** Matches `amazon.<tld>`, optionally under one subdomain (e.g. `smile.amazon.com`). */
const AMAZON_HOST_RE = new RegExp(
  `^(?:[a-z0-9-]+\\.)?amazon\\.(?:${AMAZON_TLDS.map(t => t.replace(/\./g, "\\.")).join("|")})$`,
  "i",
);

/** ASINs are 10 uppercase-alnum characters. */
const ASIN_RE = /^[A-Z0-9]{10}$/i;

/**
 * Parse an Amazon product URL's ASIN from `/dp/{ASIN}` or `/gp/product/{ASIN}`, wherever they
 * appear in the path (e.g. `/Some-Title/dp/{ASIN}/ref=...`). Returns `null` when the URL isn't a
 * recognizable Amazon product page.
 */
export function parseAmazonProduct(url: string): { asin: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  if (!AMAZON_HOST_RE.test(host)) return null;

  const segments = parsed.pathname.split("/").filter(Boolean);
  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === "dp" && segments[i + 1] && ASIN_RE.test(segments[i + 1])) {
      return {
        asin: segments[i + 1].toUpperCase(),
      };
    }
    if (
      segments[i] === "gp"
      && segments[i + 1] === "product"
      && segments[i + 2]
      && ASIN_RE.test(segments[i + 2])
    ) {
      return {
        asin: segments[i + 2].toUpperCase(),
      };
    }
  }
  return null;
}

/** True when `url` is a recognizable Amazon product page. */
export function isAmazonProductUrl(url: string): boolean {
  return parseAmazonProduct(url) !== null;
}

/**
 * Extract a checksum-valid ISBN-13 from an Amazon product URL's ASIN, or `null` when the URL isn't
 * an Amazon product page, or its ASIN isn't a valid ISBN-10. Most ASINs — especially Kindle/newer
 * titles — are opaque catalog codes, not ISBNs; those are silently skipped, with no page-scrape
 * fallback, to stay consistent with this app's keyless-connector approach.
 */
export function extractIsbn13FromAmazonUrl(url: string): string | null {
  const parsed = parseAmazonProduct(url);
  if (!parsed) return null;
  if (!isValidIsbn10(parsed.asin)) return null;
  return isbn10ToIsbn13(parsed.asin);
}

/** Strip dashes/spaces from a candidate ISBN digit string. */
/**
 * Extract a checksum-valid ISBN-13 from an already-fetched Amazon product page, for the cases where
 * the ASIN itself isn't a valid ISBN-10 (e.g. a re-issued edition, or a regional listing whose ASIN
 * has drifted from the print ISBN) but the page still lists a real ISBN in its structured product
 * details. Checks, in order of reliability:
 *   1. A `schema.org/Book` JSON-LD block's `isbn` field.
 *   2. An "ISBN-13" row in the product-details bullets/table.
 *   3. An "ISBN-10" row, converted to ISBN-13.
 * Returns `null` when none of these yield a checksum-valid ISBN. No network access — the caller
 * fetches the page.
 */
export function extractAmazonIsbn(html: string): string | null {
  return scrapeIsbnFromHtml(
    html,
    /ISBN-13[^0-9]*([\d-]{10,17})/i,
    /ISBN-10[^0-9]*([\dXx-]{9,13})/i,
  );
}
