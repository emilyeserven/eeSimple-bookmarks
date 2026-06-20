/**
 * Image/file custom-property value orchestration: ties the image pipeline (`utils/image`), object
 * storage (`utils/objectStore`), and the `bookmark_file_values` table together so the routes stay
 * thin. Mirrors `bookmarkImages.ts`, but keyed by `(bookmarkId, propertyId)` and supporting both the
 * `image` type (re-encoded to WebP) and the `file` type (raw bytes preserved).
 */

import type { BookmarkFileValue } from "@eesimple/types";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookmarkFileValues, type BookmarkFileValueRow, bookmarks, customProperties } from "@/db/schema";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { forgetManifestObject, recordManifestObject } from "@/services/gallery";
import { processImage } from "@/utils/image";
import { deleteObject, putObject } from "@/utils/objectStore";

export type SetPropertyFileResult = BookmarkFileValue | "not_found" | "wrong_type" | "bad_image";

/**
 * Object-storage key for a (bookmark, property) file. Stable per pair, so a replace overwrites it.
 * Images carry a `.webp` extension (always re-encoded); files keep no extension (the original
 * filename and content type travel in the metadata row).
 */
function objectKeyFor(bookmarkId: string, propertyId: string, isImage: boolean): string {
  const base = `property-files/${bookmarkId}/${propertyId}`;
  return isImage ? `${base}.webp` : base;
}

/** Version token embedded in the serving URL so a replaced value busts the browser cache. */
function fileVersion(row: BookmarkFileValueRow): number {
  const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  return created.getTime();
}

/** Map a stored row to the shared `BookmarkFileValue` wire type (used by routes and hydration). */
export function bookmarkFileValueFromRow(row: BookmarkFileValueRow): BookmarkFileValue {
  return {
    propertyId: row.propertyId,
    url: `/api/bookmarks/${row.bookmarkId}/properties/${row.propertyId}/file?v=${fileVersion(row)}`,
    contentType: row.contentType,
    byteSize: row.byteSize,
    originalFilename: row.originalFilename,
    width: row.width,
    height: row.height,
  };
}

/** Read a (bookmark, property) file row, or null when none is stored. */
export async function getBookmarkPropertyFileRow(
  bookmarkId: string,
  propertyId: string,
): Promise<BookmarkFileValueRow | null> {
  const [row] = await db
    .select()
    .from(bookmarkFileValues)
    .where(and(eq(bookmarkFileValues.bookmarkId, bookmarkId), eq(bookmarkFileValues.propertyId, propertyId)));
  return row ?? null;
}

/**
 * Store `rawBytes` for a (bookmark, property) and upsert its row. `image` properties re-encode to
 * WebP; `file` properties keep the raw bytes and original content type/filename. Returns the wire
 * shape, `"not_found"` when the bookmark/property is gone, `"wrong_type"` when the property isn't an
 * `image`/`file`, or `"bad_image"` when an `image` upload can't be decoded.
 */
export async function setBookmarkPropertyFile(
  bookmarkId: string,
  propertyId: string,
  rawBytes: Buffer,
  contentType: string,
  originalFilename: string | null,
): Promise<SetPropertyFileResult> {
  const [bookmark] = await db.select({
    id: bookmarks.id,
  }).from(bookmarks).where(eq(bookmarks.id, bookmarkId));
  if (!bookmark) return "not_found";

  const [property] = await db.select({
    type: customProperties.type,
    showInGallery: customProperties.showInGallery,
  }).from(customProperties).where(eq(customProperties.id, propertyId));
  if (!property) return "not_found";
  if (property.type !== "image" && property.type !== "file") return "wrong_type";

  const isImage = property.type === "image";
  let body: Buffer;
  let storedContentType: string;
  let width: number | null = null;
  let height: number | null = null;
  if (isImage) {
    const processed = await processImage(rawBytes);
    if (!processed) return "bad_image";
    body = processed.body;
    storedContentType = processed.contentType;
    width = processed.width;
    height = processed.height;
  }
  else {
    body = rawBytes;
    storedContentType = contentType || "application/octet-stream";
  }

  const objectKey = objectKeyFor(bookmarkId, propertyId, isImage);
  await putObject(objectKey, body, storedContentType);

  // Bump `createdAt` on replace too, so the serving URL's version changes and caches refresh.
  const values = {
    bookmarkId,
    propertyId,
    objectKey,
    contentType: storedContentType,
    byteSize: body.byteLength,
    originalFilename,
    width,
    height,
    createdAt: new Date(),
  };
  const [row] = await db
    .insert(bookmarkFileValues)
    .values(values)
    .onConflictDoUpdate({
      target: [bookmarkFileValues.bookmarkId, bookmarkFileValues.propertyId],
      set: values,
    })
    .returning();

  // Count toward the Gallery/quota manifest only when the property opts in via `showInGallery`.
  if (property.showInGallery) {
    await recordManifestObject({
      objectKey,
      contentType: storedContentType,
      byteSize: body.byteLength,
      bookmarkId,
    });
  }
  // Presence conditions match on whether a value exists, so the in-memory cache must rebuild.
  invalidateBookmarkCache();
  return bookmarkFileValueFromRow(row);
}

/** Delete a (bookmark, property) file (object + row). Returns whether one existed. */
export async function removeBookmarkPropertyFile(bookmarkId: string, propertyId: string): Promise<boolean> {
  const row = await getBookmarkPropertyFileRow(bookmarkId, propertyId);
  if (!row) return false;
  await deleteObject(row.objectKey);
  await db
    .delete(bookmarkFileValues)
    .where(and(eq(bookmarkFileValues.bookmarkId, bookmarkId), eq(bookmarkFileValues.propertyId, propertyId)));
  await forgetManifestObject(row.objectKey);
  invalidateBookmarkCache();
  return true;
}
