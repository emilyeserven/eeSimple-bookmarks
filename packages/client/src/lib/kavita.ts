/**
 * Link-out URL builder and ToC mapping for the Kavita connector. A linked bookmark stores the
 * series and library ids, and the deep link opens the series page in Kavita's web UI. No token is
 * sent; the user's browser opens this against their own Kavita instance.
 */

import type { KavitaTocResult, SectionEntry } from "@eesimple/types";

import { randomId } from "./utils";

/** Kavita web-UI series page for a linked bookmark. */
export function kavitaSeriesUrl(baseUrl: string, libraryId: number, seriesId: number): string {
  return `${baseUrl.replace(/\/$/, "")}/library/${libraryId}/series/${seriesId}`;
}

/**
 * Map an imported Kavita table of contents to Page Sections entries. Each ToC entry becomes a
 * `page`-typed section starting at its page; the end page is derived from the next entry's start
 * (clamped so end ≥ start when consecutive entries share a page), and the last entry ends at the
 * book's total page count when known.
 */
export function kavitaTocToSections(toc: KavitaTocResult): SectionEntry[] {
  return toc.entries.map((entry, index) => {
    const next = toc.entries[index + 1];
    let endValue: string | undefined;
    if (next) {
      endValue = String(Math.max(entry.page, next.page - 1));
    }
    else if (toc.pages !== null && toc.pages >= entry.page) {
      endValue = String(toc.pages);
    }
    return {
      id: randomId(),
      name: entry.title,
      type: "page",
      startValue: String(entry.page),
      ...(endValue !== undefined && {
        endValue,
      }),
    };
  });
}
