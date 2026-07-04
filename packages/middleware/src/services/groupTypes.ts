import { asc, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateGroupTypeInput,
  GroupType,
  UpdateGroupTypeInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { groups, groupTypes, type GroupTypeRow } from "@/db/schema";
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
export class DuplicateGroupTypeError extends Error {
  constructor(name: string) {
    super(`A group type named "${name}" already exists`);
    this.name = "DuplicateGroupTypeError";
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

  const patch: Partial<Pick<GroupTypeRow, "name" | "slug" | "sortOrder">> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: groupTypes.id,
    }).from(groupTypes).where(eq(groupTypes.name, name));
    if (clash && clash.id !== id) throw new DuplicateGroupTypeError(name);
    patch.name = name;
    patch.slug = uniqueSlug(slugify(name), await takenSlugs(id), "group-type");
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toGroupType(existing);

  const [row] = await db.update(groupTypes).set(patch).where(eq(groupTypes.id, id)).returning();
  return row ? toGroupType(row) : null;
}

/** Delete a group type. The `set null` FK un-classifies any member groups. */
export async function deleteGroupType(id: string): Promise<boolean> {
  const rows = await db.delete(groupTypes).where(eq(groupTypes.id, id)).returning({
    id: groupTypes.id,
  });
  return rows.length > 0;
}

/** Delete many group types, reporting per-item outcomes. */
export function bulkDeleteGroupTypes(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteGroupType);
}

/** Fill in slugs for any group types missing one. */
export async function backfillGroupTypeSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: groupTypes.id,
      name: groupTypes.name,
    })
    .from(groupTypes)
    .where(isNull(groupTypes.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const gt of missing) {
    const slug = uniqueSlug(slugify(gt.name), taken, "group-type");
    taken.push(slug);
    await db.update(groupTypes).set({
      slug,
    }).where(eq(groupTypes.id, gt.id));
  }
}

/** Seed the default group types on first boot. Idempotent — each name inserted only if absent. */
export async function ensureDefaultGroupTypes(): Promise<void> {
  const taken = await takenSlugs();
  for (const [index, name] of DEFAULT_GROUP_TYPES.entries()) {
    const [existing] = await db.select({
      id: groupTypes.id,
    }).from(groupTypes).where(eq(groupTypes.name, name));
    if (existing) continue;
    const slug = uniqueSlug(slugify(name), taken, "group-type");
    taken.push(slug);
    await db.insert(groupTypes).values({
      name,
      slug,
      sortOrder: index,
    }).onConflictDoNothing();
  }
}
