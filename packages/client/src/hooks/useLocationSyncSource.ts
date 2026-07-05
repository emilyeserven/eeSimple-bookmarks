import type { LocationDiffCurrent } from "../lib/syncSources/locationDiff";
import type { SyncProvider, SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { locationsApi } from "../lib/api/taxonomies";
import { buildLocationDiff } from "../lib/syncSources/locationDiff";

/** Reads a string ref, treating missing/blank/non-string as null. */
function strRef(refs: SyncProvider["refs"], key: string): string | null {
  const value = refs?.[key];
  return typeof value === "string" && value !== "" ? value : null;
}

/** Reads a numeric ref, treating missing/non-number as null. */
function numRef(refs: SyncProvider["refs"], key: string): number | null {
  const value = refs?.[key];
  return typeof value === "number" ? value : null;
}

/**
 * Re-geocodes a location by its name (Nominatim, or Wikidata when it's pinned to Wikidata
 * coordinates) via `GET /api/locations/lookup`, then diffs the first candidate against the location's
 * current values (passed through `provider.refs`). Only runs while the sync modal is open.
 */
export function useLocationSyncSource(provider: SyncProvider, enabled: boolean): SyncSourceFetch {
  const {
    t,
  } = useTranslation();
  const name = strRef(provider.refs, "name");
  const source = strRef(provider.refs, "source") === "wikidata" ? "wikidata" as const : undefined;

  const query = useQuery({
    queryKey: ["location-sync-lookup", provider.entityId, name, source],
    queryFn: () => locationsApi.lookup(name ?? "", source),
    enabled: enabled && name !== null,
    staleTime: 60_000,
  });

  if (query.isPending && enabled && name !== null) {
    return {
      diff: null,
      isLoading: true,
      error: null,
    };
  }
  if (query.isError) {
    return {
      diff: null,
      isLoading: false,
      error: t("Couldn't reach the geocoder. Try again in a moment."),
    };
  }

  const candidate = query.data?.results[0];
  if (!candidate) {
    return {
      diff: {
        groups: [],
      },
      isLoading: false,
      error: null,
    };
  }

  const current: LocationDiffCurrent = {
    latitude: numRef(provider.refs, "currentLatitude"),
    longitude: numRef(provider.refs, "currentLongitude"),
    mapUrl: strRef(provider.refs, "currentMapUrl"),
    placeType: strRef(provider.refs, "currentPlaceType"),
    countryCode: strRef(provider.refs, "currentCountryCode"),
  };

  return {
    diff: buildLocationDiff(candidate, current),
    isLoading: false,
    error: null,
  };
}
