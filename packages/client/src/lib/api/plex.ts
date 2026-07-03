import type { PlexItemResult } from "@eesimple/types";

import { request } from "./client";

export const plexApi = {
  /**
   * Search the connected Plex server for items matching `q` (proxied — the token stays server-side).
   * An optional `kind` narrows the results to movies or TV shows (Movies / TV Shows taxonomy lookups).
   */
  searchItems: (q: string, kind?: "movie" | "show") =>
    request<PlexItemResult[]>(
      `/plex/search?q=${encodeURIComponent(q)}${kind ? `&kind=${kind}` : ""}`,
    ),
};
