/**
 * Generic book-page ISBN discovery. For a site the user has opted into via the website
 * "Scan URL for ISBN" flag that isn't one of the dedicated connectors (Amazon / honto.jp / O'Reilly),
 * this fetches the page and reads an ISBN out of its structured details (JSON-LD or an ISBN-13/10
 * label), using the shared `extractIsbnFromHtml`. Fetches only the page's ISBN, never
 * title/author/cover — those keep coming from the keyless ISBN chain (Open Library / Google Books)
 * once the ISBN is in hand.
 */

import { extractIsbnFromHtml } from "@eesimple/types";
import { fetchBodyHtmlResult } from "@/services/metadata";

/**
 * Fetch a book page and extract its ISBN-13, or `null` when the fetch fails or no ISBN is found.
 * Stops reading as soon as the ISBN data is in hand (a JSON-LD `isbn` field or an `ISBN-13`/`ISBN13`
 * label), or at the end of the body / byte cap.
 */
export async function fetchIsbnFromPage(url: string): Promise<string | null> {
  const result = await fetchBodyHtmlResult(url, /"isbn"|ISBN-?1[03]|<\/body>/i);
  if (result.kind !== "ok") return null;
  return extractIsbnFromHtml(result.html);
}
