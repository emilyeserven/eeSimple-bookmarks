import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateLocationChainInput,
  CreateLocationInput,
  Location,
  LocationNode,
  LocationTitleCandidate,
  SetLocationAncestorsInput,
  UpdateLocationInput,
} from "@eesimple/types";
import { matchLocationIdsByTitle } from "@eesimple/types";
import { db } from "@/db";
import { bookmarkLocations, locations, locationTags, type LocationRow } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { geocodeLocation, refreshLocationBoundary } from "@/services/geocoding";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { slugify, uniqueSlug } from "@/utils/slug";

/** Thrown when a reparent would put a location under itself or one of its descendants. */
export class LocationCycleError extends Error {
  constructor() {
    super("Cannot move a location under itself or one of its descendants");
    this.name = "LocationCycleError";
  }
}

/** Distinct-bookmark counts for a location: across its whole subtree, and for the location alone. */
export interface LocationBookmarkCounts {
  /** Distinct bookmarks carrying this location or any descendant. */
  subtree: number;
  /** Distinct bookmarks carrying this location but none of its descendants. */
  own: number;
}

/** Map a DB row (plus optional precomputed counts + associated tag ids) to the shared wire type. */
function toLocation(row: LocationRow, counts?: LocationBookmarkCounts, tagIds?: string[]): Location {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName,
    slug: row.slug ?? slugify(row.name),
    alternateNames: row.alternateNames ?? [],
    latitude: row.latitude,
    longitude: row.longitude,
    mapUrl: row.mapUrl,
    plusCode: row.plusCode,
    placeType: row.placeType,
    countryCode: row.countryCode,
    boundary: row.boundary ?? null,
    wikidataId: row.wikidataId,
    usesWikidataCoordinates: row.usesWikidataCoordinates === true,
    sortOrder: row.sortOrder,
    parentId: row.parentId,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    tagIds,
    bookmarkCount: counts?.subtree,
    ownBookmarkCount: counts?.own,
  };
}

// The "auto-tag from title" matcher lives in `@eesimple/types`; re-exported so callers/tests can
// import it from `@/services/locations`.
export { matchLocationIdsByTitle };

/** Lightweight id/name/romanized/alternate-name listing, used by the title-matching automation. */
export async function listLocationNames(): Promise<LocationTitleCandidate[]> {
  const rows = await db
    .select({
      id: locations.id,
      name: locations.name,
      romanizedName: locations.romanizedName,
      alternateNames: locations.alternateNames,
      parentId: locations.parentId,
    })
    .from(locations);
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName,
    alternateNames: row.alternateNames ?? [],
    parentId: row.parentId,
  }));
}

/** Build a parent→children id map from a flat location list. Pure helper. */
function buildChildrenByParent(all: { id: string;
  parentId: string | null; }[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const loc of all) {
    if (!loc.parentId) continue;
    const siblings = map.get(loc.parentId) ?? [];
    siblings.push(loc.id);
    map.set(loc.parentId, siblings);
  }
  return map;
}

/**
 * Compute each location's distinct subtree bookmark count and its "own" (no-descendant) count.
 * Pure — operates on in-memory data so it can be unit-tested. Mirrors `computeTagBookmarkCounts`.
 */
export function computeLocationBookmarkCounts(
  all: { id: string;
    parentId: string | null; }[],
  links: { locationId: string;
    bookmarkId: string; }[],
): Map<string, LocationBookmarkCounts> {
  const directSets = new Map<string, Set<string>>(all.map(loc => [loc.id, new Set<string>()]));
  for (const link of links) directSets.get(link.locationId)?.add(link.bookmarkId);

  const childrenByParent = buildChildrenByParent(all);

  const result = new Map<string, LocationBookmarkCounts>();
  for (const loc of all) {
    const ownDirect = directSets.get(loc.id) ?? new Set<string>();
    const subtree = new Set<string>(ownDirect);
    const descendants = new Set<string>();
    const stack = [...(childrenByParent.get(loc.id) ?? [])];
    while (stack.length > 0) {
      const id = stack.pop()!;
      for (const bookmarkId of directSets.get(id) ?? []) {
        subtree.add(bookmarkId);
        descendants.add(bookmarkId);
      }
      for (const child of childrenByParent.get(id) ?? []) stack.push(child);
    }
    let own = 0;
    for (const bookmarkId of ownDirect) if (!descendants.has(bookmarkId)) own += 1;
    result.set(loc.id, {
      subtree: subtree.size,
      own,
    });
  }
  return result;
}

/**
 * Choose the string a location's slug derives from: the romanized name when present, otherwise the
 * name. A location's primary `name` is often in a non-Latin script (e.g. `萩市`), which slugifies to
 * empty and would fall back to a generic `category`/`category-2`… slug; the romanized form (`Hagi`)
 * yields a meaningful, readable slug instead.
 */
export function locationSlugSource(name: string, romanizedName?: string | null): string {
  const romanized = romanizedName?.trim();
  return romanized ? romanized : name;
}

/** Whether `slug` was derived from `source` (exact base, or a `base-2`/`base-3`… disambiguation). */
function slugDerivesFrom(slug: string, source: string): boolean {
  const base = slugify(source);
  if (!base) return false;
  return slug === base || slug.startsWith(`${base}-`);
}

/** Existing location slugs, optionally excluding one location id (when renaming). */
async function takenLocationSlugs(excludeId?: string): Promise<string[]> {
  const rows = await db
    .select({
      slug: locations.slug,
    })
    .from(locations)
    .where(excludeId ? ne(locations.id, excludeId) : undefined);
  return rows.map(row => row.slug).filter((slug): slug is string => slug !== null);
}

/** Build a nested tree from a flat location list (roots first). Pure. */
export function buildLocationTree(all: Location[]): LocationNode[] {
  const byId = new Map<string, LocationNode>(all.map(loc => [loc.id, {
    ...loc,
    children: [],
  }]));
  const roots: LocationNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Resolve a location id to the set of ids in its subtree (inclusive). Pure. */
export function collectLocationSubtreeIds(all: Location[], rootId: string): Set<string> {
  const childrenByParent = buildChildrenByParent(all);
  const result = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    for (const child of childrenByParent.get(id) ?? []) stack.push(child);
  }
  return result;
}

/** Whether reparenting `id` under `newParentId` would create a cycle. Pure helper. */
export function wouldCreateLocationCycle(all: Location[], id: string, newParentId: string): boolean {
  return collectLocationSubtreeIds(all, id).has(newParentId);
}

/** Load the associated (mood/biome) tag ids for a set of locations, keyed by location id. */
async function tagIdsByLocation(locationIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (locationIds.length === 0) return map;
  const rows = await db
    .select({
      locationId: locationTags.locationId,
      tagId: locationTags.tagId,
    })
    .from(locationTags)
    .where(inArray(locationTags.locationId, locationIds));
  for (const row of rows) {
    const list = map.get(row.locationId) ?? [];
    list.push(row.tagId);
    map.set(row.locationId, list);
  }
  return map;
}

export async function listLocations(): Promise<Location[]> {
  const rows = await db.select().from(locations).orderBy(asc(locations.sortOrder), asc(locations.name));
  const links = await db
    .select({
      locationId: bookmarkLocations.locationId,
      bookmarkId: bookmarkLocations.bookmarkId,
    })
    .from(bookmarkLocations);
  const counts = computeLocationBookmarkCounts(rows, links);
  const tagMap = await tagIdsByLocation(rows.map(row => row.id));
  return rows.map(row => toLocation(row, counts.get(row.id), tagMap.get(row.id) ?? []));
}

export async function getLocationTree(): Promise<LocationNode[]> {
  return buildLocationTree(await listLocations());
}

/** Replace the mood/biome tag links for a location inside an existing transaction. */
async function writeLocationTags(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  locationId: string,
  tagIds: string[],
): Promise<void> {
  await tx.delete(locationTags).where(eq(locationTags.locationId, locationId));
  if (tagIds.length > 0) {
    await tx.insert(locationTags).values(tagIds.map(tagId => ({
      locationId,
      tagId,
    })));
  }
}

export async function createLocation(input: CreateLocationInput): Promise<Location> {
  const slug = uniqueSlug(locationSlugSource(input.name, input.romanizedName), await takenLocationSlugs());
  const row = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(locations)
      .values({
        name: input.name,
        romanizedName: input.romanizedName ?? null,
        slug,
        alternateNames: input.alternateNames ?? [],
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        mapUrl: input.mapUrl ?? null,
        plusCode: input.plusCode ?? null,
        placeType: input.placeType ?? null,
        countryCode: input.countryCode ?? null,
        boundary: input.boundary ?? null,
        wikidataId: input.wikidataId ?? null,
        usesWikidataCoordinates: input.usesWikidataCoordinates ?? false,
        sortOrder: input.sortOrder ?? 0,
        parentId: input.parentId ?? null,
      })
      .returning();
    if (input.tagIds && input.tagIds.length > 0) {
      await writeLocationTags(tx, inserted.id, input.tagIds);
    }
    return inserted;
  });
  // The location tree feeds the cached location-descendant resolver used by condition matching.
  invalidateBookmarkCache();
  return toLocation(row, undefined, input.tagIds ?? []);
}

/** Find an existing location with the given name under the given parent (null = root), if any. */
async function findLocationByNameAndParent(
  name: string,
  parentId: string | null,
): Promise<string | null> {
  const [row] = await db
    .select({
      id: locations.id,
    })
    .from(locations)
    .where(and(
      eq(locations.name, name),
      parentId === null ? isNull(locations.parentId) : eq(locations.parentId, parentId),
    ));
  return row?.id ?? null;
}

/**
 * Resolve an ancestor chain (immediate-parent-first) to the id of the nearest ancestor a leaf should
 * sit under, creating any levels that don't already exist. Ancestors are walked root-first so each
 * one's parent is resolved before it is created; a level whose name already exists under the resolved
 * parent is reused rather than recreated. `anchorParentId` anchors the **top** of the chain to an
 * existing location (a reused ancestor), or `null` to build from the root. Shared by leaf creation
 * (`createLocationWithAncestors`) and reparenting an existing leaf (`setLocationAncestors`).
 */
async function resolveAncestorChain(
  ancestors: CreateLocationInput[],
  anchorParentId: string | null,
): Promise<string | null> {
  const rootFirst = [...ancestors].reverse();
  let parentId: string | null = anchorParentId;
  for (const ancestor of rootFirst) {
    const existing = await findLocationByNameAndParent(ancestor.name, parentId);
    if (existing) {
      parentId = existing;
      continue;
    }
    const created = await createLocation({
      ...ancestor,
      parentId,
    });
    parentId = created.id;
  }
  return parentId;
}

/**
 * Create a location together with its higher-level ancestor chain in one call. Ancestors are given
 * immediate-parent-first; we resolve/create them root-first (reusing any that already exist under
 * the resolved parent), then create the leaf under the nearest ancestor. Returns the leaf location.
 * An optional `parentId` anchors the top of the chain to an existing location (a reused ancestor).
 */
export async function createLocationWithAncestors(input: CreateLocationChainInput): Promise<Location> {
  const parentId = await resolveAncestorChain(input.ancestors ?? [], input.parentId ?? null);
  return createLocation({
    ...input.location,
    parentId,
  });
}

/**
 * Build (or reuse) an ancestor chain **above an existing location** and reparent it under the nearest
 * resolved ancestor. Ancestors are immediate-parent-first; an optional `parentId` anchors the top of
 * the chain to an existing location, or `null` to detach to the root. The anchor is cycle-checked up
 * front (so we never create chain levels for a doomed reparent); the freshly created ancestors can't
 * be descendants of the leaf, so they need no further check. Returns the updated location, or `null`
 * when the id doesn't exist.
 */
export async function setLocationAncestors(
  id: string,
  input: SetLocationAncestorsInput,
): Promise<Location | null> {
  const anchor = input.parentId ?? null;
  if (anchor !== null) {
    if (anchor === id) throw new LocationCycleError();
    const all = await listLocations();
    if (wouldCreateLocationCycle(all, id, anchor)) throw new LocationCycleError();
  }
  const parentId = await resolveAncestorChain(input.ancestors ?? [], anchor);
  return updateLocation(id, {
    parentId,
  });
}

export async function updateLocation(id: string, input: UpdateLocationInput): Promise<Location | null> {
  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === id) throw new LocationCycleError();
    const all = await listLocations();
    if (wouldCreateLocationCycle(all, id, input.parentId)) throw new LocationCycleError();
  }

  const patch: Partial<LocationRow> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.romanizedName !== undefined) patch.romanizedName = input.romanizedName;
  // The slug derives from the romanized name (falling back to the name), so a change to either
  // field re-derives it. Resolve the effective values against the current row when one is absent.
  if (input.name !== undefined || input.romanizedName !== undefined) {
    const [current] = await db
      .select({
        name: locations.name,
        romanizedName: locations.romanizedName,
      })
      .from(locations)
      .where(eq(locations.id, id));
    if (current) {
      const effectiveName = input.name ?? current.name;
      const effectiveRomanized = input.romanizedName !== undefined ? input.romanizedName : current.romanizedName;
      patch.slug = uniqueSlug(
        locationSlugSource(effectiveName, effectiveRomanized),
        await takenLocationSlugs(id),
      );
    }
  }
  if (input.alternateNames !== undefined) patch.alternateNames = input.alternateNames;
  if (input.latitude !== undefined) patch.latitude = input.latitude;
  if (input.longitude !== undefined) patch.longitude = input.longitude;
  if (input.mapUrl !== undefined) patch.mapUrl = input.mapUrl;
  if (input.plusCode !== undefined) patch.plusCode = input.plusCode;
  if (input.placeType !== undefined) patch.placeType = input.placeType;
  if (input.countryCode !== undefined) patch.countryCode = input.countryCode;
  if (input.boundary !== undefined) patch.boundary = input.boundary;
  if (input.wikidataId !== undefined) patch.wikidataId = input.wikidataId;
  if (input.usesWikidataCoordinates !== undefined) patch.usesWikidataCoordinates = input.usesWikidataCoordinates;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (input.parentId !== undefined) patch.parentId = input.parentId;

  const row = await db.transaction(async (tx) => {
    let updated: LocationRow | undefined;
    if (Object.keys(patch).length > 0) {
      [updated] = await tx.update(locations).set(patch).where(eq(locations.id, id)).returning();
    }
    else {
      [updated] = await tx.select().from(locations).where(eq(locations.id, id));
    }
    if (!updated) return undefined;
    if (input.tagIds !== undefined) {
      await writeLocationTags(tx, id, input.tagIds);
    }
    return updated;
  });
  if (!row) return null;
  // A reparent or a tag-association change feeds condition matching; invalidate the cache.
  invalidateBookmarkCache();
  const tagMap = await tagIdsByLocation([id]);
  return toLocation(row, undefined, tagMap.get(id) ?? []);
}

/**
 * Backfill a location's GeoJSON `boundary` on demand (one geocoder request), caching it on the row.
 * Returns the current location unchanged when a boundary is already stored or none can be resolved.
 * Boundaries are display-only metadata, so this deliberately does NOT invalidate the bookmark cache
 * (mirrors the Card Display Rules / scan-cache carve-out). When `usesWikidataCoordinates` is set, the
 * area is grabbed from Wikidata only — Nominatim is skipped, since this location's lat/long source of
 * truth is Wikidata (e.g. an informal region like 中国地方 with no Nominatim admin boundary).
 */
export async function ensureLocationBoundary(id: string): Promise<Location | null> {
  const [current] = await db.select().from(locations).where(eq(locations.id, id));
  if (!current) return null;
  let row = current;
  if (!current.boundary) {
    const boundary = await refreshLocationBoundary(current.name, current.latitude, current.longitude, {
      source: current.usesWikidataCoordinates === true ? "wikidata" : undefined,
    });
    if (boundary !== null) {
      const [updated] = await db
        .update(locations)
        .set({
          boundary,
        })
        .where(eq(locations.id, id))
        .returning();
      if (updated) row = updated;
    }
  }
  const tagMap = await tagIdsByLocation([id]);
  return toLocation(row, undefined, tagMap.get(id) ?? []);
}

/**
 * Force-refresh a location's coordinates (lat/lon, mapUrl, boundary) by re-geocoding its current
 * name. Unlike `ensureLocationBoundary`, this always writes — even when coordinates are already
 * stored — making it the "force repull" action. Picks the candidate with an area boundary when
 * available, then the one closest to the stored point; falls back to the first result. Returns
 * `null` when the location isn't found; returns the location unchanged when the geocoder returns no
 * results. When `usesWikidataCoordinates` is set, re-geocodes against Wikidata only — Nominatim is
 * skipped, mirroring `ensureLocationBoundary`.
 */
export async function refreshLocationCoordinates(id: string): Promise<Location | null> {
  const [current] = await db.select().from(locations).where(eq(locations.id, id));
  if (!current) return null;

  const {
    results,
  } = await geocodeLocation(current.name, {
    source: current.usesWikidataCoordinates === true ? "wikidata" : undefined,
  });
  const tagMap = await tagIdsByLocation([id]);
  if (results.length === 0) return toLocation(current, undefined, tagMap.get(id) ?? []);

  const withBoundary = results.filter(c => c.boundary != null);
  const pool = withBoundary.length > 0 ? withBoundary : results;

  let chosen = pool[0]!;
  if (current.latitude != null && current.longitude != null) {
    const lat = current.latitude;
    const lon = current.longitude;
    chosen = pool.reduce((best, c) => {
      const d = (c.latitude - lat) ** 2 + (c.longitude - lon) ** 2;
      const bd = (best.latitude - lat) ** 2 + (best.longitude - lon) ** 2;
      return d < bd ? c : best;
    });
  }

  const [updated] = await db
    .update(locations)
    .set({
      latitude: chosen.latitude,
      longitude: chosen.longitude,
      mapUrl: chosen.mapUrl ?? current.mapUrl,
      boundary: chosen.boundary ?? current.boundary,
    })
    .where(eq(locations.id, id))
    .returning();

  if (!updated) return null;
  return toLocation(updated, undefined, tagMap.get(id) ?? []);
}

/** Fill in slugs for any locations missing one (e.g. rows that predate the `slug` column). */
export async function backfillLocationSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: locations.id,
      name: locations.name,
      romanizedName: locations.romanizedName,
    })
    .from(locations)
    .where(isNull(locations.slug));
  if (missing.length === 0) return;

  const taken = await takenLocationSlugs();
  for (const loc of missing) {
    const slug = uniqueSlug(locationSlugSource(loc.name, loc.romanizedName), taken);
    taken.push(slug);
    await db.update(locations).set({
      slug,
    }).where(eq(locations.id, loc.id));
  }
}

/**
 * Re-slug existing locations whose slug does not derive from their romanized name. Older rows whose
 * non-Latin name slugified to empty got a generic `category`/`category-2`… slug; once they have a
 * romanized name, re-derive a readable slug from it. Idempotent — rows already deriving from their
 * romanized name (and rows without one to derive from) are left untouched.
 */
export async function backfillLocationRomanizedSlugs(): Promise<void> {
  const rows = await db
    .select({
      id: locations.id,
      romanizedName: locations.romanizedName,
      slug: locations.slug,
    })
    .from(locations);

  // Reserve the slugs we're keeping so re-derived slugs can't collide with them.
  const taken = new Set<string>();
  const toRewrite: { id: string;
    source: string; }[] = [];
  for (const loc of rows) {
    const source = loc.romanizedName?.trim();
    if (!source || (loc.slug !== null && slugDerivesFrom(loc.slug, source))) {
      if (loc.slug !== null) taken.add(loc.slug);
      continue;
    }
    toRewrite.push({
      id: loc.id,
      source,
    });
  }

  for (const loc of toRewrite) {
    const slug = uniqueSlug(loc.source, taken);
    taken.add(slug);
    await db.update(locations).set({
      slug,
    }).where(eq(locations.id, loc.id));
  }
}

export async function deleteLocation(id: string): Promise<boolean> {
  // FK cascade removes descendant locations, bookmark_locations and location_tags link rows.
  const rows = await db.delete(locations).where(eq(locations.id, id)).returning({
    id: locations.id,
  });
  if (rows.length > 0) invalidateBookmarkCache();
  return rows.length > 0;
}

/** Delete many locations, reporting per-item outcomes (a parent cascades to its descendants). */
export function bulkDeleteLocations(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteLocation);
}
