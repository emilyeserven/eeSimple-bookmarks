import { asc, eq } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateRelationshipTypeInput,
  RelationshipType,
  UpdateRelationshipTypeInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import {
  bookmarkRelationships,
  relationshipTypes,
  type RelationshipTypeRow,
} from "@/db/schema";
import { getBookmarkEvaluationData, invalidateBookmarkCache } from "@/services/bookmarkCache";
import { AppError } from "@/utils/errors";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Existing relationship-type slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(relationshipTypes, relationshipTypes.slug, relationshipTypes.id, excludeId);

/** Thrown when a create/rename collides with an existing relationship type name. */
export class DuplicateRelationshipTypeError extends AppError {
  constructor(name: string) {
    super(`A relationship type named "${name}" already exists`, "duplicateName", 409, {
      entity: "relationship type",
      name,
    });
  }
}

/** Thrown when an update or delete targets a built-in relationship type in a disallowed way. */
export class BuiltInRelationshipTypeError extends AppError {
  constructor(message: string) {
    super(message, "builtInImmutable", 403);
  }
}

/** A seeded built-in relationship type, in display order. */
interface BuiltInRelationshipType {
  name: string;
  directional: boolean;
}

/**
 * The seeded built-in vocabulary, in display order. "Parent/child" is directional (it powers the
 * bookmark hierarchy view); "Similar" and "Opposite" are symmetric.
 */
const BUILT_IN_RELATIONSHIP_TYPES: BuiltInRelationshipType[] = [
  {
    name: "Similar",
    directional: false,
  },
  {
    name: "Parent/child",
    directional: true,
  },
  {
    name: "Opposite",
    directional: false,
  },
  {
    // "About" is directional with the subject (the media item) stored as the parent — the #1075
    // backfill converts each `bookmarks.{bookId..podcastId}` link into an About edge from the
    // referring bookmark (child) to the media-item bookmark (parent), the generic form of the
    // #1057 "Analysis of" example. Kept distinct from Parent/child so it stays separately
    // filterable and doesn't pollute the Franchise hierarchy view.
    name: "About",
    directional: true,
  },
];

/** Map a DB row (plus optional precomputed counts) to the shared `RelationshipType` wire type. */
function toRelationshipType(
  row: RelationshipTypeRow & { relationshipCount?: number;
    bookmarkCount?: number; },
): RelationshipType {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    directional: row.directional,
    builtIn: row.builtIn,
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    relationshipCount: row.relationshipCount,
    bookmarkCount: row.bookmarkCount,
  };
}

/**
 * Tally distinct bookmarks per relationship type from the in-memory bookmark cache. A bookmark
 * counts once per type it participates in (either side of an edge), mirroring the
 * `relationshipTypeIds` set the shared condition predicate reads.
 */
async function bookmarkCountsByType(): Promise<Map<string, number>> {
  const {
    conditionInputs,
  } = await getBookmarkEvaluationData();
  const counts = new Map<string, number>();
  for (const input of conditionInputs.values()) {
    for (const typeId of input.relationshipTypeIds) {
      counts.set(typeId, (counts.get(typeId) ?? 0) + 1);
    }
  }
  return counts;
}

/** List all relationship types, ordered by their display order then name, with usage counts. */
export async function listRelationshipTypes(): Promise<RelationshipType[]> {
  const [rows, bookmarkCounts] = await Promise.all([
    db
      .select({
        id: relationshipTypes.id,
        name: relationshipTypes.name,
        slug: relationshipTypes.slug,
        directional: relationshipTypes.directional,
        builtIn: relationshipTypes.builtIn,
        sortOrder: relationshipTypes.sortOrder,
        createdAt: relationshipTypes.createdAt,
        relationshipCount: db.$count(
          bookmarkRelationships,
          eq(bookmarkRelationships.relationshipTypeId, relationshipTypes.id),
        ),
      })
      .from(relationshipTypes)
      .orderBy(asc(relationshipTypes.sortOrder), asc(relationshipTypes.name)),
    bookmarkCountsByType(),
  ]);
  return rows.map(row =>
    toRelationshipType({
      ...row,
      bookmarkCount: bookmarkCounts.get(row.id) ?? 0,
    }));
}

/** Add a custom relationship type. Throws `DuplicateRelationshipTypeError` on a name clash. */
export async function createRelationshipType(
  input: CreateRelationshipTypeInput,
): Promise<RelationshipType> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateRelationshipTypeError(input.name);

  const [clash] = await db.select({
    id: relationshipTypes.id,
  }).from(relationshipTypes).where(eq(relationshipTypes.name, name));
  if (clash) throw new DuplicateRelationshipTypeError(name);

  const slug = uniqueSlug(name, await takenSlugs(), "relationship-type");
  const [row] = await db.insert(relationshipTypes).values({
    name,
    slug,
    directional: input.directional ?? false,
    sortOrder: input.sortOrder ?? BUILT_IN_RELATIONSHIP_TYPES.length,
  }).returning();
  return toRelationshipType(row);
}

/** Rename, retoggle direction, and/or reorder a relationship type. Built-ins cannot be renamed. */
export async function updateRelationshipType(
  id: string,
  input: UpdateRelationshipTypeInput,
): Promise<RelationshipType | null> {
  const [existing] = await db.select().from(relationshipTypes).where(eq(relationshipTypes.id, id));
  if (!existing) return null;
  if (existing.builtIn && input.name !== undefined && input.name.trim() !== existing.name) {
    throw new BuiltInRelationshipTypeError("A built-in relationship type cannot be renamed");
  }

  const patch: Partial<Pick<RelationshipTypeRow, "name" | "slug" | "directional" | "sortOrder">> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: relationshipTypes.id,
    }).from(relationshipTypes).where(eq(relationshipTypes.name, name));
    if (clash && clash.id !== id) throw new DuplicateRelationshipTypeError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id), "relationship-type");
  }
  if (input.directional !== undefined) patch.directional = input.directional;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toRelationshipType(existing);

  const [row] = await db
    .update(relationshipTypes)
    .set(patch)
    .where(eq(relationshipTypes.id, id))
    .returning();
  return row ? toRelationshipType(row) : null;
}

/** Delete a relationship type. Built-ins cannot be deleted; edges using it cascade away. */
export async function deleteRelationshipType(id: string): Promise<boolean> {
  const [existing] = await db.select({
    builtIn: relationshipTypes.builtIn,
  }).from(relationshipTypes).where(eq(relationshipTypes.id, id));
  if (!existing) return false;
  if (existing.builtIn) {
    throw new BuiltInRelationshipTypeError("A built-in relationship type cannot be deleted");
  }
  const rows = await db.delete(relationshipTypes).where(eq(relationshipTypes.id, id)).returning({
    id: relationshipTypes.id,
  });
  // Cascade removes bookmark_relationships edges — matchable data (relationship-type conditions).
  if (rows.length > 0) invalidateBookmarkCache();
  return rows.length > 0;
}

/** Delete many relationship types, reporting per-item outcomes (built-ins are skipped). */
export function bulkDeleteRelationshipTypes(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(
    ids,
    deleteRelationshipType,
    err => err instanceof BuiltInRelationshipTypeError,
  );
}

/**
 * Ensure the seeded built-in relationship types exist. Idempotent and safe to call at boot: inserts
 * any missing built-in by slug, and keeps its `directional` flag aligned with the seed. The table is
 * created with `slug` from the first boot, so every row always has a slug — no backfill is needed.
 */
export async function ensureBuiltInRelationshipTypes(): Promise<void> {
  let order = 0;
  for (const builtIn of BUILT_IN_RELATIONSHIP_TYPES) {
    const slug = slugify(builtIn.name);
    await db
      .insert(relationshipTypes)
      .values({
        name: builtIn.name,
        slug,
        directional: builtIn.directional,
        builtIn: true,
        sortOrder: order,
      })
      .onConflictDoNothing({
        target: relationshipTypes.slug,
      });
    order += 1;
  }
}
