import { and, asc, eq, inArray } from "drizzle-orm";
import type {
  CreateCustomPropertyInput,
  CreateCustomPropertyTagInput,
  CustomProperty,
  CustomPropertyTag,
  CustomPropertyTagNode,
  UpdateCustomPropertyInput,
  UpdateCustomPropertyTagInput,
} from "@eesimple/types";
import { db } from "@/db";
import {
  customProperties,
  type CustomPropertyRow,
  customPropertyTags,
  type CustomPropertyTagRow,
  propertyCategories,
} from "@/db/schema";
import { TagCycleError, wouldCreateCycle } from "@/services/tags";

/** Map a DB row plus its assigned category ids to the shared `CustomProperty` wire type. */
function toCustomProperty(row: CustomPropertyRow, categoryIds: string[]): CustomProperty {
  return {
    id: row.id,
    name: row.name,
    type: row.type as CustomProperty["type"],
    numberMin: row.numberMin,
    numberMax: row.numberMax,
    categoryIds,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** Load category ids for a set of property ids in a single query, grouped by property id. */
async function categoryIdsByPropertyId(propertyIds: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (propertyIds.length === 0) return grouped;

  const rows = await db
    .select({
      propertyId: propertyCategories.propertyId,
      categoryId: propertyCategories.categoryId,
    })
    .from(propertyCategories)
    .where(inArray(propertyCategories.propertyId, propertyIds));

  for (const row of rows) {
    const list = grouped.get(row.propertyId) ?? [];
    list.push(row.categoryId);
    grouped.set(row.propertyId, list);
  }
  return grouped;
}

/** Map a DB row to the shared `CustomPropertyTag` wire type. */
function toPropertyTag(row: CustomPropertyTagRow): CustomPropertyTag {
  return {
    id: row.id,
    propertyId: row.propertyId,
    name: row.name,
    parentId: row.parentId,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/**
 * Build a nested tree from a flat property-tag list (roots first). Pure — kept
 * separate from DB access so it can be unit-tested with in-memory data.
 */
export function buildPropertyTagTree(all: CustomPropertyTag[]): CustomPropertyTagNode[] {
  const byId = new Map<string, CustomPropertyTagNode>(all.map(tag => [tag.id, {
    ...tag,
    children: [],
  }]));
  const roots: CustomPropertyTagNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export async function listCustomProperties(): Promise<CustomProperty[]> {
  const rows = await db.select().from(customProperties).orderBy(asc(customProperties.name));
  const grouped = await categoryIdsByPropertyId(rows.map(row => row.id));
  return rows.map(row => toCustomProperty(row, grouped.get(row.id) ?? []));
}

export async function getCustomProperty(id: string): Promise<CustomProperty | null> {
  const [row] = await db.select().from(customProperties).where(eq(customProperties.id, id));
  if (!row) return null;
  const grouped = await categoryIdsByPropertyId([row.id]);
  return toCustomProperty(row, grouped.get(row.id) ?? []);
}

/** Replace a property's category links with the given set (no-op delete then insert). */
async function setPropertyCategories(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  propertyId: string,
  categoryIds: string[],
): Promise<void> {
  await tx.delete(propertyCategories).where(eq(propertyCategories.propertyId, propertyId));
  if (categoryIds.length === 0) return;
  await tx.insert(propertyCategories).values(categoryIds.map(categoryId => ({
    propertyId,
    categoryId,
  })));
}

export async function createCustomProperty(
  input: CreateCustomPropertyInput,
): Promise<CustomProperty> {
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(customProperties)
      .values({
        name: input.name,
        type: input.type,
        numberMin: input.numberMin ?? null,
        numberMax: input.numberMax ?? null,
      })
      .returning({
        id: customProperties.id,
      });
    if (input.categoryIds && input.categoryIds.length > 0) {
      await setPropertyCategories(tx, row.id, input.categoryIds);
    }
    return row.id;
  });
  // Re-read so callers always get the hydrated shape (including categoryIds).
  return (await getCustomProperty(id))!;
}

export async function updateCustomProperty(
  id: string,
  input: UpdateCustomPropertyInput,
): Promise<CustomProperty | null> {
  const found = await db.transaction(async (tx) => {
    const patch: Partial<Pick<CustomPropertyRow, "name" | "numberMin" | "numberMax">> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.numberMin !== undefined) patch.numberMin = input.numberMin;
    if (input.numberMax !== undefined) patch.numberMax = input.numberMax;

    if (Object.keys(patch).length > 0) {
      const [row] = await tx
        .update(customProperties)
        .set(patch)
        .where(eq(customProperties.id, id))
        .returning({
          id: customProperties.id,
        });
      if (!row) return false;
    }
    else {
      const [row] = await tx.select({
        id: customProperties.id,
      }).from(customProperties).where(eq(customProperties.id, id));
      if (!row) return false;
    }

    if (input.categoryIds !== undefined) {
      await setPropertyCategories(tx, id, input.categoryIds);
    }
    return true;
  });

  return found ? getCustomProperty(id) : null;
}

export async function deleteCustomProperty(id: string): Promise<boolean> {
  // FK cascade removes the property's tags, links, and number values.
  const rows = await db.delete(customProperties).where(eq(customProperties.id, id)).returning({
    id: customProperties.id,
  });
  return rows.length > 0;
}

export async function listPropertyTags(propertyId: string): Promise<CustomPropertyTag[]> {
  const rows = await db
    .select()
    .from(customPropertyTags)
    .where(eq(customPropertyTags.propertyId, propertyId))
    .orderBy(asc(customPropertyTags.name));
  return rows.map(toPropertyTag);
}

export async function getPropertyTagTree(propertyId: string): Promise<CustomPropertyTagNode[]> {
  return buildPropertyTagTree(await listPropertyTags(propertyId));
}

export async function createPropertyTag(
  propertyId: string,
  input: CreateCustomPropertyTagInput,
): Promise<CustomPropertyTag | null> {
  const property = await getCustomProperty(propertyId);
  if (!property) return null;

  const [row] = await db
    .insert(customPropertyTags)
    .values({
      propertyId,
      name: input.name,
      parentId: input.parentId ?? null,
    })
    .returning();
  return toPropertyTag(row);
}

export async function updatePropertyTag(
  propertyId: string,
  tagId: string,
  input: UpdateCustomPropertyTagInput,
): Promise<CustomPropertyTag | null> {
  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === tagId) throw new TagCycleError();
    const all = await listPropertyTags(propertyId);
    if (wouldCreateCycle(all, tagId, input.parentId)) throw new TagCycleError();
  }

  const patch: Partial<Pick<CustomPropertyTagRow, "name" | "parentId">> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.parentId !== undefined) patch.parentId = input.parentId;

  const [row] = await db
    .update(customPropertyTags)
    .set(patch)
    .where(and(eq(customPropertyTags.id, tagId), eq(customPropertyTags.propertyId, propertyId)))
    .returning();
  return row ? toPropertyTag(row) : null;
}

export async function deletePropertyTag(propertyId: string, tagId: string): Promise<boolean> {
  // FK cascade removes descendant tags and any bookmark_property_tags links.
  const rows = await db
    .delete(customPropertyTags)
    .where(and(eq(customPropertyTags.id, tagId), eq(customPropertyTags.propertyId, propertyId)))
    .returning({
      id: customPropertyTags.id,
    });
  return rows.length > 0;
}
