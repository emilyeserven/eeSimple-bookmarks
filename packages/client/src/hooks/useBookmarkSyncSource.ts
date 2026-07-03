import type { SyncProvider, SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";

/**
 * Fetches fresh values for a bookmark from its outside sources (URL metadata scan + linked Kavita /
 * Plex) and builds the sync diff. Implemented in the bookmark-sync-provider phase.
 */
export function useBookmarkSyncSource(_provider: SyncProvider, _enabled: boolean): SyncSourceFetch {
  return {
    diff: null,
    isLoading: false,
    error: null,
  };
}
