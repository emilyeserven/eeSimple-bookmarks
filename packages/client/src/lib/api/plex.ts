import type { PlexItemResult } from "@eesimple/types";

import { request } from "./client";

export const plexApi = {
  /** Search the connected Plex server for items matching `q` (proxied — the token stays server-side). */
  searchItems: (q: string) =>
    request<PlexItemResult[]>(`/plex/search?q=${encodeURIComponent(q)}`),
};
