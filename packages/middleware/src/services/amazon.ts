/**
 * Amazon product-page ISBN discovery. The common case — the ASIN itself is a valid ISBN-10 — is
 * handled purely (no network) by `extractIsbn13FromAmazonUrl` in `@eesimple/types`. This module
 * covers the remaining case: the ASIN isn't a valid ISBN-10, but the product page's own structured
 * details (JSON-LD, or the "ISBN-13"/"ISBN-10" bullets) still list a real ISBN. Fetches only the
 * page's ISBN, never title/author/cover — those keep coming from the existing keyless ISBN chain
 * (Open Library / Google Books) once the ISBN is in hand.
 */

import { extractAmazonIsbn, isAmazonProductUrl } from "@eesimple/types";
import { fetchBodyHtmlResult } from "@/services/metadata";

/**
 * Fetch an Amazon product page and extract its ISBN-13, or `null` when the URL isn't a recognizable
 * Amazon product page, the fetch fails, or no ISBN is found. Stops reading as soon as the ISBN data
 * is in hand (JSON-LD `isbn` field or an `ISBN-13` bullet), or at the end of the body / byte cap.
 */
export async function fetchAmazonIsbnFromPage(url: string): Promise<string | null> {
  if (!isAmazonProductUrl(url)) return null;
  const result = await fetchBodyHtmlResult(url, /"isbn"|ISBN-13|<\/body>/i);
  if (result.kind !== "ok") return null;
  return extractAmazonIsbn(result.html);
}
