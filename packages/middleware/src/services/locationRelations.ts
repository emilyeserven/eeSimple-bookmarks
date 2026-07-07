import { asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateLocationRelationInput,
  LocationRelation,
  UpdateLocationRelationInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { bookmarkLocations, locationRelations, type LocationRelationRow } from "@/db/schema";
import { AppError } from "@/utils/errors";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing location-relation name. */
export class DuplicateLocationRelationError extends AppError {
  constructor(name: string) {
    super(`A location relation named "${name}" already exists`, "duplicateName", 409, {
      entity: "location relation",
      name,
    });
  }
}

/** Thrown when editing/deleting a seeded built-in location relation. */
export class BuiltInLocationRelationError extends AppError {
  constructor() {
    super("Built-in location relations can't be modified or deleted", "builtInImmutable", 403);
  }
}

/** Thrown when a delete's `reassignTo` target is missing or is the relation being deleted. */
export class InvalidLocationRelationReassignError extends AppError {
  constructor(message = "Invalid reassignment target") {
    super(message, "invalidReassignTarget", 400);
  }
}

/** Map a DB row to the shared `LocationRelation` wire type. */
function toLocationRelation(row: LocationRelationRow, bookmarkCount = 0): LocationRelation {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    description: row.description,
    builtIn: row.builtIn,
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount,
  };
}

/** Existing location-relation slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(locationRelations, locationRelations.slug, locationRelations.id, excludeId);

/** Count distinct bookmarks per relation across `bookmark_locations` edges. Returns a `relationId → count` map. */
async function bookmarkCountsByRelation(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      relationId: bookmarkLocations.locationRelationId,
      count: sql<number>`count(distinct ${bookmarkLocations.bookmarkId})::int`,
    })
    .from(bookmarkLocations)
    .where(isNotNull(bookmarkLocations.locationRelationId))
    .groupBy(bookmarkLocations.locationRelationId);
  return new Map(rows.filter(r => r.relationId).map(r => [r.relationId as string, r.count]));
}

/** List all location relations, ordered by sort order then name. */
export async function listLocationRelations(): Promise<LocationRelation[]> {
  const [rows, counts] = await Promise.all([
    db.select().from(locationRelations).orderBy(asc(locationRelations.sortOrder), asc(locationRelations.name)),
    bookmarkCountsByRelation(),
  ]);
  return rows.map(row => toLocationRelation(row, counts.get(row.id) ?? 0));
}

/** Add a location relation. Throws `DuplicateLocationRelationError` on a name clash. */
export async function createLocationRelation(input: CreateLocationRelationInput): Promise<LocationRelation> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateLocationRelationError(input.name);

  const [clash] = await db.select({
    id: locationRelations.id,
  }).from(locationRelations).where(eq(locationRelations.name, name));
  if (clash) throw new DuplicateLocationRelationError(name);

  const slug = uniqueSlug(name, await takenSlugs(), "location-relation");
  const [row] = await db.insert(locationRelations).values({
    name,
    slug,
    sortOrder: input.sortOrder ?? 0,
    description: input.description ?? null,
  }).returning();
  return toLocationRelation(row);
}

/** Update a relation's name/sort/description. Throws on a name clash; built-ins can't be renamed. */
export async function updateLocationRelation(
  id: string,
  input: UpdateLocationRelationInput,
): Promise<LocationRelation | null> {
  const [existing] = await db.select().from(locationRelations).where(eq(locationRelations.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<LocationRelationRow, "name" | "slug" | "sortOrder" | "description">> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    if (existing.builtIn) throw new BuiltInLocationRelationError();
    const name = input.name.trim();
    const [clash] = await db.select({
      id: locationRelations.id,
    }).from(locationRelations).where(eq(locationRelations.name, name));
    if (clash && clash.id !== id) throw new DuplicateLocationRelationError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id), "location-relation");
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (Object.keys(patch).length === 0) return toLocationRelation(existing);

  const [row] = await db.update(locationRelations).set(patch).where(eq(locationRelations.id, id)).returning();
  return row ? toLocationRelation(row) : null;
}

/**
 * Delete a location relation. Returns false when not found. Built-ins can't be deleted.
 *
 * When `reassignToId` is given, the `bookmark_locations` edges using the deleted relation are moved to
 * the target relation. Without it, the FK `onDelete: "set null"` clears those edges' relation. Throws
 * `InvalidLocationRelationReassignError` when the target is missing or is the relation being deleted.
 * This is display/classification data (not a matchable condition leaf), so no bookmark-cache
 * invalidation is needed.
 */
export async function deleteLocationRelation(id: string, reassignToId?: string): Promise<boolean> {
  const [existing] = await db.select().from(locationRelations).where(eq(locationRelations.id, id));
  if (!existing) return false;
  if (existing.builtIn) throw new BuiltInLocationRelationError();

  if (reassignToId !== undefined) {
    if (reassignToId === id) throw new InvalidLocationRelationReassignError();
    const [target] = await db.select().from(locationRelations).where(eq(locationRelations.id, reassignToId));
    if (!target) throw new InvalidLocationRelationReassignError("Reassignment target not found");
    await db
      .update(bookmarkLocations)
      .set({
        locationRelationId: reassignToId,
      })
      .where(eq(bookmarkLocations.locationRelationId, id));
  }

  const rows = await db.delete(locationRelations).where(eq(locationRelations.id, id)).returning({
    id: locationRelations.id,
  });
  return rows.length > 0;
}

const isBuiltInRelationError = (err: unknown): boolean => err instanceof BuiltInLocationRelationError;

/** Delete many location relations, reporting per-item outcomes (skipping built-ins). */
export function bulkDeleteLocationRelations(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, id => deleteLocationRelation(id), isBuiltInRelationError);
}

/** Built-in location relations seeded on boot — the starting vocabulary. */
const BUILT_IN_RELATIONS = ["Physical Place", "Culture and Tradition", "Created In", "Inspired By"];

/** Seed the built-in location relations — idempotent boot step. */
export async function ensureDefaultLocationRelations(): Promise<void> {
  let order = 0;
  for (const name of BUILT_IN_RELATIONS) {
    const slug = slugify(name);
    await db
      .insert(locationRelations)
      .values({
        name,
        slug,
        builtIn: true,
        sortOrder: order,
      })
      .onConflictDoNothing({
        target: locationRelations.slug,
      });
    order += 1;
  }
}

/** Fill in slugs for any relations missing one (e.g. rows that predate the `slug` column). */
export async function backfillLocationRelationSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: locationRelations.id,
      name: locationRelations.name,
    })
    .from(locationRelations)
    .where(isNull(locationRelations.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const relation of missing) {
    const slug = uniqueSlug(relation.name, taken, "location-relation");
    taken.push(slug);
    await db.update(locationRelations).set({
      slug,
    }).where(eq(locationRelations.id, relation.id));
  }
}
