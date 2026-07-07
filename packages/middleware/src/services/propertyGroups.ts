import { asc, eq, inArray, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreatePropertyGroupInput,
  PropertyGroup,
  UpdatePropertyGroupInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import {
  customProperties,
  propertyGroupCategories,
  propertyGroupMediaTypes,
  propertyGroups,
  type PropertyGroupRow,
} from "@/db/schema";
import { AppError } from "@/utils/errors";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** A transaction handle, as passed to `db.transaction`'s callback. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a create/rename collides with an existing property group name. */
export class DuplicatePropertyGroupError extends AppError {
  constructor(name: string) {
    super(`A property group named "${name}" already exists`, "duplicateName", 409, {
      entity: "property group",
      name,
    });
  }
}

/** Map a DB row (plus its hydrated scope) to the shared `PropertyGroup` wire type. */
function toPropertyGroup(
  row: PropertyGroupRow & { propertyCount?: number },
  categoryIds: string[] = [],
  mediaTypeIds: string[] = [],
): PropertyGroup {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    description: row.description,
    priority: row.priority,
    categoryIds,
    allCategories: row.allCategories,
    mediaTypeIds,
    allMediaTypes: row.allMediaTypes,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    propertyCount: row.propertyCount,
  };
}

/** Existing property-group slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(propertyGroups, propertyGroups.slug, propertyGroups.id, excludeId);

/** Load category-scope ids for a set of group ids in a single query, grouped by group id. */
async function categoryIdsByGroupId(groupIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (groupIds.length === 0) return grouped;

  const rows = await db
    .select({
      propertyGroupId: propertyGroupCategories.propertyGroupId,
      categoryId: propertyGroupCategories.categoryId,
    })
    .from(propertyGroupCategories)
    .where(inArray(propertyGroupCategories.propertyGroupId, groupIds));

  for (const row of rows) {
    const list = grouped.get(row.propertyGroupId) ?? [];
    list.push(row.categoryId);
    grouped.set(row.propertyGroupId, list);
  }
  return grouped;
}

/** Load media-type-scope ids for a set of group ids in a single query, grouped by group id. */
async function mediaTypeIdsByGroupId(groupIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (groupIds.length === 0) return grouped;

  const rows = await db
    .select({
      propertyGroupId: propertyGroupMediaTypes.propertyGroupId,
      mediaTypeId: propertyGroupMediaTypes.mediaTypeId,
    })
    .from(propertyGroupMediaTypes)
    .where(inArray(propertyGroupMediaTypes.propertyGroupId, groupIds));

  for (const row of rows) {
    const list = grouped.get(row.propertyGroupId) ?? [];
    list.push(row.mediaTypeId);
    grouped.set(row.propertyGroupId, list);
  }
  return grouped;
}

/** Replace a group's category-scope links with the given set (delete then insert). */
async function setPropertyGroupCategories(
  tx: Tx,
  propertyGroupId: string,
  categoryIds: string[],
): Promise<void> {
  await tx.delete(propertyGroupCategories).where(eq(propertyGroupCategories.propertyGroupId, propertyGroupId));
  if (categoryIds.length === 0) return;
  await tx.insert(propertyGroupCategories).values(categoryIds.map(categoryId => ({
    propertyGroupId,
    categoryId,
  })));
}

/** Replace a group's media-type-scope links with the given set (delete then insert). */
async function setPropertyGroupMediaTypes(
  tx: Tx,
  propertyGroupId: string,
  mediaTypeIds: string[],
): Promise<void> {
  await tx.delete(propertyGroupMediaTypes).where(eq(propertyGroupMediaTypes.propertyGroupId, propertyGroupId));
  if (mediaTypeIds.length === 0) return;
  await tx.insert(propertyGroupMediaTypes).values(mediaTypeIds.map(mediaTypeId => ({
    propertyGroupId,
    mediaTypeId,
  })));
}

/** The column set selected for a hydrated `PropertyGroup` (with its live property count). */
const groupSelection = {
  id: propertyGroups.id,
  name: propertyGroups.name,
  slug: propertyGroups.slug,
  description: propertyGroups.description,
  priority: propertyGroups.priority,
  allCategories: propertyGroups.allCategories,
  allMediaTypes: propertyGroups.allMediaTypes,
  createdAt: propertyGroups.createdAt,
  propertyCount: db.$count(customProperties, eq(customProperties.propertyGroupId, propertyGroups.id)),
} as const;

/** List all property groups, ordered by priority then name, hydrated with their scope. */
export async function listPropertyGroups(): Promise<PropertyGroup[]> {
  const rows = await db
    .select(groupSelection)
    .from(propertyGroups)
    .orderBy(asc(propertyGroups.priority), asc(propertyGroups.name));
  const ids = rows.map(row => row.id);
  const [catMap, mtMap] = await Promise.all([
    categoryIdsByGroupId(ids),
    mediaTypeIdsByGroupId(ids),
  ]);
  return rows.map(row => toPropertyGroup(row, catMap.get(row.id) ?? [], mtMap.get(row.id) ?? []));
}

/** Load one property group by id, hydrated with its category/media-type scope. Null if missing. */
export async function getPropertyGroup(id: string): Promise<PropertyGroup | null> {
  const [row] = await db.select(groupSelection).from(propertyGroups).where(eq(propertyGroups.id, id));
  if (!row) return null;
  const [catMap, mtMap] = await Promise.all([
    categoryIdsByGroupId([id]),
    mediaTypeIdsByGroupId([id]),
  ]);
  return toPropertyGroup(row, catMap.get(id) ?? [], mtMap.get(id) ?? []);
}

/** Add a property group. Throws `DuplicatePropertyGroupError` on a name clash. */
export async function createPropertyGroup(input: CreatePropertyGroupInput): Promise<PropertyGroup> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicatePropertyGroupError(input.name);

  const [clash] = await db.select({
    id: propertyGroups.id,
  }).from(propertyGroups).where(eq(propertyGroups.name, name));
  if (clash) throw new DuplicatePropertyGroupError(name);

  const slug = uniqueSlug(name, await takenSlugs(), "property-group");
  const id = await db.transaction(async (tx) => {
    const [row] = await tx.insert(propertyGroups).values({
      name,
      slug,
      description: input.description ?? null,
      priority: input.priority ?? 0,
      allCategories: input.allCategories ?? false,
      allMediaTypes: input.allMediaTypes ?? false,
    }).returning({
      id: propertyGroups.id,
    });
    if (input.categoryIds?.length) await setPropertyGroupCategories(tx, row.id, input.categoryIds);
    if (input.mediaTypeIds?.length) await setPropertyGroupMediaTypes(tx, row.id, input.mediaTypeIds);
    return row.id;
  });

  const created = await getPropertyGroup(id);
  if (!created) throw new Error("Failed to load newly created property group");
  return created;
}

/** Rename, re-describe, reorder, and/or re-scope a property group. */
export async function updatePropertyGroup(
  id: string,
  input: UpdatePropertyGroupInput,
): Promise<PropertyGroup | null> {
  const [existing] = await db.select().from(propertyGroups).where(eq(propertyGroups.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<
    PropertyGroupRow,
    "name" | "slug" | "description" | "priority" | "allCategories" | "allMediaTypes"
  >> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: propertyGroups.id,
    }).from(propertyGroups).where(eq(propertyGroups.name, name));
    if (clash && clash.id !== id) throw new DuplicatePropertyGroupError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id), "property-group");
  }
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.allCategories !== undefined) patch.allCategories = input.allCategories;
  if (input.allMediaTypes !== undefined) patch.allMediaTypes = input.allMediaTypes;

  await db.transaction(async (tx) => {
    if (Object.keys(patch).length > 0) {
      await tx.update(propertyGroups).set(patch).where(eq(propertyGroups.id, id));
    }
    if (input.categoryIds !== undefined) await setPropertyGroupCategories(tx, id, input.categoryIds);
    if (input.mediaTypeIds !== undefined) await setPropertyGroupMediaTypes(tx, id, input.mediaTypeIds);
  });

  return getPropertyGroup(id);
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
    const slug = uniqueSlug(group.name, taken, "property-group");
    taken.push(slug);
    await db.update(propertyGroups).set({
      slug,
    }).where(eq(propertyGroups.id, group.id));
  }
}
