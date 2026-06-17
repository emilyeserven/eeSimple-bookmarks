import { desc, eq } from "drizzle-orm";
import type { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from "@eesimple/types";
import { db } from "@/db";
import { bookmarks, type BookmarkRow } from "@/db/schema";

/** Map a DB row to the shared `Bookmark` wire type. */
function toBookmark(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    tags: row.tags ?? [],
    favorite: row.favorite,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function listBookmarks(): Promise<Bookmark[]> {
  const rows = await db.select().from(bookmarks).orderBy(desc(bookmarks.createdAt));
  return rows.map(toBookmark);
}

export async function getBookmark(id: string): Promise<Bookmark | null> {
  const [row] = await db.select().from(bookmarks).where(eq(bookmarks.id, id));
  return row ? toBookmark(row) : null;
}

export async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  const [row] = await db
    .insert(bookmarks)
    .values({
      url: input.url,
      title: input.title,
      description: input.description ?? null,
      tags: input.tags ?? [],
      favorite: input.favorite ?? false,
    })
    .returning();
  return toBookmark(row);
}

export async function updateBookmark(
  id: string,
  input: UpdateBookmarkInput,
): Promise<Bookmark | null> {
  const [row] = await db.update(bookmarks).set(input).where(eq(bookmarks.id, id)).returning();
  return row ? toBookmark(row) : null;
}

export async function deleteBookmark(id: string): Promise<boolean> {
  const rows = await db.delete(bookmarks).where(eq(bookmarks.id, id)).returning({
    id: bookmarks.id,
  });
  return rows.length > 0;
}
