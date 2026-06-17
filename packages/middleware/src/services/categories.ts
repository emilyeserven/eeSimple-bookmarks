import { asc, eq, inArray, isNull } from "drizzle-orm";
import type {
  Category,
  CategoryPropertyDefaults,
  CreateCategoryInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
} from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarks,
  categories,
  categoryBooleanDefaults,
  categoryNumberDefaults,
  type CategoryRow,
  categoryRootTags,
  homepageTags,
  tags,
} from "@/db/schema";

/** Thrown when an update or delete targets a built-in category in a disallowed way. */
export class BuiltInCategoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BuiltInCategoryError";
  }
}

/** Thrown when a root-tag allowlist references an unknown or non-root tag. */
export class InvalidRootTagError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRootTagError";
  }
}

/** The reserved name of the built-in category that every unassigned bookmark falls back to. */
export const DEFAULT_CATEGORY_NAME = "Default";

/** Map a DB row to the shared `Category` wire type. */
function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    builtIn: row.builtIn,
    isHomepage: row.isHomepage,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function listCategories(): Promise<Category[]> {
  const rows = await db.select().from(categories).orderBy(asc(categories.name));
  return rows.map(toCategory);
}

export async function getCategory(id: string): Promise<Category | null> {
  const [row] = await db.select().from(categories).where(eq(categories.id, id));
  return row ? toCategory(row) : null;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const [row] = await db
    .insert(categories)
    .values({
      name: input.name,
      description: input.description ?? null,
      icon: input.icon ?? null,
      isHomepage: input.isHomepage ?? false,
    })
    .returning();
  return toCategory(row);
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<Category | null> {
  const [existing] = await db.select().from(categories).where(eq(categories.id, id));
  if (!existing) return null;
  if (existing.builtIn && input.name !== undefined && input.name !== existing.name) {
    throw new BuiltInCategoryError("The built-in category cannot be renamed");
  }

  const patch: Partial<Pick<CategoryRow, "name" | "description" | "icon" | "isHomepage">> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.icon !== undefined) patch.icon = input.icon ?? null;
  if (input.isHomepage !== undefined) patch.isHomepage = input.isHomepage;

  if (Object.keys(patch).length === 0) return toCategory(existing);

  const [row] = await db
    .update(categories)
    .set(patch)
    .where(eq(categories.id, id))
    .returning();
  return row ? toCategory(row) : null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const [existing] = await db.select().from(categories).where(eq(categories.id, id));
  if (!existing) return false;
  if (existing.builtIn) {
    throw new BuiltInCategoryError("The built-in category cannot be deleted");
  }
  // FK cascade removes this category's property_categories and root-tag links; bookmarks
  // in it have their category_id set to NULL (resolved back to Default on read).
  const rows = await db.delete(categories).where(eq(categories.id, id)).returning({
    id: categories.id,
  });
  return rows.length > 0;
}

// Resolved once per process — the built-in category id never changes after creation.
let defaultCategoryId: string | null = null;

/**
 * Ensure the built-in "Default" category exists and return its id. Idempotent and safe to
 * call at boot in every environment: creates the category if missing, then backfills any
 * bookmarks left without a category (e.g. rows that predate the `category_id` column).
 */
export async function ensureDefaultCategory(): Promise<string> {
  if (defaultCategoryId) return defaultCategoryId;

  const [existing] = await db.select().from(categories).where(eq(categories.builtIn, true));
  const row
    = existing
      ?? (
        await db
          .insert(categories)
          .values({
            name: DEFAULT_CATEGORY_NAME,
            description: "The category bookmarks use when none is chosen.",
            builtIn: true,
            isHomepage: true,
          })
          .returning()
      )[0];

  defaultCategoryId = row.id;
  await db
    .update(bookmarks)
    .set({
      categoryId: row.id,
    })
    .where(isNull(bookmarks.categoryId));
  return row.id;
}

/** The enabled root-tag ids for a category (empty = all root tags enabled). */
export async function getCategoryRootTags(categoryId: string): Promise<string[]> {
  const rows = await db
    .select({
      tagId: categoryRootTags.tagId,
    })
    .from(categoryRootTags)
    .where(eq(categoryRootTags.categoryId, categoryId));
  return rows.map(row => row.tagId);
}

/** Validate that every id refers to an existing root tag (`parentId === null`). */
async function assertRootTags(tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) return;
  const rows = await db
    .select({
      id: tags.id,
      parentId: tags.parentId,
    })
    .from(tags)
    .where(inArray(tags.id, tagIds));
  const byId = new Map(rows.map(row => [row.id, row.parentId]));
  for (const id of tagIds) {
    if (!byId.has(id)) throw new InvalidRootTagError(`Unknown tag: ${id}`);
    if (byId.get(id) !== null) throw new InvalidRootTagError(`Tag ${id} is not a root tag`);
  }
}

/** Replace a category's enabled root-tag allowlist. Returns null if the category is missing. */
export async function setCategoryRootTags(
  categoryId: string,
  tagIds: string[],
): Promise<string[] | null> {
  const [category] = await db.select({
    id: categories.id,
  }).from(categories).where(eq(categories.id, categoryId));
  if (!category) return null;
  await assertRootTags(tagIds);

  await db.transaction(async (tx) => {
    await tx.delete(categoryRootTags).where(eq(categoryRootTags.categoryId, categoryId));
    if (tagIds.length > 0) {
      await tx.insert(categoryRootTags).values(tagIds.map(tagId => ({
        categoryId,
        tagId,
      })));
    }
  });
  return tagIds;
}

/** The tag ids selected to surface their bookmarks on the homepage. */
export async function getHomepageTagIds(): Promise<string[]> {
  const rows = await db.select({
    tagId: homepageTags.tagId,
  }).from(homepageTags);
  return rows.map(row => row.tagId);
}

/** Replace the set of homepage tags. */
export async function setHomepageTagIds(tagIds: string[]): Promise<string[]> {
  await db.transaction(async (tx) => {
    await tx.delete(homepageTags);
    if (tagIds.length > 0) {
      await tx.insert(homepageTags).values(tagIds.map(tagId => ({
        tagId,
      })));
    }
  });
  return tagIds;
}

/** A category's default custom-property values, applied to new bookmarks added to it. */
export async function getCategoryDefaults(categoryId: string): Promise<CategoryPropertyDefaults> {
  const [numberRows, booleanRows] = await Promise.all([
    db
      .select({
        propertyId: categoryNumberDefaults.propertyId,
        value: categoryNumberDefaults.value,
      })
      .from(categoryNumberDefaults)
      .where(eq(categoryNumberDefaults.categoryId, categoryId)),
    db
      .select({
        propertyId: categoryBooleanDefaults.propertyId,
        value: categoryBooleanDefaults.value,
      })
      .from(categoryBooleanDefaults)
      .where(eq(categoryBooleanDefaults.categoryId, categoryId)),
  ]);
  return {
    numberValues: numberRows.map(row => ({
      propertyId: row.propertyId,
      value: row.value,
    })),
    booleanValues: booleanRows.map(row => ({
      propertyId: row.propertyId,
      value: row.value,
    })),
  };
}

/** Replace a category's default custom-property values. Returns null if the category is missing. */
export async function setCategoryDefaults(
  categoryId: string,
  input: UpdateCategoryDefaultsInput,
): Promise<CategoryPropertyDefaults | null> {
  const [category] = await db.select({
    id: categories.id,
  }).from(categories).where(eq(categories.id, categoryId));
  if (!category) return null;

  await db.transaction(async (tx) => {
    await tx.delete(categoryNumberDefaults).where(eq(categoryNumberDefaults.categoryId, categoryId));
    await tx.delete(categoryBooleanDefaults).where(eq(categoryBooleanDefaults.categoryId, categoryId));
    if (input.numberValues.length > 0) {
      await tx.insert(categoryNumberDefaults).values(input.numberValues.map(entry => ({
        categoryId,
        propertyId: entry.propertyId,
        value: entry.value,
      })));
    }
    if (input.booleanValues.length > 0) {
      await tx.insert(categoryBooleanDefaults).values(input.booleanValues.map(entry => ({
        categoryId,
        propertyId: entry.propertyId,
        value: entry.value,
      })));
    }
  });
  return getCategoryDefaults(categoryId);
}
