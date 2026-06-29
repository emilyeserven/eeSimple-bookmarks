import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateLocationChainInput,
  CreateLocationInput,
  Location,
  LocationNode,
  LocationTitleCandidate,
  UpdateLocationInput,
} from "@eesimple/types";
import { matchLocationIdsByTitle } from "@eesimple/types";
import { db } from "@/db";
import { bookmarkLocations, locations, locationTags, type LocationRow } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
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
    })
    .from(locations);
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName,
    alternateNames: row.alternateNames ?? [],
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
export function collectSubtreeIds(all: Location[], rootId: string): Set<string> {
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
export function wouldCreateCycle(all: Location[], id: string, newParentId: string): boolean {
  return collectSubtreeIds(all, id).has(newParentId);
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

export async function getLocationBySlug(slug: string): Promise<Location | null> {
  const [row] = await db.select().from(locations).where(eq(locations.slug, slug));
  if (!row) return null;
  const tagMap = await tagIdsByLocation([row.id]);
  return toLocation(row, undefined, tagMap.get(row.id) ?? []);
}

export async function getLocationById(id: string): Promise<Location | null> {
  const [row] = await db.select().from(locations).where(eq(locations.id, id));
  if (!row) return null;
  const tagMap = await tagIdsByLocation([row.id]);
  return toLocation(row, undefined, tagMap.get(row.id) ?? []);
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
  const slug = uniqueSlug(input.name, await takenLocationSlugs());
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
 * Create a location together with its higher-level ancestor chain in one call. Ancestors are given
 * immediate-parent-first; we resolve/create them root-first (reusing any that already exist under
 * the resolved parent), then create the leaf under the nearest ancestor. Returns the leaf location.
 */
export async function createLocationWithAncestors(input: CreateLocationChainInput): Promise<Location> {
  // Root-first order so each ancestor's parent is resolved before it is created.
  const rootFirst = [...(input.ancestors ?? [])].reverse();
  let parentId: string | null = null;
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
  return createLocation({
    ...input.location,
    parentId,
  });
}

export async function updateLocation(id: string, input: UpdateLocationInput): Promise<Location | null> {
  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === id) throw new LocationCycleError();
    const all = await listLocations();
    if (wouldCreateCycle(all, id, input.parentId)) throw new LocationCycleError();
  }

  const patch: Partial<LocationRow> = {};
  if (input.name !== undefined) {
    patch.name = input.name;
    patch.slug = uniqueSlug(input.name, await takenLocationSlugs(id));
  }
  if (input.romanizedName !== undefined) patch.romanizedName = input.romanizedName;
  if (input.alternateNames !== undefined) patch.alternateNames = input.alternateNames;
  if (input.latitude !== undefined) patch.latitude = input.latitude;
  if (input.longitude !== undefined) patch.longitude = input.longitude;
  if (input.mapUrl !== undefined) patch.mapUrl = input.mapUrl;
  if (input.plusCode !== undefined) patch.plusCode = input.plusCode;
  if (input.placeType !== undefined) patch.placeType = input.placeType;
  if (input.countryCode !== undefined) patch.countryCode = input.countryCode;
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

/** Fill in slugs for any locations missing one (e.g. rows that predate the `slug` column). */
export async function backfillLocationSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: locations.id,
      name: locations.name,
    })
    .from(locations)
    .where(isNull(locations.slug));
  if (missing.length === 0) return;

  const taken = await takenLocationSlugs();
  for (const loc of missing) {
    const slug = uniqueSlug(loc.name, taken);
    taken.push(slug);
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
