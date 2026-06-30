/**
 * OpenStreetMap Nominatim geocoder for the Locations taxonomy. Keyless by default — it queries the
 * public Nominatim instance, or a self-hosted one via `NOMINATIM_ENDPOINT`. No API key, no secrets;
 * the only thing that "leaves the box" is the search query, the same self-hostable ethos as the rest
 * of the metadata pipeline.
 *
 * Nominatim's usage policy requires a descriptive `User-Agent`; we send one and cap concurrency by
 * doing a single request per lookup. Results are mapped to the shared `LocationLookupResult`.
 *
 * This is the raw OSM path. `geocoding.ts` orchestrates it with the Wikidata fallback; keeping the
 * two in separate modules avoids an import cycle (the Wikidata connector calls `nominatimGeocode`
 * directly when composing a region's area from its constituents).
 */

import type {
  LocationBoundary,
  LocationLookupAncestor,
  LocationLookupCandidate,
  LocationLookupResult,
} from "@eesimple/types";

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
export function mapUrlFor(lat: number, lon: number): string {
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
  /** The full address hierarchy (requested via `addressdetails=1`): city/county/state/country/… */
  address?: Record<string, unknown> | null;
  /** Per-language name tags (requested via `namedetails=1`): `name` (local), `name:en`, … */
  namedetails?: Record<string, unknown> | null;
  /** GeoJSON geometry (requested via `polygon_geojson=1`); only area types are kept as a boundary. */
  geojson?: unknown;
}

/**
 * Nominatim `address` keys we treat as admin levels, ordered most-specific → least-specific. We walk
 * these in order to turn the flat address object into an ordered ancestor chain (immediate-parent
 * first). Keys not in this list (`country_code`, `ISO3166-2-lvl4`, `postcode`, road-level detail, …)
 * are ignored.
 */
const ADMIN_LEVEL_KEYS = [
  "neighbourhood",
  "suburb",
  "quarter",
  "city_district",
  "borough",
  "hamlet",
  "village",
  "town",
  "city",
  "municipality",
  "county",
  "state_district",
  "region",
  "province",
  "state",
  "country",
] as const;

/**
 * Turn a Nominatim `address` object into the candidate's higher-level ancestors, ordered
 * immediate-parent-first (e.g. 萩市 → [山口県, 日本]). Walks the admin-level keys most-specific →
 * least-specific, drops the level that is the place itself (and anything more specific than it), and
 * returns the rest. Each ancestor carries the address key as its loose `placeType` and shares the
 * candidate's `countryCode`. Duplicate names (a level repeated under two keys) are collapsed.
 */
function parseAncestors(
  address: Record<string, unknown> | null,
  leafName: string,
  countryCode: string | null,
): LocationLookupAncestor[] {
  if (!address) return [];
  const levels: { name: string;
    placeType: string; }[] = [];
  for (const key of ADMIN_LEVEL_KEYS) {
    const name = asString(address[key]);
    if (name === null) continue;
    levels.push({
      name,
      placeType: key,
    });
  }
  // Drop the place itself and everything more specific than it, so we keep only true ancestors.
  const leafIndex = levels.findIndex(level => level.name === leafName);
  const ancestors = leafIndex === -1 ? levels : levels.slice(leafIndex + 1);

  // Seed with the leaf so it is never emitted as its own ancestor, even if the index match missed.
  const seen = new Set<string>([leafName]);
  const result: LocationLookupAncestor[] = [];
  for (const level of ancestors) {
    if (seen.has(level.name)) continue;
    seen.add(level.name);
    result.push({
      name: level.name,
      placeType: level.placeType,
      countryCode,
      wikidataId: null,
    });
  }
  return result;
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
  const rawCountryCode = asString(raw.address?.country_code);
  const countryCode = rawCountryCode ? rawCountryCode.toUpperCase() : null;
  return {
    name,
    romanizedName,
    displayName,
    latitude,
    longitude,
    placeType: asString(raw.addresstype) ?? asString(raw.type),
    countryCode,
    mapUrl: mapUrlFor(latitude, longitude),
    boundary: toBoundary(raw.geojson),
    ancestors: parseAncestors(raw.address ?? null, name, countryCode),
    wikidataId: null,
  };
}

/**
 * Geocode a free-text place query against Nominatim only. Returns an empty result on a
 * transport/parse failure rather than throwing, so callers degrade gracefully. `geocodeLocation`
 * (in `geocoding.ts`) wraps it with the Wikidata fallback; the Wikidata connector calls *this* when
 * composing a region's area from its constituents, so that composition never re-enters the fallback.
 */
export async function nominatimGeocode(query: string): Promise<LocationLookupResult> {
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
