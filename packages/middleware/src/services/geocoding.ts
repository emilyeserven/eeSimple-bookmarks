/**
 * Geocoding connector for the Locations taxonomy. Keyless by default — it queries OpenStreetMap
 * Nominatim (the public instance, or a self-hosted one via `NOMINATIM_ENDPOINT`). No API key, no
 * secrets; the only thing that "leaves the box" is the search query, the same self-hostable ethos
 * as the rest of the metadata pipeline.
 *
 * Nominatim's usage policy requires a descriptive `User-Agent`; we send one and cap concurrency by
 * doing a single request per lookup. Results are mapped to the shared `LocationLookupResult`.
 */

import type { LocationBoundary, LocationLookupCandidate, LocationLookupResult } from "@eesimple/types";

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
  /** Per-language name tags (requested via `namedetails=1`): `name` (local), `name:en`, … */
  namedetails?: Record<string, unknown> | null;
  /** GeoJSON geometry (requested via `polygon_geojson=1`); only area types are kept as a boundary. */
  geojson?: unknown;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/**
 * Keep a Nominatim `geojson` value only when it is an area outline (Polygon / MultiPolygon). A
 * `Point` geojson is just the coordinate we already store, so it is discarded (→ pin rendering).
 */
function toBoundary(geojson: unknown): LocationBoundary | null {
  if (geojson === null || typeof geojson !== "object") return null;
  const geometry = geojson as { type?: unknown;
    coordinates?: unknown; };
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") return null;
  if (!Array.isArray(geometry.coordinates)) return null;
  return {
    type: geometry.type,
    coordinates: geometry.coordinates as LocationBoundary["coordinates"],
  };
}

/**
 * Resolve a candidate's title + romanized form, preferring the LOCAL/native-script name as the title
 * (`萩市`) and relegating the English/romanized form to `romanizedName` (`Hagi`). The local name comes
 * from the `name` namedetail (the OSM `name` tag), and the English form from `name:en`. When the
 * place's own name is already Latin (no separate English variant, or it equals the title), there is
 * no separate romanization.
 */
function resolveNames(raw: NominatimResult, displayName: string): { name: string;
  romanizedName: string | null; } {
  const details = raw.namedetails ?? null;
  const localName = asString(details?.name);
  const englishName = asString(details?.["name:en"]);
  const name = localName ?? asString(raw.name) ?? displayName.split(",")[0]?.trim() ?? displayName;
  const romanizedName = englishName && englishName !== name ? englishName : null;
  return {
    name,
    romanizedName,
  };
}

function toCandidate(raw: NominatimResult): LocationLookupCandidate | null {
  const latStr = asString(raw.lat);
  const lonStr = asString(raw.lon);
  if (latStr === null || lonStr === null) return null;
  const latitude = Number(latStr);
  const longitude = Number(lonStr);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const displayName = asString(raw.display_name) ?? asString(raw.name) ?? "";
  const {
    name, romanizedName,
  } = resolveNames(raw, displayName);
  const countryCode = asString(raw.address?.country_code);
  return {
    name,
    romanizedName,
    displayName,
    latitude,
    longitude,
    placeType: asString(raw.addresstype) ?? asString(raw.type),
    countryCode: countryCode ? countryCode.toUpperCase() : null,
    mapUrl: mapUrlFor(latitude, longitude),
    boundary: toBoundary(raw.geojson),
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
  // Per-language name tags so we can prefer the local name as the title and the English name as the
  // romanized form (e.g. 萩市 / Hagi) instead of whatever single localized name `display_name` carries.
  url.searchParams.set("namedetails", "1");
  // Request the area outline so locations can render as polygons, not just pins. `polygon_threshold`
  // simplifies the geometry (Douglas–Peucker, degrees) to keep payloads modest — tunable.
  url.searchParams.set("polygon_geojson", "1");
  url.searchParams.set("polygon_threshold", "0.005");
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
): Promise<LocationBoundary | null> {
  const {
    results,
  } = await geocodeLocation(name);
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
