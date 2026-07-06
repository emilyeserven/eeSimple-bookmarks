/**
 * honto.jp product-page ISBN discovery. Unlike Amazon's ASIN, honto.jp product URLs don't encode an
 * ISBN, so every lookup reads the product page's own structured details (JSON-LD, or the
 * "ISBN13"/"ISBN10" table row). Fetches only the page's ISBN, never title/author/cover — those keep
 * coming from the existing keyless ISBN chain (Open Library / Google Books) once the ISBN is in hand.
 */

import { extractHontoIsbn, isHontoProductUrl } from "@eesimple/types";
import { fetchBodyHtmlResult } from "@/services/metadata";

/**
 * Fetch a honto.jp product page and extract its ISBN-13, or `null` when the URL isn't a
 * recognizable honto.jp product page, the fetch fails, or no ISBN is found. Stops reading as soon
 * as the ISBN data is in hand (JSON-LD `isbn` field or an `ISBN13` row), or at the end of the body /
 * byte cap.
 */
export async function fetchHontoIsbnFromPage(url: string): Promise<string | null> {
  if (!isHontoProductUrl(url)) return null;
  const result = await fetchBodyHtmlResult(url, /"isbn"|ISBN13|<\/body>/i);
  if (result.kind !== "ok") return null;
  return extractHontoIsbn(result.html);
}
