/**
 * Bookmark-image orchestration: ties the image pipeline (`utils/image`), object storage
 * (`utils/objectStore`), and the `bookmark_images` table together so the routes stay thin.
 */

import type { BookmarkImage, BulkAutoFetchResult } from "@eesimple/types";
import { findOEmbedProvider } from "@eesimple/types";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bookmarkImages, type BookmarkImageRow, bookmarkScreenshots, bookmarks } from "@/db/schema";
import { forgetManifestObject, recordManifestObject } from "@/services/gallery";
import { fetchOgImage } from "@/services/metadata";
import { fetchOEmbedThumbnail } from "@/services/oembed";
import { fetchYouTubeThumbnail, isYouTubeVideoUrl } from "@/services/youtube";
import { processImage } from "@/utils/image";
import { deleteObject, putObject } from "@/utils/objectStore";
import { getActiveHostedEndpoint, getDecryptedHostedApiKey } from "@/services/appSettings";

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

/** Object-storage key for a bookmark's screenshot. Stable per bookmark, so a replace overwrites it. */
function screenshotKeyFor(bookmarkId: string): string {
  return `bookmarks/${bookmarkId}-screenshot.webp`;
}

/** Map a screenshot row to the shared `BookmarkImage` wire type with the screenshot-specific URL. */
export function bookmarkScreenshotFromRow(row: BookmarkImageRow): BookmarkImage {
  return {
    url: `/api/bookmarks/${row.bookmarkId}/screenshot?v=${imageVersion(row)}`,
    width: row.width,
    height: row.height,
    source: "screenshot",
  };
}

/** Read a bookmark's stored screenshot row, or null when it has no screenshot. */
export async function getBookmarkScreenshotRow(bookmarkId: string): Promise<BookmarkImageRow | null> {
  const [row] = await db.select().from(bookmarkScreenshots).where(
    eq(bookmarkScreenshots.bookmarkId, bookmarkId),
  );
  return row ?? null;
}

/** Delete a bookmark's screenshot (object + row). Returns whether one existed. */
export async function removeBookmarkScreenshot(bookmarkId: string): Promise<boolean> {
  const row = await getBookmarkScreenshotRow(bookmarkId);
  if (!row) return false;
  await deleteObject(row.objectKey);
  await db.delete(bookmarkScreenshots).where(eq(bookmarkScreenshots.bookmarkId, bookmarkId));
  await forgetManifestObject(row.objectKey);
  return true;
}

const SCREENSHOT_TIMEOUT_MS = 30_000;

/**
 * Capture a screenshot of the bookmark's page via Browserless, process it, and store it in the
 * `bookmark_screenshots` table. Returns the wire shape, `"not_found"` when the bookmark is gone,
 * `"not_configured"` when no Browserless endpoint is set, or `"bad_image"` on decode failure.
 * Never throws.
 */
export async function takeAndStoreScreenshot(
  bookmarkId: string,
): Promise<BookmarkImage | "not_found" | "not_configured" | "bad_image"> {
  const [bookmark] = await db.select({
    id: bookmarks.id,
    url: bookmarks.url,
  })
    .from(bookmarks).where(eq(bookmarks.id, bookmarkId));
  if (!bookmark) return "not_found";

  const endpoint = await getActiveHostedEndpoint();
  if (!endpoint || !bookmark.url) return "not_configured";
  const token = await getDecryptedHostedApiKey();

  let rawBytes: Buffer | null = null;
  try {
    const res = await fetch(`${endpoint.replace(/\/$/, "")}/chromium/screenshot`, {
      method: "POST",
      redirect: "follow",
      signal: AbortSignal.timeout(SCREENSHOT_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : {}),
      },
      body: JSON.stringify({
        url: bookmark.url,
        options: {
          type: "jpeg",
          quality: 85,
          fullPage: false,
        },
      }),
    });
    if (!res.ok) return "bad_image";
    rawBytes = Buffer.from(await res.arrayBuffer());
  }
  catch {
    return "bad_image";
  }

  const processed = await processImage(rawBytes);
  if (!processed) return "bad_image";

  const objectKey = screenshotKeyFor(bookmarkId);
  await putObject(objectKey, processed.body, processed.contentType);

  const values = {
    bookmarkId,
    objectKey,
    contentType: processed.contentType,
    width: processed.width,
    height: processed.height,
    byteSize: processed.body.byteLength,
    source: "screenshot",
    createdAt: new Date(),
  };
  const [row] = await db
    .insert(bookmarkScreenshots)
    .values(values)
    .onConflictDoUpdate({
      target: bookmarkScreenshots.bookmarkId,
      set: values,
    })
    .returning();
  await recordManifestObject({
    objectKey,
    contentType: processed.contentType,
    byteSize: processed.body.byteLength,
    bookmarkId,
  });
  return bookmarkScreenshotFromRow(row);
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

async function eligibleNoImageBookmarkIds(): Promise<{ id: string }[]> {
  return db
    .select({
      id: bookmarks.id,
    })
    .from(bookmarks)
    .leftJoin(bookmarkImages, eq(bookmarkImages.bookmarkId, bookmarks.id))
    .where(and(isNull(bookmarkImages.bookmarkId), isNull(bookmarks.imageAutoGrabError)));
}

async function batchFetch(
  items: { id: string }[],
  fetchOne: (id: string) => Promise<unknown>,
  onProgress?: (processed: number, total: number) => void,
): Promise<BulkAutoFetchResult> {
  let fetched = 0;
  let failed = 0;
  let processed = 0;
  const BATCH = 3;
  for (let i = 0; i < items.length; i += BATCH) {
    const results = await Promise.allSettled(
      items.slice(i, i + BATCH).map(({
        id,
      }) => fetchOne(id)),
    );
    for (const r of results) {
      if (r.status === "fulfilled") fetched++;
      else failed++;
      processed++;
    }
    onProgress?.(processed, items.length);
  }
  return {
    fetched,
    failed,
  };
}

/**
 * Auto-fetch og:images for all eligible bookmarks (no image, no error) in batches of 3 concurrent
 * requests to avoid hammering external servers. Returns how many succeeded vs. failed.
 * `onProgress` is called after each batch with the running total of processed items.
 */
export async function bulkAutoFetchImages(
  onProgress?: (processed: number, total: number) => void,
): Promise<BulkAutoFetchResult> {
  const eligible = await eligibleNoImageBookmarkIds();
  return batchFetch(eligible, async (id) => {
    const r = await fetchAndStoreOgImage(id);
    if (typeof r === "string") throw new Error(r);
    return r;
  }, onProgress);
}

/**
 * Auto-fetch og:images for all eligible bookmarks (no image, no error), but if the og:image fetch
 * fails for a bookmark, attempt to capture a screenshot as a fallback. Returns how many succeeded
 * vs. failed (a screenshot success counts as fetched).
 * `onProgress` is called after each batch with the running total of processed items.
 */
export async function bulkAutoFetchWithScreenshotFallback(
  onProgress?: (processed: number, total: number) => void,
): Promise<BulkAutoFetchResult> {
  const eligible = await eligibleNoImageBookmarkIds();
  return batchFetch(eligible, async (id) => {
    const ogResult = await fetchAndStoreOgImage(id);
    if (typeof ogResult !== "string") return ogResult;
    // og:image failed (imageAutoGrabError is now set) — try screenshot as fallback.
    const screenshotResult = await takeAndStoreScreenshot(id);
    if (typeof screenshotResult === "string") throw new Error(screenshotResult);
    return screenshotResult;
  }, onProgress);
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
 * Fetch the best available preview image for a URL: YouTube thumbnail → oEmbed thumbnail → og:image.
 * Returns the raw bytes, or `null` + an error string when nothing could be fetched.
 */
async function fetchBestImageBytes(
  url: string,
  bookmarkId: string,
): Promise<{ bytes: Buffer | null;
  grabError: ImageAutoGrabError | null; }> {
  let bytes: Buffer | null = null;
  let grabError: ImageAutoGrabError | null = null;
  if (isYouTubeVideoUrl(url)) {
    bytes = await fetchYouTubeThumbnail(url);
    if (bytes) {
      console.info(`[youtube-enrich] image: using YouTube thumbnail for ${bookmarkId}`);
    }
    else {
      console.warn(`[youtube-enrich] image: YouTube thumbnail unavailable for ${bookmarkId}; falling back to og:image`);
      const r = await fetchOgImage(url);
      if (typeof r === "string") grabError = r;
      else bytes = r;
    }
  }
  else if (findOEmbedProvider(url)) {
    bytes = await fetchOEmbedThumbnail(url);
    if (bytes) {
      console.info(`[oembed] image: using oEmbed thumbnail for ${bookmarkId}`);
    }
    else {
      console.warn(`[oembed] image: oEmbed thumbnail unavailable for ${bookmarkId}; falling back to og:image`);
      const r = await fetchOgImage(url);
      if (typeof r === "string") grabError = r;
      else bytes = r;
    }
  }
  else {
    const r = await fetchOgImage(url);
    if (typeof r === "string") grabError = r;
    else bytes = r;
  }
  return {
    bytes,
    grabError,
  };
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

  const {
    bytes, grabError,
  } = await fetchBestImageBytes(bookmark.url, bookmarkId);

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
