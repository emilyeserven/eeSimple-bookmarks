/**
 * Bookmark-image orchestration: ties the image pipeline (`utils/image`), object storage
 * (`utils/objectStore`), and the `bookmark_images` table together so the routes stay thin.
 */

import type { BookmarkImage } from "@eesimple/types";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookmarkImages, type BookmarkImageRow, bookmarks } from "@/db/schema";
import { forgetManifestObject, recordManifestObject } from "@/services/gallery";
import { fetchOgImage } from "@/services/metadata";
import { processImage } from "@/utils/image";
import { deleteObject, putObject } from "@/utils/objectStore";

export type SetImageResult = BookmarkImage | "not_found" | "bad_image";
export type AutoImageResult = BookmarkImage | "not_found" | "no_image";

/** Object-storage key for a bookmark's image. Stable per bookmark, so a replace overwrites it. */
function objectKeyFor(bookmarkId: string): string {
  return `bookmarks/${bookmarkId}.webp`;
}

/** Version token embedded in the serving URL so a replaced image busts the browser cache. */
function imageVersion(row: BookmarkImageRow): number {
  const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  return created.getTime();
}

/** Map a stored-image row to the shared `BookmarkImage` wire type (used by routes and hydration). */
export function bookmarkImageFromRow(row: BookmarkImageRow): BookmarkImage {
  return {
    url: `/api/bookmarks/${row.bookmarkId}/image?v=${imageVersion(row)}`,
    width: row.width,
    height: row.height,
    source: row.source === "og" ? "og" : "upload",
  };
}

/** Read a bookmark's stored-image row, or null when it has no image. */
export async function getBookmarkImageRow(bookmarkId: string): Promise<BookmarkImageRow | null> {
  const [row] = await db.select().from(bookmarkImages).where(eq(bookmarkImages.bookmarkId, bookmarkId));
  return row ?? null;
}

/**
 * Process `rawBytes`, store them, and upsert the bookmark's image row. Returns the wire shape, or
 * `"not_found"` when the bookmark is gone / `"bad_image"` when the bytes aren't a decodable image.
 */
export async function setBookmarkImage(
  bookmarkId: string,
  rawBytes: Buffer,
  source: "upload" | "og",
): Promise<SetImageResult> {
  const [bookmark] = await db.select({
    id: bookmarks.id,
  }).from(bookmarks).where(eq(bookmarks.id, bookmarkId));
  if (!bookmark) return "not_found";

  const processed = await processImage(rawBytes);
  if (!processed) return "bad_image";

  const objectKey = objectKeyFor(bookmarkId);
  await putObject(objectKey, processed.body, processed.contentType);

  // Bump `createdAt` on replace too, so the serving URL's version changes and caches refresh.
  const values = {
    bookmarkId,
    objectKey,
    contentType: processed.contentType,
    width: processed.width,
    height: processed.height,
    byteSize: processed.body.byteLength,
    source,
    createdAt: new Date(),
  };
  const [row] = await db
    .insert(bookmarkImages)
    .values(values)
    .onConflictDoUpdate({
      target: bookmarkImages.bookmarkId,
      set: values,
    })
    .returning();
  // Keep the bucket manifest in sync so the Gallery reflects the upload before any scan runs.
  await recordManifestObject({
    objectKey,
    contentType: processed.contentType,
    byteSize: processed.body.byteLength,
    bookmarkId,
  });
  return bookmarkImageFromRow(row);
}

/** Delete a bookmark's image (object + row). Returns whether one existed. */
export async function removeBookmarkImage(bookmarkId: string): Promise<boolean> {
  const row = await getBookmarkImageRow(bookmarkId);
  if (!row) return false;
  await deleteObject(row.objectKey);
  await db.delete(bookmarkImages).where(eq(bookmarkImages.bookmarkId, bookmarkId));
  await forgetManifestObject(row.objectKey);
  return true;
}

/**
 * Auto-capture: read the bookmark's own stored URL (never a client-supplied one — avoids an SSRF
 * amplifier), fetch the page's preview image, and store it. Returns the wire shape, `"not_found"`,
 * or `"no_image"` when the page has no usable preview image.
 */
export async function fetchAndStoreOgImage(bookmarkId: string): Promise<AutoImageResult> {
  const [bookmark] = await db.select({
    id: bookmarks.id,
    url: bookmarks.url,
  }).from(bookmarks).where(eq(bookmarks.id, bookmarkId));
  if (!bookmark) return "not_found";

  const bytes = await fetchOgImage(bookmark.url);
  if (!bytes) return "no_image";

  const result = await setBookmarkImage(bookmarkId, bytes, "og");
  if (result === "not_found") return "not_found";
  if (result === "bad_image") return "no_image";
  return result;
}
