/**
 * Bookmark-image orchestration: ties the image pipeline (`utils/image`), object storage
 * (`utils/objectStore`), and the `bookmark_images` table together so the routes stay thin.
 */

import type { BookmarkImage, BulkAutoFetchResult } from "@eesimple/types";
import { findOEmbedProvider } from "@eesimple/types";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bookmarkImages, type BookmarkImageRow, bookmarks } from "@/db/schema";
import { forgetManifestObject, recordManifestObject } from "@/services/gallery";
import { fetchOgImage } from "@/services/metadata";
import { fetchOEmbedThumbnail } from "@/services/oembed";
import { fetchYouTubeThumbnail, isYouTubeVideoUrl } from "@/services/youtube";
import { processImage } from "@/utils/image";
import { deleteObject, putObject } from "@/utils/objectStore";

export type SetImageResult = BookmarkImage | "not_found" | "bad_image";
export type ImageAutoGrabError = "no_image" | "bad_image" | "blocked" | "server_error" | "fetch_error";
export type AutoImageResult = BookmarkImage | "not_found" | ImageAutoGrabError;

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
  // Clear any previous auto-grab error: a new image (upload or auto) resolves the failure.
  await db.update(bookmarks).set({
    imageAutoGrabError: null,
  }).where(eq(bookmarks.id, bookmarkId));
  return bookmarkImageFromRow(row);
}

/**
 * Auto-fetch og:images for all eligible bookmarks (no image, no error) in batches of 3 concurrent
 * requests to avoid hammering external servers. Returns how many succeeded vs. failed.
 * `onProgress` is called after each batch with the running total of processed items.
 */
export async function bulkAutoFetchImages(
  onProgress?: (processed: number, total: number) => void,
): Promise<BulkAutoFetchResult> {
  const eligible = await db
    .select({
      id: bookmarks.id,
    })
    .from(bookmarks)
    .leftJoin(bookmarkImages, eq(bookmarkImages.bookmarkId, bookmarks.id))
    .where(and(isNull(bookmarkImages.bookmarkId), isNull(bookmarks.imageAutoGrabError)));

  let fetched = 0;
  let failed = 0;
  let processed = 0;
  const BATCH = 3;
  for (let i = 0; i < eligible.length; i += BATCH) {
    const results = await Promise.allSettled(
      eligible.slice(i, i + BATCH).map(({
        id,
      }) => fetchAndStoreOgImage(id)),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && typeof r.value !== "string") fetched++;
      else failed++;
      processed++;
    }
    onProgress?.(processed, eligible.length);
  }
  return {
    fetched,
    failed,
  };
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
 * or a specific `ImageAutoGrabError` describing why no image could be obtained.
 */
export async function fetchAndStoreOgImage(bookmarkId: string): Promise<AutoImageResult> {
  const [bookmark] = await db.select({
    id: bookmarks.id,
    url: bookmarks.url,
  }).from(bookmarks).where(eq(bookmarks.id, bookmarkId));
  if (!bookmark) return "not_found";
  if (!bookmark.url) return "no_image";

  // YouTube and other oEmbed providers serve a known, high-quality thumbnail via oEmbed — prefer it
  // over scraping og:image, falling back to the generic page-image path when it can't be fetched.
  // The thumbnail URL is derived server-side from the bookmark's own stored URL (never a client
  // value), so this keeps the SSRF-safe invariant of the og:image path.
  let bytes: Buffer | null = null;
  let grabError: ImageAutoGrabError | null = null;

  if (isYouTubeVideoUrl(bookmark.url)) {
    bytes = await fetchYouTubeThumbnail(bookmark.url);
    if (bytes) {
      console.info(`[youtube-enrich] image: using YouTube thumbnail for ${bookmarkId}`);
    }
    else {
      console.warn(`[youtube-enrich] image: YouTube thumbnail unavailable for ${bookmarkId}; falling back to og:image`);
      const r = await fetchOgImage(bookmark.url);
      if (typeof r === "string") grabError = r;
      else bytes = r;
    }
  }
  else if (findOEmbedProvider(bookmark.url)) {
    bytes = await fetchOEmbedThumbnail(bookmark.url);
    if (bytes) {
      console.info(`[oembed] image: using oEmbed thumbnail for ${bookmarkId}`);
    }
    else {
      console.warn(`[oembed] image: oEmbed thumbnail unavailable for ${bookmarkId}; falling back to og:image`);
      const r = await fetchOgImage(bookmark.url);
      if (typeof r === "string") grabError = r;
      else bytes = r;
    }
  }
  else {
    const r = await fetchOgImage(bookmark.url);
    if (typeof r === "string") grabError = r;
    else bytes = r;
  }

  if (!bytes) {
    const error = grabError ?? "no_image";
    console.warn(`[image-auto] ${error} for bookmark ${bookmarkId} (${bookmark.url})`);
    await db.update(bookmarks).set({
      imageAutoGrabError: error,
    }).where(eq(bookmarks.id, bookmarkId));
    return error;
  }

  const storeResult = await setBookmarkImage(bookmarkId, bytes, "og");
  if (storeResult === "not_found") return "not_found";
  if (storeResult === "bad_image") {
    console.warn(`[image-auto] bad_image (decode failed) for bookmark ${bookmarkId}`);
    await db.update(bookmarks).set({
      imageAutoGrabError: "bad_image",
    }).where(eq(bookmarks.id, bookmarkId));
    return "bad_image";
  }
  return storeResult;
}
