import { desc, eq, inArray } from "drizzle-orm";
import type { Bookmark, BookmarkTag, CreateBookmarkInput, UpdateBookmarkInput } from "@eesimple/types";
import { db } from "@/db";
import { bookmarks, bookmarkTags, type BookmarkRow, tags } from "@/db/schema";
import { getDescendantIds } from "@/services/tags";

/** Map a DB row plus its joined tags to the shared `Bookmark` wire type. */
function toBookmark(row: BookmarkRow, tagList: BookmarkTag[]): Bookmark {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    tags: tagList,
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

  const grouped = await tagsByBookmarkId(rows.map(row => row.id));
  return rows.map(row => toBookmark(row, grouped.get(row.id) ?? []));
}

export async function getBookmark(id: string): Promise<Bookmark | null> {
  const [row] = await db.select().from(bookmarks).where(eq(bookmarks.id, id));
  if (!row) return null;
  const grouped = await tagsByBookmarkId([row.id]);
  return toBookmark(row, grouped.get(row.id) ?? []);
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
    return row.id;
  });
  // Re-read so callers always get the hydrated (tag-joined) shape.
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
