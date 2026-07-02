import type { KavitaSeriesResult, KavitaTocResult } from "@eesimple/types";

import { request } from "./client";

export const kavitaApi = {
  /** Search the connected Kavita server for series matching `q` (proxied — the key stays server-side). */
  searchSeries: (q: string) =>
    request<KavitaSeriesResult[]>(`/kavita/series?q=${encodeURIComponent(q)}`),
  /** Fetch a linked series' table of contents (EPUB via Kavita's API, PDF via its embedded outline). */
  getToc: (seriesId: number) =>
    request<KavitaTocResult>(`/kavita/toc?seriesId=${seriesId}`),
};
