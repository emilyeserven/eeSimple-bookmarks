import type { SyncProvider, SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";

/**
 * Re-geocodes a location (Nominatim, or Wikidata when it uses Wikidata coordinates) and builds the
 * geocoding sync diff. Implemented in the location-sync-provider phase.
 */
export function useLocationSyncSource(_provider: SyncProvider, _enabled: boolean): SyncSourceFetch {
  return {
    diff: null,
    isLoading: false,
    error: null,
  };
}
