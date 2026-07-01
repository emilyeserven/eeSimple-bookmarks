/**
 * Link-out URL builder for the Kavita connector. A linked bookmark stores the series and library
 * ids, and the deep link opens the series page in Kavita's web UI. No token is sent; the user's
 * browser opens this against their own Kavita instance.
 */

/** Kavita web-UI series page for a linked bookmark. */
export function kavitaSeriesUrl(baseUrl: string, libraryId: number, seriesId: number): string {
  return `${baseUrl.replace(/\/$/, "")}/library/${libraryId}/series/${seriesId}`;
}
