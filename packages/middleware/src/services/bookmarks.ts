import { desc, eq, inArray } from "drizzle-orm";
import type {
  Bookmark,
  BookmarkNumberValue,
  BookmarkPropertyTag,
  BookmarkTag,
  CreateBookmarkInput,
  UpdateBookmarkInput,
} from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkNumberValues,
  bookmarkPropertyTags,
  bookmarks,
  bookmarkTags,
  type BookmarkRow,
  customPropertyTags,
  tags,
} from "@/db/schema";
import { getDescendantIds } from "@/services/tags";

/** The hydrated custom-property values that accompany a bookmark row. */
interface BookmarkExtras {
  tags: BookmarkTag[];
  numberValues: BookmarkNumberValue[];
  propertyTags: BookmarkPropertyTag[];
}

const EMPTY_EXTRAS: BookmarkExtras = {
  tags: [],
  numberValues: [],
  propertyTags: [],
};

/** Map a DB row plus its hydrated relations to the shared `Bookmark` wire type. */
function toBookmark(row: BookmarkRow, extras: BookmarkExtras): Bookmark {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    tags: extras.tags,
    numberValues: extras.numberValues,
    propertyTags: extras.propertyTags,
    favorite: row.favorite,
    pinned: row.pinned,
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

/** Load tiered-tags custom-property selections for a set of bookmarks, grouped by bookmark id. */
async function propertyTagsByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkPropertyTag[]>> {
  const grouped = new Map<string, BookmarkPropertyTag[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkPropertyTags.bookmarkId,
      id: customPropertyTags.id,
      propertyId: customPropertyTags.propertyId,
      name: customPropertyTags.name,
      parentId: customPropertyTags.parentId,
    })
    .from(bookmarkPropertyTags)
    .innerJoin(customPropertyTags, eq(bookmarkPropertyTags.propertyTagId, customPropertyTags.id))
    .where(inArray(bookmarkPropertyTags.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      id: row.id,
      name: row.name,
      parentId: row.parentId,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Hydrate all custom-property relations for a set of bookmark rows in batched queries. */
async function extrasByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkExtras>> {
  const [tagsMap, numberMap, propertyTagMap] = await Promise.all([
    tagsByBookmarkId(bookmarkIds),
    numberValuesByBookmarkId(bookmarkIds),
    propertyTagsByBookmarkId(bookmarkIds),
  ]);
  const grouped = new Map<string, BookmarkExtras>();
  for (const id of bookmarkIds) {
    grouped.set(id, {
      tags: tagsMap.get(id) ?? [],
      numberValues: numberMap.get(id) ?? [],
      propertyTags: propertyTagMap.get(id) ?? [],
    });
  }
  return grouped;
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
  if (rows.length === 0) return [];

  const grouped = await extrasByBookmarkId(rows.map(row => row.id));
  return rows.map(row => toBookmark(row, grouped.get(row.id) ?? EMPTY_EXTRAS));
}

export async function getBookmark(id: string): Promise<Bookmark | null> {
  const [row] = await db.select().from(bookmarks).where(eq(bookmarks.id, id));
  if (!row) return null;
  const grouped = await extrasByBookmarkId([row.id]);
  return toBookmark(row, grouped.get(row.id) ?? EMPTY_EXTRAS);
}

export async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(bookmarks)
      .values({
        url: input.url,
        title: input.title,
        description: input.description ?? null,
        favorite: input.favorite ?? false,
        pinned: input.pinned ?? false,
        priority: input.priority ?? 0,
      })
      .returning({
        id: bookmarks.id,
      });
    await linkTags(tx, row.id, input.tagIds);
    await linkPropertyTags(tx, row.id, input.propertyTagIds);
    await setNumberValues(tx, row.id, input.numberValues);
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
      Pick<BookmarkRow, "url" | "title" | "description" | "favorite" | "pinned" | "priority">
    > = {};
    if (input.url !== undefined) patch.url = input.url;
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.favorite !== undefined) patch.favorite = input.favorite;
    if (input.pinned !== undefined) patch.pinned = input.pinned;
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
    if (input.propertyTagIds !== undefined) {
      await tx.delete(bookmarkPropertyTags).where(eq(bookmarkPropertyTags.bookmarkId, id));
      await linkPropertyTags(tx, id, input.propertyTagIds);
    }
    if (input.numberValues !== undefined) {
      await tx.delete(bookmarkNumberValues).where(eq(bookmarkNumberValues.bookmarkId, id));
      await setNumberValues(tx, id, input.numberValues);
    }
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
async function linkTags(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  bookmarkId: string,
  tagIds: string[] | undefined,
): Promise<void> {
  if (!tagIds || tagIds.length === 0) return;
  await tx.insert(bookmarkTags).values(tagIds.map(tagId => ({
    bookmarkId,
    tagId,
  })));
}

/** Insert join rows linking a bookmark to the given property-tag ids (no-op when empty). */
async function linkPropertyTags(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  bookmarkId: string,
  propertyTagIds: string[] | undefined,
): Promise<void> {
  if (!propertyTagIds || propertyTagIds.length === 0) return;
  await tx.insert(bookmarkPropertyTags).values(propertyTagIds.map(propertyTagId => ({
    bookmarkId,
    propertyTagId,
  })));
}

/** Insert number custom-property values for a bookmark (no-op when empty). */
async function setNumberValues(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
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
