/**
 * Geocoding connector for the Locations taxonomy. Keyless by default — it queries OpenStreetMap
 * Nominatim (the public instance, or a self-hosted one via `NOMINATIM_ENDPOINT`). No API key, no
 * secrets; the only thing that "leaves the box" is the search query, the same self-hostable ethos
 * as the rest of the metadata pipeline.
 *
 * Nominatim's usage policy requires a descriptive `User-Agent`; we send one and cap concurrency by
 * doing a single request per lookup. Results are mapped to the shared `LocationLookupResult`.
 */

import type { LocationLookupCandidate, LocationLookupResult } from "@eesimple/types";

const DEFAULT_ENDPOINT = "https://nominatim.openstreetmap.org";
const GEOCODE_TIMEOUT_MS = 10000;
const USER_AGENT = "eeSimple-bookmarks/1.0 (location taxonomy geocoding)";

/** The Nominatim base URL in use (a self-hosted instance when `NOMINATIM_ENDPOINT` is set). */
export function geocodingEndpoint(): string {
  return (process.env.NOMINATIM_ENDPOINT ?? DEFAULT_ENDPOINT).replace(/\/+$/, "");
}

/** Geocoding is always available (keyless). Kept as a function to mirror the other connectors. */
export function geocodingEnabled(): boolean {
  return true;
}

/** Build a Google Maps link for a coordinate. */
function mapUrlFor(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

/** A subset of the Nominatim `/search` response we consume. */
interface NominatimResult {
  display_name?: unknown;
  name?: unknown;
  lat?: unknown;
  lon?: unknown;
  type?: unknown;
  addresstype?: unknown;
  address?: { country_code?: unknown } | null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function toCandidate(raw: NominatimResult): LocationLookupCandidate | null {
  const latStr = asString(raw.lat);
  const lonStr = asString(raw.lon);
  if (latStr === null || lonStr === null) return null;
  const latitude = Number(latStr);
  const longitude = Number(lonStr);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const displayName = asString(raw.display_name) ?? asString(raw.name) ?? "";
  const name = asString(raw.name) ?? displayName.split(",")[0]?.trim() ?? displayName;
  const countryCode = asString(raw.address?.country_code);
  return {
    name,
    displayName,
    latitude,
    longitude,
    placeType: asString(raw.addresstype) ?? asString(raw.type),
    countryCode: countryCode ? countryCode.toUpperCase() : null,
    mapUrl: mapUrlFor(latitude, longitude),
  };
}

/**
 * Geocode a free-text place query (e.g. "Tokyo") to a list of candidate locations. Returns an empty
 * result on a transport/parse failure rather than throwing, so the form lookup degrades gracefully.
 */
export async function geocodeLocation(query: string): Promise<LocationLookupResult> {
  const trimmed = query.trim();
  if (trimmed === "") return {
    results: [],
  };

  const url = new URL(`${geocodingEndpoint()}/search`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    if (!response.ok) return {
      results: [],
    };
    const body = (await response.json()) as unknown;
    if (!Array.isArray(body)) return {
      results: [],
    };
    const results = body
      .map(item => toCandidate(item as NominatimResult))
      .filter((candidate): candidate is LocationLookupCandidate => candidate !== null);
    return {
      results,
    };
  }
  catch {
    return {
      results: [],
    };
  }
  finally {
    clearTimeout(timer);
  }
}
