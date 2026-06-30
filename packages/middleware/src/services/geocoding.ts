/**
 * Locations geocoder entry point. Orchestrates the keyless Nominatim path (`nominatimGeocoding.ts`)
 * with the Wikidata fallback (`wikidataGeocoding.ts`): Nominatim first, Wikidata only when it returns
 * nothing — typically a traditional / informal / natural region with no admin boundary, e.g. 中国地方.
 *
 * Kept separate from `nominatimGeocoding.ts` so the dependency graph stays acyclic: this module
 * depends on both sources, and the Wikidata source depends only on the Nominatim source.
 */

import type { LocationBoundary } from "@eesimple/types";
import type { LocationLookupResult } from "@eesimple/types";
import { nominatimGeocode } from "@/services/nominatimGeocoding";
import { wikidataGeocode } from "@/services/wikidataGeocoding";

export { geocodingEnabled, geocodingEndpoint } from "@/services/nominatimGeocoding";

/** Geocoding source preference, mirroring the lookup route's `source` query param. */
export interface GeocodeOptions {
  /**
   * When `"wikidata"`, query Wikidata only — Nominatim is skipped entirely. Used for a location whose
   * `usesWikidataCoordinates` flag is set: its lat/long source of truth is Wikidata, so a coordinate
   * or area refresh must not pull a different result from Nominatim.
   */
  source?: "wikidata";
}

/**
 * Geocode a free-text place query (e.g. "Tokyo") to candidate locations. Tries Nominatim first; when
 * it returns nothing — typically a traditional / informal / natural region with no admin boundary,
 * e.g. 中国地方 (Chūgoku region) — falls back to Wikidata (`wikidataGeocode`), which carries those
 * places. The fallback maps to the same `LocationLookupResult`, so callers are unchanged. Pass
 * `{ source: "wikidata" }` to query Wikidata only (see {@link GeocodeOptions}).
 */
export async function geocodeLocation(query: string, options: GeocodeOptions = {}): Promise<LocationLookupResult> {
  const trimmed = query.trim();
  if (trimmed === "") return {
    results: [],
  };
  if (options.source === "wikidata") return wikidataGeocode(trimmed);
  const nominatim = await nominatimGeocode(trimmed);
  if (nominatim.results.length > 0) return nominatim;
  return wikidataGeocode(trimmed);
}

/**
 * Best-effort area outline for an already-stored location, used to backfill a `boundary` on demand
 * (one request, rate-limit friendly). Re-geocodes by name and, when a stored coordinate is known,
 * picks the candidate closest to it; otherwise the first candidate. Returns `null` when no area
 * geometry is available (the location stays a pin).
 */
export async function refreshLocationBoundary(
  name: string,
  lat: number | null,
  lon: number | null,
  options: GeocodeOptions = {},
): Promise<LocationBoundary | null> {
  const {
    results,
  } = await geocodeLocation(name, options);
  if (results.length === 0) return null;
  const withBoundary = results.filter(candidate => candidate.boundary !== null);
  const pool = withBoundary.length > 0 ? withBoundary : results;
  if (lat === null || lon === null) return pool[0]?.boundary ?? null;
  const closest = pool.reduce((best, candidate) => {
    const d = (candidate.latitude - lat) ** 2 + (candidate.longitude - lon) ** 2;
    return d < best.distance
      ? {
        distance: d,
        boundary: candidate.boundary,
      }
      : best;
  }, {
    distance: Number.POSITIVE_INFINITY,
    boundary: null as LocationBoundary | null,
  });
  return closest.boundary;
}
