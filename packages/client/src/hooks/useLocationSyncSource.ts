import type { LocationDiffCurrent } from "../lib/syncSources/locationDiff";
import type { SyncProvider, SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";
import type { LocationLookupResult } from "@eesimple/types";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { locationsApi } from "../lib/api/taxonomies";
import { buildLocationDiff } from "../lib/syncSources/locationDiff";
import { numRef, resolveSyncSourceFetch, strRef } from "../lib/syncSources/syncSourceQuery";

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

  const current: LocationDiffCurrent = {
    latitude: numRef(provider.refs, "currentLatitude"),
    longitude: numRef(provider.refs, "currentLongitude"),
    mapUrl: strRef(provider.refs, "currentMapUrl"),
    placeType: strRef(provider.refs, "currentPlaceType"),
    countryCode: strRef(provider.refs, "currentCountryCode"),
  };

  return resolveSyncSourceFetch([
    {
      active: enabled && name !== null,
      isPending: query.isPending,
      isError: query.isError,
      data: query.data,
      errorMessage: t("Couldn't reach the geocoder. Try again in a moment."),
      buildGroups: (data: LocationLookupResult) => {
        const candidate = data.results[0];
        if (!candidate) return [];
        return buildLocationDiff(candidate, current).groups;
      },
    },
  ]);
}
