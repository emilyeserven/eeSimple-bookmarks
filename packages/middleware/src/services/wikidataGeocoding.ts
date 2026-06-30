/**
 * Wikidata fallback for the Locations geocoder. When Nominatim returns nothing — typically a
 * traditional / informal / natural region with no administrative boundary, e.g. 中国地方 (Chūgoku
 * region) — Wikidata still carries the place with a coordinate (`P625`), country (`P17`),
 * administrative parent (`P131`) and, for regions, its constituent units (`P150`).
 *
 * Keyless and self-hostable, mirroring the Nominatim connector: the only thing that "leaves the box"
 * is the search query, and the endpoint is overridable (`WIKIDATA_ENDPOINT` /
 * `WIKIMEDIA_MAPS_ENDPOINT`). Every call degrades gracefully — any transport/parse failure resolves
 * to an empty result rather than throwing, so the form lookup never breaks.
 *
 * Area outlines: Wikidata stores only a point, so a region's `boundary` is resolved two ways, in
 * order — (1) a *linked* outline via Wikimedia's Kartographer geoshape service when the item links to
 * an OSM relation (`P402`) or a Commons geoshape (`P3896`); (2) failing that, *composed* from the
 * item's `P150` constituents (each a real admin unit Nominatim can outline), dissolved into one clean
 * outline with turf `union`. Only the top candidate's boundary is resolved, to keep the lookup fast
 * and Nominatim-friendly; the "Re-geocode" / boundary-backfill path fills a later pick on demand.
 */

import { featureCollection, multiPolygon, polygon } from "@turf/helpers";
import union from "@turf/union";
import type {
  LocationBoundary,
  LocationLookupAncestor,
  LocationLookupCandidate,
  LocationLookupResult,
} from "@eesimple/types";
import { mapUrlFor, nominatimGeocode } from "@/services/nominatimGeocoding";

const DEFAULT_ENDPOINT = "https://www.wikidata.org";
const DEFAULT_MAPS_ENDPOINT = "https://maps.wikimedia.org";
const WIKIDATA_TIMEOUT_MS = 10000;
const USER_AGENT = "eeSimple-bookmarks/1.0 (location taxonomy geocoding)";
/** Cap on constituents geocoded when composing a region's area, to stay Nominatim-rate-limit-friendly. */
const MAX_CONSTITUENTS = 12;

/** The Wikidata base URL in use (a self-hosted Wikibase when `WIKIDATA_ENDPOINT` is set). */
export function wikidataEndpoint(): string {
  return (process.env.WIKIDATA_ENDPOINT ?? DEFAULT_ENDPOINT).replace(/\/+$/, "");
}

/** The Kartographer geoshape base URL (overridable via `WIKIMEDIA_MAPS_ENDPOINT`). */
export function wikimediaMapsEndpoint(): string {
  return (process.env.WIKIMEDIA_MAPS_ENDPOINT ?? DEFAULT_MAPS_ENDPOINT).replace(/\/+$/, "");
}

/** The Wikidata fallback is always available (keyless). Kept as a function to mirror the connectors. */
export function wikidataEnabled(): boolean {
  return true;
}

// --- Wikidata Action API response shapes (only the fields we read) -------------------------------

interface SearchResult {
  id?: unknown;
}

interface WikidataSnakValue {
  id?: unknown;
  latitude?: unknown;
  longitude?: unknown;
}

interface WikidataClaim {
  mainsnak?: {
    datavalue?: { value?: unknown };
  };
}

interface WikidataEntity {
  labels?: Record<string, { value?: unknown } | undefined>;
  claims?: Record<string, WikidataClaim[] | undefined>;
}

// --- Small fetch + claim helpers -----------------------------------------------------------------

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** Fetch + parse JSON with a timeout and a descriptive User-Agent; `null` on any failure. */
async function fetchJson(url: URL): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WIKIDATA_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  }
  catch {
    return null;
  }
  finally {
    clearTimeout(timer);
  }
}

/** Detect whether a query is in Japanese (CJK / kana) so we ask Wikidata in the right language. */
function detectLanguage(query: string): string {
  return /[぀-ヿ㐀-鿿豈-﫿]/.test(query) ? "ja" : "en";
}

/** The `value` of an entity's first claim for a property, or `null`. */
function firstClaimValue(entity: WikidataEntity, property: string): unknown {
  return entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value ?? null;
}

/** The entity ids (`Q…`) referenced by an entity's claims for a property (e.g. P131, P150). */
function claimEntityIds(entity: WikidataEntity, property: string): string[] {
  const claims = entity.claims?.[property] ?? [];
  const ids: string[] = [];
  for (const claim of claims) {
    const value = claim.mainsnak?.datavalue?.value as WikidataSnakValue | undefined;
    const id = asString(value?.id);
    if (id !== null) ids.push(id);
  }
  return ids;
}

/** A `{ ja, en }` label pair for an entity (either may be `null`). */
function entityLabels(entity: WikidataEntity | undefined): { ja: string | null;
  en: string | null; } {
  return {
    ja: asString(entity?.labels?.ja?.value),
    en: asString(entity?.labels?.en?.value),
  };
}

/** The preferred display name for an entity: local (ja) first, then en. */
function preferredName(entity: WikidataEntity | undefined): string | null {
  const {
    ja, en,
  } = entityLabels(entity);
  return ja ?? en;
}

/**
 * A loose place classification (e.g. `"region of Japan"`), preferring the English label since it
 * reads more like Nominatim's `placeType` than the native one would.
 */
function classificationName(entity: WikidataEntity | undefined): string | null {
  const {
    ja, en,
  } = entityLabels(entity);
  return en ?? ja;
}

// --- Boundary resolution -------------------------------------------------------------------------

/** Coerce an arbitrary GeoJSON geometry to a `LocationBoundary`, keeping only area geometries. */
function toBoundary(geometry: unknown): LocationBoundary | null {
  if (geometry === null || typeof geometry !== "object") return null;
  const geo = geometry as { type?: unknown;
    coordinates?: unknown; };
  if (geo.type !== "Polygon" && geo.type !== "MultiPolygon") return null;
  if (!Array.isArray(geo.coordinates)) return null;
  return {
    type: geo.type,
    coordinates: geo.coordinates as LocationBoundary["coordinates"],
  };
}

/** Dissolve a set of area boundaries into one outline with turf `union`; the first on any failure. */
function unionBoundaries(boundaries: LocationBoundary[]): LocationBoundary | null {
  if (boundaries.length === 0) return null;
  if (boundaries.length === 1) return boundaries[0] ?? null;
  try {
    const polygons = boundaries.map(b => b.type === "Polygon"
      ? polygon(b.coordinates as number[][][])
      : multiPolygon(b.coordinates as number[][][][]));
    // Pin the collection's element type to the MultiPolygon feature so the mixed array unifies;
    // turf `union` accepts a FeatureCollection of either polygon kind and handles both at runtime.
    const merged = union(featureCollection(polygons as ReturnType<typeof multiPolygon>[]));
    return merged ? toBoundary(merged.geometry) : (boundaries[0] ?? null);
  }
  catch {
    return boundaries[0] ?? null;
  }
}

/** Pull the area outline from the Kartographer geoshape service for an OSM-relation/geoshape-linked item. */
async function geoshapeBoundary(qid: string): Promise<LocationBoundary | null> {
  const url = new URL(`${wikimediaMapsEndpoint()}/geoshape`);
  url.searchParams.set("getgeojson", "1");
  url.searchParams.set("ids", qid);
  const body = await fetchJson(url);
  const features = (body as { features?: unknown })?.features;
  if (!Array.isArray(features)) return null;
  const boundaries = features
    .map(f => toBoundary((f as { geometry?: unknown })?.geometry))
    .filter((b): b is LocationBoundary => b !== null);
  return unionBoundaries(boundaries);
}

/** Compose a region's area by outlining each `P150` constituent via Nominatim and dissolving them. */
async function composeBoundary(
  constituentIds: string[],
  labels: Map<string, WikidataEntity>,
): Promise<LocationBoundary | null> {
  const boundaries: LocationBoundary[] = [];
  for (const id of constituentIds.slice(0, MAX_CONSTITUENTS)) {
    const name = preferredName(labels.get(id));
    if (name === null) continue;
    const {
      results,
    } = await nominatimGeocode(name);
    const boundary = results.find(r => r.boundary !== null)?.boundary ?? null;
    if (boundary !== null) boundaries.push(boundary);
  }
  return unionBoundaries(boundaries);
}

/**
 * Resolve a candidate's area: linked outline first (P402 OSM relation / P3896 geoshape via
 * Kartographer), else composed from P150 constituents. `null` when neither yields an outline (pin).
 */
async function resolveBoundary(
  qid: string,
  entity: WikidataEntity,
  labels: Map<string, WikidataEntity>,
): Promise<LocationBoundary | null> {
  const hasLinkedOutline = firstClaimValue(entity, "P402") !== null
    || firstClaimValue(entity, "P3896") !== null;
  if (hasLinkedOutline) {
    const linked = await geoshapeBoundary(qid);
    if (linked !== null) return linked;
  }
  return composeBoundary(claimEntityIds(entity, "P150"), labels);
}

// --- Candidate assembly --------------------------------------------------------------------------

interface ParsedCoordinate {
  latitude: number;
  longitude: number;
}

/** Parse a `P625` globe-coordinate claim to finite lat/lng, or `null`. */
function parseCoordinate(entity: WikidataEntity): ParsedCoordinate | null {
  const value = firstClaimValue(entity, "P625") as WikidataSnakValue | null;
  if (value === null || typeof value !== "object") return null;
  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    latitude,
    longitude,
  };
}

/** Resolve the candidate's country code from its `P17` country's `P297` (ISO 3166-1 alpha-2). */
function resolveCountryCode(entity: WikidataEntity, labels: Map<string, WikidataEntity>): string | null {
  const countryId = claimEntityIds(entity, "P17")[0];
  if (countryId === undefined) return null;
  const iso = asString(firstClaimValue(labels.get(countryId) ?? {}, "P297"));
  return iso ? iso.toUpperCase() : null;
}

/**
 * Build the ancestor chain immediate-parent-first: the `P131` administrative parent(s) then the
 * `P17` country, each carrying the shared country code — mirroring Nominatim's `…, 山口県, 日本`.
 */
function buildAncestors(
  entity: WikidataEntity,
  labels: Map<string, WikidataEntity>,
  countryCode: string | null,
): LocationLookupAncestor[] {
  const ids = [...claimEntityIds(entity, "P131"), ...claimEntityIds(entity, "P17")];
  const seen = new Set<string>();
  const ancestors: LocationLookupAncestor[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const name = preferredName(labels.get(id));
    if (name === null) continue;
    const typeId = claimEntityIds(labels.get(id) ?? {}, "P31")[0];
    ancestors.push({
      name,
      placeType: typeId ? classificationName(labels.get(typeId)) : null,
      countryCode,
    });
  }
  return ancestors;
}

/** Assemble a `LocationLookupCandidate` from a hydrated entity (boundary resolved separately). */
function buildCandidate(
  entity: WikidataEntity,
  coordinate: ParsedCoordinate,
  labels: Map<string, WikidataEntity>,
  boundary: LocationBoundary | null,
): LocationLookupCandidate {
  const {
    ja, en,
  } = entityLabels(entity);
  const name = ja ?? en ?? "";
  const romanizedName = en && en !== name ? en : null;
  const countryCode = resolveCountryCode(entity, labels);
  const ancestors = buildAncestors(entity, labels, countryCode);
  const placeTypeId = claimEntityIds(entity, "P31")[0];
  const displayName = [name, ...ancestors.map(a => a.name)].join(", ");
  return {
    name,
    romanizedName,
    displayName,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    placeType: placeTypeId ? classificationName(labels.get(placeTypeId)) : null,
    countryCode,
    mapUrl: mapUrlFor(coordinate.latitude, coordinate.longitude),
    boundary,
    ancestors,
  };
}

// --- API calls -----------------------------------------------------------------------------------

/** Search Wikidata for items matching a free-text query, returning up to `limit` entity ids. */
async function searchEntities(query: string, limit: number): Promise<string[]> {
  const language = detectLanguage(query);
  const url = new URL(`${wikidataEndpoint()}/w/api.php`);
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("search", query);
  url.searchParams.set("language", language);
  url.searchParams.set("uselang", language);
  url.searchParams.set("type", "item");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("format", "json");
  const body = await fetchJson(url);
  const results = (body as { search?: unknown })?.search;
  if (!Array.isArray(results)) return [];
  return results
    .map(r => asString((r as SearchResult).id))
    .filter((id): id is string => id !== null);
}

/** Hydrate a batch of entity ids with their labels (ja/en) and claims. */
async function getEntities(ids: string[]): Promise<Map<string, WikidataEntity>> {
  const map = new Map<string, WikidataEntity>();
  if (ids.length === 0) return map;
  const url = new URL(`${wikidataEndpoint()}/w/api.php`);
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("ids", ids.join("|"));
  url.searchParams.set("props", "labels|claims");
  url.searchParams.set("languages", "ja|en");
  url.searchParams.set("format", "json");
  const body = await fetchJson(url);
  const entities = (body as { entities?: Record<string, unknown> })?.entities;
  if (entities === undefined || entities === null) return map;
  for (const [id, entity] of Object.entries(entities)) {
    if (entity !== null && typeof entity === "object") map.set(id, entity as WikidataEntity);
  }
  return map;
}

/**
 * Geocode a free-text place query via Wikidata. Returns up to 5 candidates; the top candidate's area
 * outline is resolved (linked or composed), the rest are pins. Empty result on any failure.
 */
export async function wikidataGeocode(query: string): Promise<LocationLookupResult> {
  const trimmed = query.trim();
  if (trimmed === "") return {
    results: [],
  };

  const ids = await searchEntities(trimmed, 5);
  const entities = await getEntities(ids);

  // Keep search order, drop items without a coordinate, then batch-fetch every referenced id
  // (countries, admin parents, constituents, instance-of types) for their labels/ISO codes at once.
  const hits: { id: string;
    entity: WikidataEntity;
    coordinate: ParsedCoordinate; }[] = [];
  const referenced = new Set<string>();
  for (const id of ids) {
    const entity = entities.get(id);
    if (entity === undefined) continue;
    const coordinate = parseCoordinate(entity);
    if (coordinate === null) continue;
    hits.push({
      id,
      entity,
      coordinate,
    });
    for (const property of ["P17", "P131", "P150", "P31"]) {
      for (const ref of claimEntityIds(entity, property)) referenced.add(ref);
    }
  }
  if (hits.length === 0) return {
    results: [],
  };

  const labels = await getEntities([...referenced]);

  // Resolve an area only for the best (first) candidate; the rest stay pins (backfillable later).
  const results: LocationLookupCandidate[] = [];
  for (const [index, hit] of hits.entries()) {
    const boundary = index === 0 ? await resolveBoundary(hit.id, hit.entity, labels) : null;
    results.push(buildCandidate(hit.entity, hit.coordinate, labels, boundary));
  }
  return {
    results,
  };
}
