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
 * The low-level Action-API plumbing (fetch, search, entity hydration, sitelinks, local-language
 * detection) lives in the shared `./wikidata` module; this file keeps the geocoding-specific
 * candidate/boundary assembly. Area outlines: Wikidata stores only a point, so a region's `boundary`
 * is resolved two ways, in order — (1) a *linked* outline via Wikimedia's Kartographer geoshape
 * service when the item links to an OSM relation (`P402`) or a Commons geoshape (`P3896`); (2)
 * failing that, *composed* from the item's `P150` constituents (each a real admin unit Nominatim can
 * outline), dissolved into one clean outline with turf `union`. Only the top candidate's boundary is
 * resolved, to keep the lookup fast and Nominatim-friendly.
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
import {
  asString,
  claimEntityIds,
  COUNTRY_LANGUAGE_FALLBACK,
  detectWikipediaLanguage,
  fetchJson,
  fetchSitelinks,
  firstClaimValue,
  getEntities,
  searchEntities,
  wikidataEndpoint,
  type WikidataEntity,
  type WikidataSnakValue,
} from "@/services/wikidata";

const DEFAULT_MAPS_ENDPOINT = "https://maps.wikimedia.org";
/** Cap on constituents geocoded when composing a region's area, to stay Nominatim-rate-limit-friendly. */
const MAX_CONSTITUENTS = 12;

/**
 * The English form of `name`, when it differs from the native/local form and isn't blank; else
 * `null`. A local 3-line rule (the `deriveRomanizedName` helper it replaces was deleted as part of
 * the issue #969 cleanup) — small enough to duplicate rather than add a shared export for.
 */
function deriveEnglishName(name: string, english: string | null): string | null {
  const trimmed = english?.trim() ?? "";
  if (trimmed.length === 0 || trimmed === name.trim()) return null;
  return trimmed;
}

/** Re-exported so the Connectors route can report the Wikidata base URL alongside the other sources. */
export { wikidataEndpoint };

/** The Kartographer geoshape base URL (overridable via `WIKIMEDIA_MAPS_ENDPOINT`). */
export function wikimediaMapsEndpoint(): string {
  return (process.env.WIKIMEDIA_MAPS_ENDPOINT ?? DEFAULT_MAPS_ENDPOINT).replace(/\/+$/, "");
}

/** The Wikidata fallback is always available (keyless). Kept as a function to mirror the connectors. */
export function wikidataEnabled(): boolean {
  return true;
}

// --- Label helpers (location prefers the local/ja label) -----------------------------------------

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
      wikidataId: id,
    });
  }
  return ancestors;
}

/** Assemble a `LocationLookupCandidate` from a hydrated entity (boundary resolved separately). */
function buildCandidate(
  qid: string,
  entity: WikidataEntity,
  coordinate: ParsedCoordinate,
  labels: Map<string, WikidataEntity>,
  boundary: LocationBoundary | null,
): LocationLookupCandidate {
  const {
    ja, en,
  } = entityLabels(entity);
  const name = ja ?? en ?? "";
  const englishName = deriveEnglishName(name, en);
  const countryCode = resolveCountryCode(entity, labels);
  const ancestors = buildAncestors(entity, labels, countryCode);
  const placeTypeId = claimEntityIds(entity, "P31")[0];
  const displayName = [name, ...ancestors.map(a => a.name)].join(", ");
  return {
    name,
    englishName,
    displayName,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    placeType: placeTypeId ? classificationName(labels.get(placeTypeId)) : null,
    countryCode,
    mapUrl: mapUrlFor(coordinate.latitude, coordinate.longitude),
    boundary,
    ancestors,
    wikidataId: qid,
  };
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
    results.push(buildCandidate(hit.id, hit.entity, hit.coordinate, labels, boundary));
  }
  return {
    results,
  };
}

// --- Wikipedia links (autofill) -------------------------------------------------------------------

/** Result of {@link resolveWikipediaLinks} — each field `null` when nothing could be resolved. */
export interface WikipediaLinkResolution {
  wikipediaLinkEn: string | null;
  wikipediaLinkLocal: string | null;
  /** The Wikidata QID the links were resolved from, or the `existingWikidataId` passed in. */
  wikidataId: string | null;
}

/**
 * Resolve English + local Wikipedia links for a location from Wikidata sitelinks. Reuses
 * `existingWikidataId` when present (skipping the search); otherwise searches Wikidata by the regular
 * title first, then the English title. The "local" language is the one implied by the regular
 * title's script when unambiguous (CJK / Cyrillic / Arabic / …); for a Latin-script title it falls
 * back to {@link COUNTRY_LANGUAGE_FALLBACK}`[countryCode]`. Best-effort — resolves to all-`null` on
 * any failure or no match, since this backs a convenience "try to autofill" action, not a required
 * field.
 */
export async function resolveWikipediaLinks(
  name: string,
  englishName: string | null,
  existingWikidataId: string | null,
  countryCode: string | null,
): Promise<WikipediaLinkResolution> {
  const empty: WikipediaLinkResolution = {
    wikipediaLinkEn: null,
    wikipediaLinkLocal: null,
    wikidataId: existingWikidataId,
  };

  let qid = existingWikidataId;
  if (qid === null) {
    const candidates = [name, englishName].filter((v): v is string => !!v && v.trim() !== "");
    for (const candidate of candidates) {
      const ids = await searchEntities(candidate, 1);
      if (ids[0]) {
        qid = ids[0];
        break;
      }
    }
  }
  if (qid === null) return empty;

  const sitelinks = await fetchSitelinks(qid);
  if (sitelinks === null) return {
    ...empty,
    wikidataId: qid,
  };

  const wikipediaLinkEn = sitelinks.enwiki?.url ?? null;
  const localLanguage = detectWikipediaLanguage(name, countryCode)
    ?? (countryCode ? COUNTRY_LANGUAGE_FALLBACK[countryCode.toUpperCase()] : undefined)
    ?? null;
  const wikipediaLinkLocal = localLanguage && localLanguage !== "en"
    ? (sitelinks[`${localLanguage}wiki`]?.url ?? null)
    : null;

  return {
    wikipediaLinkEn,
    wikipediaLinkLocal,
    wikidataId: qid,
  };
}
