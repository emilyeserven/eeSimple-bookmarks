import { asc, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreatePropertyGroupInput,
  PropertyGroup,
  UpdatePropertyGroupInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { customProperties, propertyGroups, type PropertyGroupRow } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing property group name. */
export class DuplicatePropertyGroupError extends Error {
  constructor(name: string) {
    super(`A property group named "${name}" already exists`);
    this.name = "DuplicatePropertyGroupError";
  }
}

/** Map a DB row to the shared `PropertyGroup` wire type. */
function toPropertyGroup(row: PropertyGroupRow & { propertyCount?: number }): PropertyGroup {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    description: row.description,
    priority: row.priority,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    propertyCount: row.propertyCount,
  };
}

/** Existing property-group slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(propertyGroups, propertyGroups.slug, propertyGroups.id, excludeId);

/** List all property groups, ordered by priority then name. */
export async function listPropertyGroups(): Promise<PropertyGroup[]> {
  const rows = await db
    .select({
      id: propertyGroups.id,
      name: propertyGroups.name,
      slug: propertyGroups.slug,
      description: propertyGroups.description,
      priority: propertyGroups.priority,
      createdAt: propertyGroups.createdAt,
      propertyCount: db.$count(customProperties, eq(customProperties.propertyGroupId, propertyGroups.id)),
    })
    .from(propertyGroups)
    .orderBy(asc(propertyGroups.priority), asc(propertyGroups.name));
  return rows.map(toPropertyGroup);
}

/** Add a property group. Throws `DuplicatePropertyGroupError` on a name clash. */
export async function createPropertyGroup(input: CreatePropertyGroupInput): Promise<PropertyGroup> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicatePropertyGroupError(input.name);

  const [clash] = await db.select({
    id: propertyGroups.id,
  }).from(propertyGroups).where(eq(propertyGroups.name, name));
  if (clash) throw new DuplicatePropertyGroupError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(propertyGroups).values({
    name,
    slug,
    description: input.description ?? null,
    priority: input.priority ?? 0,
  }).returning();
  return toPropertyGroup(row);
}

/** Rename, re-describe, and/or reorder a property group. */
export async function updatePropertyGroup(
  id: string,
  input: UpdatePropertyGroupInput,
): Promise<PropertyGroup | null> {
  const [existing] = await db.select().from(propertyGroups).where(eq(propertyGroups.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<PropertyGroupRow, "name" | "slug" | "description" | "priority">> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: propertyGroups.id,
    }).from(propertyGroups).where(eq(propertyGroups.name, name));
    if (clash && clash.id !== id) throw new DuplicatePropertyGroupError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (Object.keys(patch).length === 0) return toPropertyGroup(existing);

  const [row] = await db.update(propertyGroups).set(patch).where(eq(propertyGroups.id, id)).returning();
  return row ? toPropertyGroup(row) : null;
}

/** Delete a property group. The `set null` FK un-groups any member custom properties. */
export async function deletePropertyGroup(id: string): Promise<boolean> {
  const rows = await db.delete(propertyGroups).where(eq(propertyGroups.id, id)).returning({
    id: propertyGroups.id,
  });
  return rows.length > 0;
}

/** Delete many property groups, reporting per-item outcomes. */
export function bulkDeletePropertyGroups(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deletePropertyGroup);
}

/** Fill in slugs for any property groups missing one (e.g. rows that predate the `slug` column). */
export async function backfillPropertyGroupSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: propertyGroups.id,
      name: propertyGroups.name,
    })
    .from(propertyGroups)
    .where(isNull(propertyGroups.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const group of missing) {
    const slug = uniqueSlug(group.name, taken);
    taken.push(slug);
    await db.update(propertyGroups).set({
      slug,
    }).where(eq(propertyGroups.id, group.id));
  }
}
