import { asc, eq } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateGroupTypeInput,
  GroupType,
  UpdateGroupTypeInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { groups, groupTypes, type GroupTypeRow } from "@/db/schema";
import { AppError } from "@/utils/errors";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** The group types seeded on first boot (order defines their default sortOrder). */
const DEFAULT_GROUP_TYPES = [
  "Company",
  "Podcast, Multi-Host",
  "Doujin Circle",
  "Creator Collaborative",
] as const;

/** Thrown when a create/rename collides with an existing group type name. */
export class DuplicateGroupTypeError extends AppError {
  constructor(name: string) {
    super(`A group type named "${name}" already exists`, "duplicateName", 409, {
      entity: "group type",
      name,
    });
  }
}

/** Thrown when an update or delete targets a built-in group type in a disallowed way. */
export class BuiltInGroupTypeError extends AppError {
  constructor(message: string) {
    super(message, "builtInImmutable", 403);
  }
}

/** Map a DB row to the shared `GroupType` wire type. */
function toGroupType(
  row: GroupTypeRow & { groupCount?: number },
): GroupType {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    description: row.description,
    builtIn: row.builtIn ?? false,
    hidden: row.hidden ?? false,
    sortOrder: row.sortOrder,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    groupCount: row.groupCount,
  };
}

/** Existing group-type slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(groupTypes, groupTypes.slug, groupTypes.id, excludeId);

/** List all group types, ordered by sort order then name, with per-type group counts. */
export async function listGroupTypes(): Promise<GroupType[]> {
  const rows = await db
    .select({
      id: groupTypes.id,
      name: groupTypes.name,
      slug: groupTypes.slug,
      description: groupTypes.description,
      builtIn: groupTypes.builtIn,
      hidden: groupTypes.hidden,
      sortOrder: groupTypes.sortOrder,
      createdAt: groupTypes.createdAt,
      groupCount: db.$count(groups, eq(groups.groupTypeId, groupTypes.id)),
    })
    .from(groupTypes)
    .orderBy(asc(groupTypes.sortOrder), asc(groupTypes.name));
  return rows.map(toGroupType);
}

export async function getGroupTypeBySlug(slug: string): Promise<GroupType | null> {
  const [row] = await db
    .select({
      id: groupTypes.id,
      name: groupTypes.name,
      slug: groupTypes.slug,
      description: groupTypes.description,
      builtIn: groupTypes.builtIn,
      hidden: groupTypes.hidden,
      sortOrder: groupTypes.sortOrder,
      createdAt: groupTypes.createdAt,
      groupCount: db.$count(groups, eq(groups.groupTypeId, groupTypes.id)),
    })
    .from(groupTypes)
    .where(eq(groupTypes.slug, slug))
    .limit(1);
  return row ? toGroupType(row) : null;
}

/** Add a group type. Throws `DuplicateGroupTypeError` on a name clash. */
export async function createGroupType(input: CreateGroupTypeInput): Promise<GroupType> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateGroupTypeError(input.name);

  const [clash] = await db.select({
    id: groupTypes.id,
  }).from(groupTypes).where(eq(groupTypes.name, name));
  if (clash) throw new DuplicateGroupTypeError(name);

  const slug = uniqueSlug(slugify(name), await takenSlugs(), "group-type");
  const [row] = await db.insert(groupTypes).values({
    name,
    slug,
    description: input.description ?? null,
    sortOrder: input.sortOrder ?? 0,
  }).returning();
  return toGroupType(row);
}

/** Update a group type's name and/or sort order. Throws `DuplicateGroupTypeError` on clash. */
export async function updateGroupType(
  id: string,
  input: UpdateGroupTypeInput,
): Promise<GroupType | null> {
  const [existing] = await db.select().from(groupTypes).where(eq(groupTypes.id, id));
  if (!existing) return null;
  if (existing.builtIn && input.name !== undefined && input.name.trim() !== existing.name) {
    throw new BuiltInGroupTypeError("A built-in group type cannot be renamed");
  }

  const patch: Partial<
    Pick<GroupTypeRow, "name" | "slug" | "description" | "sortOrder" | "hidden">
  > = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: groupTypes.id,
    }).from(groupTypes).where(eq(groupTypes.name, name));
    if (clash && clash.id !== id) throw new DuplicateGroupTypeError(name);
    patch.name = name;
    patch.slug = uniqueSlug(slugify(name), await takenSlugs(id), "group-type");
  }
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  // Hiding is allowed even on built-ins (unlike rename/delete).
  if (input.hidden !== undefined) patch.hidden = input.hidden;
  if (Object.keys(patch).length === 0) return toGroupType(existing);

  const [row] = await db.update(groupTypes).set(patch).where(eq(groupTypes.id, id)).returning();
  return row ? toGroupType(row) : null;
}

/** Delete a group type. Built-ins can't be deleted. The `set null` FK un-classifies member groups. */
export async function deleteGroupType(id: string): Promise<boolean> {
  const [existing] = await db.select({
    builtIn: groupTypes.builtIn,
  }).from(groupTypes).where(eq(groupTypes.id, id));
  if (!existing) return false;
  if (existing.builtIn) throw new BuiltInGroupTypeError("A built-in group type cannot be deleted");
  const rows = await db.delete(groupTypes).where(eq(groupTypes.id, id)).returning({
    id: groupTypes.id,
  });
  return rows.length > 0;
}

/** Delete many group types, reporting per-item outcomes (built-ins are skipped). */
export function bulkDeleteGroupTypes(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteGroupType, err => err instanceof BuiltInGroupTypeError);
}

/**
 * Seed the default group types on first boot. Idempotent — each name inserted only if absent, and
 * marked `builtIn: true`. Pre-existing installs (rows created before the built-in column existed)
 * get their seeded rows backfilled to `builtIn: true` by name. Built-ins are non-deletable, so a
 * removed default can no longer be resurrected on the next boot — it's hidden, never deleted. The
 * `hidden` flag on an existing row is never touched, so a user's hide choice survives every reboot.
 */
export async function ensureDefaultGroupTypes(): Promise<void> {
  const taken = await takenSlugs();
  for (const [index, name] of DEFAULT_GROUP_TYPES.entries()) {
    const [existing] = await db.select({
      id: groupTypes.id,
      builtIn: groupTypes.builtIn,
    }).from(groupTypes).where(eq(groupTypes.name, name));
    if (existing) {
      if (existing.builtIn !== true) {
        await db.update(groupTypes).set({
          builtIn: true,
        }).where(eq(groupTypes.id, existing.id));
      }
      continue;
    }
    const slug = uniqueSlug(slugify(name), taken, "group-type");
    taken.push(slug);
    await db.insert(groupTypes).values({
      name,
      slug,
      builtIn: true,
      sortOrder: index,
    }).onConflictDoNothing();
  }
}
