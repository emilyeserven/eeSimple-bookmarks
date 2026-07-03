import type { SyncProvider, SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";

/**
 * Fetches the source image preview for an image-only taxonomy (YouTube channel avatar, website
 * favicon, person avatar, Plex media poster) and builds a single image-diff row. Implemented in the
 * image-only-taxonomy-sync-provider phase.
 */
export function useImageOnlyTaxonomySyncSource(_provider: SyncProvider, _enabled: boolean): SyncSourceFetch {
  return {
    diff: null,
    isLoading: false,
    error: null,
  };
}
