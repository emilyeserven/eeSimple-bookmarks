import type { KavitaSeriesResult } from "@eesimple/types";

import { request } from "./client";

export const kavitaApi = {
  /** Search the connected Kavita server for series matching `q` (proxied — the key stays server-side). */
  searchSeries: (q: string) =>
    request<KavitaSeriesResult[]>(`/kavita/series?q=${encodeURIComponent(q)}`),
};
