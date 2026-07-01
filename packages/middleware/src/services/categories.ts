import { and, asc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import type {
  BulkDeleteResult,
  Category,
  CategoryPropertyDefaults,
  CreateCategoryInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
} from "@eesimple/types";
import { db } from "@/db";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import {
  bookmarks,
  categories,
  categoryBooleanDefaults,
  categoryDateTimeDefaults,
  categoryNumberDefaults,
  type CategoryRow,
  categoryRootTags,
  tags,
} from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";

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
function toCategory(row: CategoryRow & { bookmarkCount?: number }): Category {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName,
    // Backfill runs at boot, but fall back to a derived slug so the wire type is never null.
    slug: row.slug ?? slugify(row.name),
    description: row.description,
    icon: row.icon,
    builtIn: row.builtIn,
    isHomepage: row.isHomepage,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
  };
}

/** Existing category slugs, optionally excluding one category id (when renaming). */
async function takenSlugs(excludeId?: string): Promise<string[]> {
  const rows = await db
    .select({
      slug: categories.slug,
    })
    .from(categories)
    .where(excludeId ? ne(categories.id, excludeId) : undefined);
  return rows.map(row => row.slug).filter((slug): slug is string => slug !== null);
}

export async function listCategories(): Promise<Category[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      romanizedName: categories.romanizedName,
      slug: categories.slug,
      description: categories.description,
      icon: categories.icon,
      builtIn: categories.builtIn,
      isHomepage: categories.isHomepage,
      createdAt: categories.createdAt,
      // A correlated subquery built with the query builder so the column
      // references stay table-qualified — a bare `sql` template renders them
      // unqualified, which silently resolves them against the inner `bookmarks`
      // table and counts zero. Built-in categories also absorb uncategorized
      // (null) bookmarks.
      bookmarkCount: db.$count(
        bookmarks,
        or(
          eq(bookmarks.categoryId, categories.id),
          and(
            eq(categories.builtIn, true),
            eq(categories.name, DEFAULT_CATEGORY_NAME),
            isNull(bookmarks.categoryId),
          ),
        ),
      ),
    })
    .from(categories)
    .orderBy(asc(categories.name));
  return rows.map(toCategory);
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const slug = uniqueSlug(input.name, await takenSlugs());
  const [row] = await db
    .insert(categories)
    .values({
      name: input.name,
      romanizedName: input.romanizedName ?? null,
      slug,
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

  const patch: Partial<Pick<CategoryRow, "name" | "romanizedName" | "slug" | "description" | "icon" | "isHomepage">>
    = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.romanizedName !== undefined) patch.romanizedName = input.romanizedName ?? null;
  // Keep the slug in sync when the name changes (built-ins can't be renamed, so "default" sticks).
  if (input.name !== undefined && input.name !== existing.name) {
    patch.slug = uniqueSlug(input.name, await takenSlugs(id));
  }
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
  // in it have their category_id set to NULL. Re-assign them to Default immediately so the
  // count subquery never has to handle orphaned NULLs mid-session.
  const rows = await db.delete(categories).where(eq(categories.id, id)).returning({
    id: categories.id,
  });
  if (rows.length > 0) {
    const defaultId = await ensureDefaultCategory();
    await db.update(bookmarks).set({
      categoryId: defaultId,
    }).where(isNull(bookmarks.categoryId));
    // The reassignment changes bookmarks' matchable categoryId (category condition leaves).
    invalidateBookmarkCache();
  }
  return rows.length > 0;
}

/** Delete many categories, reporting per-item outcomes (built-ins are skipped). */
export function bulkDeleteCategories(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteCategory, err => err instanceof BuiltInCategoryError);
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

  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.builtIn, true), eq(categories.name, DEFAULT_CATEGORY_NAME)));
  const row
    = existing
      ?? (
        await db
          .insert(categories)
          .values({
            name: DEFAULT_CATEGORY_NAME,
            slug: slugify(DEFAULT_CATEGORY_NAME),
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
  await backfillSlugs();
  return row.id;
}

/** Fill in slugs for any categories missing one (e.g. rows that predate the `slug` column). */
async function backfillSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .where(isNull(categories.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const category of missing) {
    const slug = uniqueSlug(category.name, taken);
    taken.push(slug);
    await db.update(categories).set({
      slug,
    }).where(eq(categories.id, category.id));
  }
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

/** A category's default custom-property values, applied to new bookmarks added to it. */
export async function getCategoryDefaults(categoryId: string): Promise<CategoryPropertyDefaults> {
  const [numberRows, booleanRows, dateTimeRows] = await Promise.all([
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
    db
      .select({
        propertyId: categoryDateTimeDefaults.propertyId,
        value: categoryDateTimeDefaults.value,
      })
      .from(categoryDateTimeDefaults)
      .where(eq(categoryDateTimeDefaults.categoryId, categoryId)),
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
    dateTimeValues: dateTimeRows.map(row => ({
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
    await tx.delete(categoryDateTimeDefaults).where(eq(categoryDateTimeDefaults.categoryId, categoryId));
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
    if (input.dateTimeValues.length > 0) {
      await tx.insert(categoryDateTimeDefaults).values(input.dateTimeValues.map(entry => ({
        categoryId,
        propertyId: entry.propertyId,
        value: entry.value,
      })));
    }
  });
  return getCategoryDefaults(categoryId);
}
