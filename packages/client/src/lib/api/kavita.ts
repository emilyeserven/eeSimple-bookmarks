import type { KavitaSeriesDetail, KavitaSeriesResult, KavitaTocResult } from "@eesimple/types";

import { request } from "./client";

export const kavitaApi = {
  /** Search the connected Kavita server for series matching `q` (proxied — the key stays server-side). */
  searchSeries: (q: string) =>
    request<KavitaSeriesResult[]>(`/kavita/series?q=${encodeURIComponent(q)}`),
  /** Fetch a linked series' table of contents (EPUB via Kavita's API, PDF via its embedded outline). */
  getToc: (seriesId: number) =>
    request<KavitaTocResult>(`/kavita/toc?seriesId=${seriesId}`),
  /** Fetch a linked series' current live name/release year, to flag drift against the local Book. */
  getSeriesDetail: (seriesId: number) =>
    request<KavitaSeriesDetail>(`/kavita/series/${seriesId}`),
};
