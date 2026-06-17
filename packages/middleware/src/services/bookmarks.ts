import { and, desc, eq, inArray } from "drizzle-orm";
import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkNumberValue,
  BookmarkTag,
  CreateBookmarkInput,
  UpdateBookmarkInput,
} from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkBooleanValues,
  bookmarkNumberValues,
  bookmarks,
  type BookmarkRow,
  bookmarkTags,
  calculatePropertyOperands,
  categories,
  customProperties,
  homepageTags,
  tags,
} from "@/db/schema";
import { ensureDefaultCategory } from "@/services/categories";
import { getDescendantIds } from "@/services/tags";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** The hydrated custom-property values that accompany a bookmark row. */
interface BookmarkExtras {
  tags: BookmarkTag[];
  numberValues: BookmarkNumberValue[];
  booleanValues: BookmarkBooleanValue[];
}

const EMPTY_EXTRAS: BookmarkExtras = {
  tags: [],
  numberValues: [],
  booleanValues: [],
};

/** Map a DB row plus its hydrated relations to the shared `Bookmark` wire type. */
function toBookmark(row: BookmarkRow, extras: BookmarkExtras, defaultCategoryId: string): Bookmark {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    categoryId: row.categoryId ?? defaultCategoryId,
    tags: extras.tags,
    numberValues: extras.numberValues,
    booleanValues: extras.booleanValues,
    priority: row.priority,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** Load tags for a set of bookmark ids in a single query, grouped by bookmark id. */
async function tagsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkTag[]>> {
  const grouped = new Map<string, BookmarkTag[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkTags.bookmarkId,
      id: tags.id,
      name: tags.name,
      parentId: tags.parentId,
    })
    .from(bookmarkTags)
    .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
    .where(inArray(bookmarkTags.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      parentId: row.parentId,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load number custom-property values for a set of bookmarks, grouped by bookmark id. */
async function numberValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkNumberValue[]>> {
  const grouped = new Map<string, BookmarkNumberValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkNumberValues.bookmarkId,
      propertyId: bookmarkNumberValues.propertyId,
      value: bookmarkNumberValues.value,
    })
    .from(bookmarkNumberValues)
    .where(inArray(bookmarkNumberValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load boolean custom-property values for a set of bookmarks, grouped by bookmark id. */
async function booleanValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkBooleanValue[]>> {
  const grouped = new Map<string, BookmarkBooleanValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkBooleanValues.bookmarkId,
      propertyId: bookmarkBooleanValues.propertyId,
      value: bookmarkBooleanValues.value,
    })
    .from(bookmarkBooleanValues)
    .where(inArray(bookmarkBooleanValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Hydrate all custom-property relations for a set of bookmark rows in batched queries. */
async function extrasByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkExtras>> {
  const [tagsMap, numberMap, booleanMap] = await Promise.all([
    tagsByBookmarkId(bookmarkIds),
    numberValuesByBookmarkId(bookmarkIds),
    booleanValuesByBookmarkId(bookmarkIds),
  ]);
  const grouped = new Map<string, BookmarkExtras>();
  for (const id of bookmarkIds) {
    grouped.set(id, {
      tags: tagsMap.get(id) ?? [],
      numberValues: numberMap.get(id) ?? [],
      booleanValues: booleanMap.get(id) ?? [],
    });
  }
  return grouped;
}

/** Hydrate a list of bookmark rows into wire types (shared by list/get/homepage). */
async function hydrate(rows: BookmarkRow[]): Promise<Bookmark[]> {
  if (rows.length === 0) return [];
  const defaultCategoryId = await ensureDefaultCategory();
  const grouped = await extrasByBookmarkId(rows.map(row => row.id));
  return rows.map(row => toBookmark(row, grouped.get(row.id) ?? EMPTY_EXTRAS, defaultCategoryId));
}

/** List bookmarks, optionally filtered to a tag and its entire subtree. */
export async function listBookmarks(filterTagId?: string): Promise<Bookmark[]> {
  let allowedIds: Set<string> | null = null;
  if (filterTagId) {
    const subtree = await getDescendantIds(filterTagId);
    if (subtree.size === 0) return [];
    const links = await db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
      })
      .from(bookmarkTags)
      .where(inArray(bookmarkTags.tagId, [...subtree]));
    allowedIds = new Set(links.map(link => link.bookmarkId));
    if (allowedIds.size === 0) return [];
  }

  const baseRows = await db.select().from(bookmarks).orderBy(desc(bookmarks.createdAt));
  const rows = allowedIds ? baseRows.filter(row => allowedIds.has(row.id)) : baseRows;
  return hydrate(rows);
}

/**
 * List the homepage bookmarks: the union of bookmarks in any homepage category and
 * bookmarks carrying a homepage tag (or one of its descendants), ordered by `priority`
 * (highest first), ties broken by most-recently created.
 */
export async function listHomepageBookmarks(): Promise<Bookmark[]> {
  const defaultCategoryId = await ensureDefaultCategory();

  const homepageCategories = await db
    .select({
      id: categories.id,
    })
    .from(categories)
    .where(eq(categories.isHomepage, true));
  const homepageCategoryIds = new Set(homepageCategories.map(row => row.id));

  const homepageTagRows = await db.select({
    tagId: homepageTags.tagId,
  }).from(homepageTags);
  const allowedTagIds = new Set<string>();
  for (const {
    tagId,
  } of homepageTagRows) {
    for (const id of await getDescendantIds(tagId)) allowedTagIds.add(id);
  }

  let taggedBookmarkIds = new Set<string>();
  if (allowedTagIds.size > 0) {
    const links = await db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
      })
      .from(bookmarkTags)
      .where(inArray(bookmarkTags.tagId, [...allowedTagIds]));
    taggedBookmarkIds = new Set(links.map(link => link.bookmarkId));
  }

  const baseRows = await db.select().from(bookmarks);
  const rows = baseRows.filter((row) => {
    const categoryId = row.categoryId ?? defaultCategoryId;
    return homepageCategoryIds.has(categoryId) || taggedBookmarkIds.has(row.id);
  });
  rows.sort((a, b) =>
    b.priority - a.priority
    || (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return hydrate(rows);
}

export async function getBookmark(id: string): Promise<Bookmark | null> {
  const [row] = await db.select().from(bookmarks).where(eq(bookmarks.id, id));
  if (!row) return null;
  const [hydrated] = await hydrate([row]);
  return hydrated ?? null;
}

export async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  const categoryId = input.categoryId ?? await ensureDefaultCategory();
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(bookmarks)
      .values({
        url: input.url,
        title: input.title,
        description: input.description ?? null,
        categoryId,
        priority: input.priority ?? 0,
      })
      .returning({
        id: bookmarks.id,
      });
    await linkTags(tx, row.id, input.tagIds);
    await setNumberValues(tx, row.id, input.numberValues);
    await setBooleanValues(tx, row.id, input.booleanValues);
    await recomputeCalculatedValues(tx, row.id);
    return row.id;
  });
  // Re-read so callers always get the hydrated shape.
  return (await getBookmark(id))!;
}

export async function updateBookmark(
  id: string,
  input: UpdateBookmarkInput,
): Promise<Bookmark | null> {
  const found = await db.transaction(async (tx) => {
    const patch: Partial<
      Pick<BookmarkRow, "url" | "title" | "description" | "categoryId" | "priority">
    > = {};
    if (input.url !== undefined) patch.url = input.url;
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
    if (input.priority !== undefined) patch.priority = input.priority;

    if (Object.keys(patch).length > 0) {
      const [row] = await tx.update(bookmarks).set(patch).where(eq(bookmarks.id, id)).returning({
        id: bookmarks.id,
      });
      if (!row) return false;
    }
    else {
      const [row] = await tx.select({
        id: bookmarks.id,
      }).from(bookmarks).where(eq(bookmarks.id, id));
      if (!row) return false;
    }

    if (input.tagIds !== undefined) {
      await tx.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, id));
      await linkTags(tx, id, input.tagIds);
    }
    if (input.numberValues !== undefined) {
      await tx.delete(bookmarkNumberValues).where(eq(bookmarkNumberValues.bookmarkId, id));
      await setNumberValues(tx, id, input.numberValues);
    }
    if (input.booleanValues !== undefined) {
      await tx.delete(bookmarkBooleanValues).where(eq(bookmarkBooleanValues.bookmarkId, id));
      await setBooleanValues(tx, id, input.booleanValues);
    }
    // Always recompute last: number-value edits ripple into calculate results.
    await recomputeCalculatedValues(tx, id);
    return true;
  });

  return found ? getBookmark(id) : null;
}

export async function deleteBookmark(id: string): Promise<boolean> {
  const rows = await db.delete(bookmarks).where(eq(bookmarks.id, id)).returning({
    id: bookmarks.id,
  });
  return rows.length > 0;
}

/** Insert join rows linking a bookmark to the given tag ids (no-op when empty). */
async function linkTags(tx: Tx, bookmarkId: string, tagIds: string[] | undefined): Promise<void> {
  if (!tagIds || tagIds.length === 0) return;
  await tx.insert(bookmarkTags).values(tagIds.map(tagId => ({
    bookmarkId,
    tagId,
  })));
}

/** Insert number custom-property values for a bookmark (no-op when empty). */
async function setNumberValues(
  tx: Tx,
  bookmarkId: string,
  numberValues: BookmarkNumberValue[] | undefined,
): Promise<void> {
  if (!numberValues || numberValues.length === 0) return;
  await tx.insert(bookmarkNumberValues).values(numberValues.map(entry => ({
    bookmarkId,
    propertyId: entry.propertyId,
    value: entry.value,
  })));
}

/** Insert boolean custom-property values for a bookmark (no-op when empty). */
async function setBooleanValues(
  tx: Tx,
  bookmarkId: string,
  booleanValues: BookmarkBooleanValue[] | undefined,
): Promise<void> {
  if (!booleanValues || booleanValues.length === 0) return;
  await tx.insert(bookmarkBooleanValues).values(booleanValues.map(entry => ({
    bookmarkId,
    propertyId: entry.propertyId,
    value: entry.value,
  })));
}

/**
 * Sum the stored values of the given operand properties for a bookmark, treating a missing
 * value as 0. Pure — kept separate from DB access so it can be unit-tested.
 */
export function sumOperands(valueById: Map<string, number>, operandIds: string[]): number {
  return operandIds.reduce((total, id) => total + (valueById.get(id) ?? 0), 0);
}

/**
 * Recompute and persist every calculate property's value for a bookmark, storing the result
 * in `bookmark_number_values` so it filters and sorts like a real number. Must run after the
 * bookmark's number values are written, since calculate results derive from them.
 */
async function recomputeCalculatedValues(tx: Tx, bookmarkId: string): Promise<void> {
  const calcProps = await tx
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.type, "calculate"));
  if (calcProps.length === 0) return;
  const calcIds = calcProps.map(prop => prop.id);

  // Clear stale calculate results so they don't pollute the operand sums below.
  await tx
    .delete(bookmarkNumberValues)
    .where(and(eq(bookmarkNumberValues.bookmarkId, bookmarkId), inArray(bookmarkNumberValues.propertyId, calcIds)));

  const operandRows = await tx
    .select({
      propertyId: calculatePropertyOperands.propertyId,
      operandPropertyId: calculatePropertyOperands.operandPropertyId,
    })
    .from(calculatePropertyOperands)
    .where(inArray(calculatePropertyOperands.propertyId, calcIds));
  const operandsByCalc = new Map<string, string[]>();
  for (const row of operandRows) {
    const list = operandsByCalc.get(row.propertyId) ?? [];
    list.push(row.operandPropertyId);
    operandsByCalc.set(row.propertyId, list);
  }

  const valueRows = await tx
    .select({
      propertyId: bookmarkNumberValues.propertyId,
      value: bookmarkNumberValues.value,
    })
    .from(bookmarkNumberValues)
    .where(eq(bookmarkNumberValues.bookmarkId, bookmarkId));
  const valueById = new Map(valueRows.map(row => [row.propertyId, row.value]));

  const inserts = calcProps.map(prop => ({
    bookmarkId,
    propertyId: prop.id,
    value: sumOperands(valueById, operandsByCalc.get(prop.id) ?? []),
  }));
  if (inserts.length > 0) await tx.insert(bookmarkNumberValues).values(inserts);
}
