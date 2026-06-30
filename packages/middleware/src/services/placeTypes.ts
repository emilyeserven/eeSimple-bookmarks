import { asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import type { BulkDeleteResult, CreatePlaceTypeInput, PlaceType, UpdatePlaceTypeInput } from "@eesimple/types";
import { placeTypeKey } from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { migratePlaceTypeConfig } from "@/services/appSettings";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { locations, placeTypes, type PlaceTypeRow } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing place type name. */
export class DuplicatePlaceTypeError extends Error {
  constructor(name: string) {
    super(`A place type named "${name}" already exists`);
    this.name = "DuplicatePlaceTypeError";
  }
}

/** Thrown when a delete's `reassignTo` target is missing or is the place type being deleted. */
export class InvalidReassignTargetError extends Error {
  constructor(message = "Invalid reassignment target") {
    super(message);
    this.name = "InvalidReassignTargetError";
  }
}

/** Map a DB row to the shared `PlaceType` wire type. */
function toPlaceType(row: PlaceTypeRow, locationCount = 0): PlaceType {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    locationCount,
  };
}

/** Existing place-type slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(placeTypes, placeTypes.slug, placeTypes.id, excludeId);

/** Humanize a snake/underscore key like `state_district` → `State District`. */
function titleCase(key: string): string {
  return key.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Count locations per place type, keyed by the normalized `placeTypeKey` so legacy raw values
 * (e.g. `"City"`) match a place type's lower-cased slug. Returns a `slug → count` map.
 */
async function locationCountsBySlug(): Promise<Map<string, number>> {
  const key = sql<string>`lower(trim(${locations.placeType}))`;
  const rows = await db
    .select({
      key,
      count: sql<number>`count(*)::int`,
    })
    .from(locations)
    .where(isNotNull(locations.placeType))
    .groupBy(key);
  return new Map(rows.map(r => [r.key, r.count]));
}

/** List all place types, ordered by sort order then name. */
export async function listPlaceTypes(): Promise<PlaceType[]> {
  const [rows, counts] = await Promise.all([
    db.select().from(placeTypes).orderBy(asc(placeTypes.sortOrder), asc(placeTypes.name)),
    locationCountsBySlug(),
  ]);
  return rows.map(row => toPlaceType(row, counts.get(placeTypeKey(row.slug ?? row.name)) ?? 0));
}

/** Add a place type. Throws `DuplicatePlaceTypeError` on a name clash. */
export async function createPlaceType(input: CreatePlaceTypeInput): Promise<PlaceType> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicatePlaceTypeError(input.name);

  const [clash] = await db.select({
    id: placeTypes.id,
  }).from(placeTypes).where(eq(placeTypes.name, name));
  if (clash) throw new DuplicatePlaceTypeError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(placeTypes).values({
    name,
    slug,
    sortOrder: input.sortOrder ?? 0,
  }).returning();
  return toPlaceType(row);
}

/** Update a place type's name and/or sort order. Throws `DuplicatePlaceTypeError` on a name clash. */
export async function updatePlaceType(
  id: string,
  input: UpdatePlaceTypeInput,
): Promise<PlaceType | null> {
  const [existing] = await db.select().from(placeTypes).where(eq(placeTypes.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<PlaceTypeRow, "name" | "slug" | "sortOrder">> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: placeTypes.id,
    }).from(placeTypes).where(eq(placeTypes.name, name));
    if (clash && clash.id !== id) throw new DuplicatePlaceTypeError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toPlaceType(existing);

  const [row] = await db.update(placeTypes).set(patch).where(eq(placeTypes.id, id)).returning();
  return row ? toPlaceType(row) : null;
}

/**
 * Delete a place type. Returns false when not found.
 *
 * When `reassignToId` is given, the locations using the deleted place type are first moved to the
 * target place type (their `placeType` text rewritten to the target's slug) and the deleted type's
 * map display/icon/level-group config is migrated onto the target, so the locations keep a place type
 * instead of being orphaned. Throws `InvalidReassignTargetError` when the target is missing or is the
 * place type being deleted. Without `reassignToId` the locations are left untouched (legacy behavior).
 */
export async function deletePlaceType(id: string, reassignToId?: string): Promise<boolean> {
  const [existing] = await db.select().from(placeTypes).where(eq(placeTypes.id, id));
  if (!existing) return false;
  const fromSlug = existing.slug ?? slugify(existing.name);

  if (reassignToId !== undefined) {
    if (reassignToId === id) throw new InvalidReassignTargetError();
    const [target] = await db.select().from(placeTypes).where(eq(placeTypes.id, reassignToId));
    if (!target) throw new InvalidReassignTargetError("Reassignment target not found");
    const toSlug = target.slug ?? slugify(target.name);

    await db
      .update(locations)
      .set({
        placeType: toSlug,
      })
      .where(eq(sql`lower(trim(${locations.placeType}))`, placeTypeKey(fromSlug)));
    await migratePlaceTypeConfig(fromSlug, toSlug);
    invalidateBookmarkCache();
  }

  const rows = await db.delete(placeTypes).where(eq(placeTypes.id, id)).returning({
    id: placeTypes.id,
  });
  return rows.length > 0;
}

/** Delete many place types, reporting per-item outcomes. */
export function bulkDeletePlaceTypes(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deletePlaceType, () => false);
}

/**
 * Seed `place_types` from distinct `locations.placeType` values — idempotent boot step.
 * Short-circuits immediately when any rows already exist.
 */
export async function seedPlaceTypesFromLocations(): Promise<void> {
  const [existing] = await db.select({
    id: placeTypes.id,
  }).from(placeTypes).limit(1);
  if (existing) return;

  const rows = await db
    .selectDistinct({
      placeType: locations.placeType,
    })
    .from(locations)
    .where(isNotNull(locations.placeType));

  for (const row of rows) {
    if (!row.placeType) continue;
    const slug = placeTypeKey(row.placeType);
    const name = titleCase(slug);
    await db
      .insert(placeTypes)
      .values({
        name,
        slug,
        sortOrder: 0,
      })
      .onConflictDoNothing({
        target: placeTypes.slug,
      });
  }
}

/** Fill in slugs for any place types missing one (e.g. rows that predate the `slug` column). */
export async function backfillPlaceTypeSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: placeTypes.id,
      name: placeTypes.name,
    })
    .from(placeTypes)
    .where(isNull(placeTypes.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const pt of missing) {
    const slug = uniqueSlug(pt.name, taken);
    taken.push(slug);
    await db.update(placeTypes).set({
      slug,
    }).where(eq(placeTypes.id, pt.id));
  }
}
