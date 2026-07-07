/**
 * Bookmark-image orchestration: ties the image pipeline (`utils/image`), object storage
 * (`utils/objectStore`), and the `bookmark_images` table together so the routes stay thin.
 */

import type { BookmarkImage, BookmarkScreenshotSettings, BulkAutoFetchResult } from "@eesimple/types";
import { findOEmbedProvider } from "@eesimple/types";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bookmarkImages, type BookmarkImageRow, bookmarkScreenshots, type BookmarkScreenshotRow, bookmarks } from "@/db/schema";
import { batchFetch } from "@/services/batchFetch";
import { forgetManifestObject, recordManifestObject } from "@/services/gallery";
import { buildImageCandidates } from "@/services/imageCandidates";
import { downloadImage, fetchOgImage } from "@/services/metadata";
import { fetchOEmbedThumbnail } from "@/services/oembed";
import { fetchYouTubeThumbnail, isYouTubeVideoUrl } from "@/services/youtube";
import { processImage } from "@/utils/image";
import { deleteObject, putObject } from "@/utils/objectStore";
import { getActiveHostedEndpoint, getDecryptedHostedApiKey, getImageProcessingOptions, getImageUrlBlacklist } from "@/services/appSettings";

export type SetImageResult = BookmarkImage | "not_found" | "bad_image";
export type ImageAutoGrabError = "no_image" | "bad_image" | "blocked" | "server_error" | "fetch_error";
export type AutoImageResult = BookmarkImage | "not_found" | ImageAutoGrabError;

/**
 * Object-storage key for one of a bookmark's images, scoped by the image's surrogate id so a
 * bookmark can hold several. Legacy single-image rows keep their original `bookmarks/<id>.webp` key
 * (the serving route reads the stored `objectKey` rather than reconstructing it, so both coexist).
 */
function objectKeyFor(bookmarkId: string, imageId: string): string {
  return `bookmarks/${bookmarkId}/${imageId}.webp`;
}

/** Version token embedded in the serving URL so a replaced image busts the browser cache. */
function imageVersion(row: { createdAt: Date | string }): number {
  const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  return created.getTime();
}

/**
 * A signature-insensitive key for matching candidate URLs across two separate page fetches: the
 * origin + path, dropping the query/hash. Lets a Instagram/CDN image whose expiring token changed
 * between the client's scan and the server's re-derive still be recognised as the same image.
 */
function imageMatchKey(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`;
  }
  catch {
    return rawUrl;
  }
}

/** Order a bookmark's image rows for display: the main image first, then by `sortOrder`, then age. */
function compareImageRows(a: BookmarkImageRow, b: BookmarkImageRow): number {
  if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return imageVersion(a) - imageVersion(b);
}

/** Map a stored-image row to the shared `BookmarkImage` wire type (used by routes and hydration). */
export function bookmarkImageFromRow(row: BookmarkImageRow): BookmarkImage {
  return {
    id: row.id,
    url: `/api/bookmarks/${row.bookmarkId}/images/${row.id}?v=${imageVersion(row)}`,
    width: row.width,
    height: row.height,
    source: row.source === "og" ? "og" : "upload",
    isMain: row.isMain,
    sortOrder: row.sortOrder,
  };
}

/** Object-storage key for a bookmark's screenshot. Stable per bookmark, so a replace overwrites it. */
function screenshotKeyFor(bookmarkId: string): string {
  return `bookmarks/${bookmarkId}-screenshot.webp`;
}

/**
 * Map a screenshot row to the shared `BookmarkImage` wire type with the screenshot-specific URL. A
 * bookmark has at most one screenshot, so it carries the bookmark id as its image id and is never
 * "main" (the real image, when present, always wins).
 */
export function bookmarkScreenshotFromRow(row: BookmarkScreenshotRow): BookmarkImage {
  return {
    id: row.bookmarkId,
    url: `/api/bookmarks/${row.bookmarkId}/screenshot?v=${imageVersion(row)}`,
    width: row.width,
    height: row.height,
    source: "screenshot",
    isMain: false,
    sortOrder: 0,
  };
}

/** Map a screenshot row's stored capture settings to the shared wire type. */
export function bookmarkScreenshotSettingsFromRow(row: BookmarkScreenshotRow): BookmarkScreenshotSettings {
  return {
    delayMs: row.delayMs ?? null,
    width: row.viewportWidth ?? null,
    height: row.viewportHeight ?? null,
    scrollDistance: row.scrollDistance ?? null,
  };
}

/** Read a bookmark's stored screenshot row, or null when it has no screenshot. */
export async function getBookmarkScreenshotRow(bookmarkId: string): Promise<BookmarkScreenshotRow | null> {
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

/** Browser viewport size (in CSS pixels) to render before capturing a screenshot. */
export interface ScreenshotViewport {
  width: number;
  height: number;
}

/**
 * Capture a screenshot of the bookmark's page via Browserless, process it, and store it in the
 * `bookmark_screenshots` table. Returns the wire shape, `"not_found"` when the bookmark is gone,
 * `"not_configured"` when no Browserless endpoint is set, or `"bad_image"` on decode failure.
 * Never throws.
 */
export async function takeAndStoreScreenshot(
  bookmarkId: string,
  delayMs?: number,
  viewport?: ScreenshotViewport,
  scrollDistance?: number,
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

  const screenshotBody: Record<string, unknown> = {
    url: bookmark.url,
    options: {
      type: "jpeg",
      quality: 85,
      fullPage: false,
    },
  };
  if (viewport) {
    screenshotBody.viewport = {
      width: viewport.width,
      height: viewport.height,
    };
  }
  // Browserless v2 deprecated the v1 `waitFor` field in favor of Puppeteer's specific waiting
  // methods; a fixed post-load delay is now `waitForTimeout` (ms). Sending the old `waitFor` key
  // makes v2 reject the request (its body schema disallows unknown properties), which surfaced as a
  // 502 "Screenshot could not be captured" whenever a delay was requested.
  if (delayMs && delayMs > 0) screenshotBody.waitForTimeout = delayMs;
  // Browserless applies `waitForTimeout` before `addScriptTag`, so this scroll runs after the wait
  // above completes — letting a page settle, then scrolling a fixed distance to bring
  // below-the-fold content into the captured viewport before the screenshot is taken.
  if (scrollDistance && scrollDistance > 0) {
    screenshotBody.addScriptTag = [{
      content: `window.scrollBy(0, ${scrollDistance});`,
    }];
  }

  let rawBytes: Buffer | null = null;
  try {
    const res = await fetch(`${endpoint.replace(/\/$/, "")}/chromium/screenshot`, {
      method: "POST",
      redirect: "follow",
      signal: AbortSignal.timeout(SCREENSHOT_TIMEOUT_MS + (delayMs ?? 0)),
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : {}),
      },
      body: JSON.stringify(screenshotBody),
    });
    if (!res.ok) return "bad_image";
    rawBytes = Buffer.from(await res.arrayBuffer());
  }
  catch {
    return "bad_image";
  }

  const processed = await processImage(rawBytes, await getImageProcessingOptions());
  if ("error" in processed) return "bad_image";

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
    delayMs: delayMs ?? null,
    viewportWidth: viewport?.width ?? null,
    viewportHeight: viewport?.height ?? null,
    scrollDistance: scrollDistance ?? null,
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

/** All of a bookmark's image rows, ordered main-first then by `sortOrder`. Empty when it has none. */
export async function listBookmarkImageRows(bookmarkId: string): Promise<BookmarkImageRow[]> {
  const rows = await db
    .select()
    .from(bookmarkImages)
    .where(eq(bookmarkImages.bookmarkId, bookmarkId))
    .orderBy(desc(bookmarkImages.isMain), asc(bookmarkImages.sortOrder), asc(bookmarkImages.createdAt));
  return rows;
}

/**
 * Read a bookmark's main image row (or its first image when none is flagged), or null when it has
 * no images. Back-compat for the legacy `/image` route and the "does it already have an image?" check.
 */
export async function getBookmarkImageRow(bookmarkId: string): Promise<BookmarkImageRow | null> {
  const rows = await listBookmarkImageRows(bookmarkId);
  return rows[0] ?? null;
}

/** Read one specific image row by id (scoped to its bookmark), or null when absent. */
export async function getBookmarkImageRowById(
  bookmarkId: string,
  imageId: string,
): Promise<BookmarkImageRow | null> {
  const [row] = await db
    .select()
    .from(bookmarkImages)
    .where(and(eq(bookmarkImages.bookmarkId, bookmarkId), eq(bookmarkImages.id, imageId)));
  return row ?? null;
}

/** Max kept images per bookmark — guards runaway storage from a large carousel. */
export const MAX_BOOKMARK_IMAGES = 12;

/**
 * Process `rawBytes`, store the bytes under a per-image key, and insert a new image row. Returns the
 * wire shape, `"not_found"` when the bookmark is gone, or `"bad_image"` when the bytes aren't a
 * decodable image. The image becomes the bookmark's main when `setMain` is set or it's the first one.
 */
async function storeImageRow(
  bookmarkId: string,
  processed: { body: Buffer;
    contentType: string;
    width: number;
    height: number; },
  source: "upload" | "og",
  opts: { isMain: boolean;
    sortOrder: number; },
): Promise<BookmarkImageRow> {
  const id = randomUUID();
  const objectKey = objectKeyFor(bookmarkId, id);
  await putObject(objectKey, processed.body, processed.contentType);

  const [row] = await db
    .insert(bookmarkImages)
    .values({
      id,
      bookmarkId,
      objectKey,
      contentType: processed.contentType,
      width: processed.width,
      height: processed.height,
      byteSize: processed.body.byteLength,
      source,
      isMain: opts.isMain,
      sortOrder: opts.sortOrder,
      createdAt: new Date(),
    })
    .returning();
  // Keep the bucket manifest in sync so the Gallery reflects the upload before any scan runs.
  await recordManifestObject({
    objectKey,
    contentType: processed.contentType,
    byteSize: processed.body.byteLength,
    bookmarkId,
  });
  return row;
}

/** Delete every image object + row for a bookmark (and forget them in the manifest). */
async function deleteAllBookmarkImages(bookmarkId: string): Promise<void> {
  const rows = await listBookmarkImageRows(bookmarkId);
  for (const row of rows) {
    await deleteObject(row.objectKey);
    await forgetManifestObject(row.objectKey);
  }
  if (rows.length > 0) {
    await db.delete(bookmarkImages).where(eq(bookmarkImages.bookmarkId, bookmarkId));
  }
}

/**
 * Add an image to a bookmark, keeping its other images. Returns the wire shape, `"not_found"` when
 * the bookmark is gone, `"bad_image"` for undecodable bytes, or `"too_many"` once the per-bookmark
 * cap is reached. The new image is made main when `setMain` is set or it's the bookmark's first.
 */
export async function addBookmarkImage(
  bookmarkId: string,
  rawBytes: Buffer,
  source: "upload" | "og",
  opts?: { setMain?: boolean },
): Promise<SetImageResult | "too_many"> {
  const [bookmark] = await db.select({
    id: bookmarks.id,
  }).from(bookmarks).where(eq(bookmarks.id, bookmarkId));
  if (!bookmark) return "not_found";

  const existing = await listBookmarkImageRows(bookmarkId);
  if (existing.length >= MAX_BOOKMARK_IMAGES) return "too_many";

  const processed = await processImage(rawBytes, await getImageProcessingOptions());
  if ("error" in processed) return "bad_image";

  const makeMain = opts?.setMain === true || existing.length === 0;
  if (makeMain && existing.length > 0) {
    await db.update(bookmarkImages).set({
      isMain: false,
    }).where(eq(bookmarkImages.bookmarkId, bookmarkId));
  }
  const nextSortOrder = existing.reduce((max, r) => Math.max(max, r.sortOrder), -1) + 1;
  const row = await storeImageRow(bookmarkId, processed, source, {
    isMain: makeMain,
    sortOrder: nextSortOrder,
  });
  // Clear any previous auto-grab error: a new image (upload or auto) resolves the failure.
  await db.update(bookmarks).set({
    imageAutoGrabError: null,
  }).where(eq(bookmarks.id, bookmarkId));
  return bookmarkImageFromRow(row);
}

/**
 * Replace ALL of a bookmark's images with a single main image. The back-compat path for the legacy
 * `/image` upload route, the gallery attach, and the auto/bulk capture (which conceptually set "the"
 * image). Returns the wire shape, `"not_found"`, or `"bad_image"`.
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

  const processed = await processImage(rawBytes, await getImageProcessingOptions());
  if ("error" in processed) return "bad_image";

  await deleteAllBookmarkImages(bookmarkId);
  const row = await storeImageRow(bookmarkId, processed, source, {
    isMain: true,
    sortOrder: 0,
  });
  // Clear any previous auto-grab error: a new image (upload or auto) resolves the failure.
  await db.update(bookmarks).set({
    imageAutoGrabError: null,
  }).where(eq(bookmarks.id, bookmarkId));
  return bookmarkImageFromRow(row);
}

/**
 * Make `imageId` the bookmark's main image (clearing the flag on its siblings). Returns the new main
 * image's wire shape, or `"not_found"` when the bookmark has no such image.
 */
export async function setMainImage(
  bookmarkId: string,
  imageId: string,
): Promise<BookmarkImage | "not_found"> {
  const target = await getBookmarkImageRowById(bookmarkId, imageId);
  if (!target) return "not_found";
  await db.update(bookmarkImages).set({
    isMain: false,
  }).where(eq(bookmarkImages.bookmarkId, bookmarkId));
  const [row] = await db
    .update(bookmarkImages)
    .set({
      isMain: true,
    })
    .where(and(eq(bookmarkImages.bookmarkId, bookmarkId), eq(bookmarkImages.id, imageId)))
    .returning();
  return bookmarkImageFromRow(row);
}

/**
 * Delete one image (object + row). When it was the main image and others remain, the next image (by
 * display order) is promoted to main so a bookmark never loses its main while keeping images.
 * Returns whether the image existed.
 */
export async function removeBookmarkImageById(
  bookmarkId: string,
  imageId: string,
): Promise<boolean> {
  const rows = await listBookmarkImageRows(bookmarkId);
  const target = rows.find(r => r.id === imageId);
  if (!target) return false;
  await deleteObject(target.objectKey);
  await db.delete(bookmarkImages).where(
    and(eq(bookmarkImages.bookmarkId, bookmarkId), eq(bookmarkImages.id, imageId)),
  );
  await forgetManifestObject(target.objectKey);
  if (target.isMain) {
    const next = rows.filter(r => r.id !== imageId).sort(compareImageRows)[0];
    if (next) {
      await db.update(bookmarkImages).set({
        isMain: true,
      }).where(and(eq(bookmarkImages.bookmarkId, bookmarkId), eq(bookmarkImages.id, next.id)));
    }
  }
  return true;
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

/**
 * Auto-fetch og:images for all eligible bookmarks (no image, no error) in batches of 3 concurrent
 * requests to avoid hammering external servers. Returns how many succeeded vs. failed.
 * `onProgress` is called after each batch with the running total of processed items.
 */
export async function bulkAutoFetchImages(
  onProgress?: (processed: number, total: number) => void,
): Promise<BulkAutoFetchResult> {
  const eligible = await eligibleNoImageBookmarkIds();
  return batchFetch(eligible, async ({
    id,
  }) => {
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
  return batchFetch(eligible, async ({
    id,
  }) => {
    const ogResult = await fetchAndStoreOgImage(id);
    if (typeof ogResult !== "string") return ogResult;
    // og:image failed (imageAutoGrabError is now set) — try screenshot as fallback.
    const screenshotResult = await takeAndStoreScreenshot(id);
    if (typeof screenshotResult === "string") throw new Error(screenshotResult);
    return screenshotResult;
  }, onProgress);
}

/**
 * Capture and store images chosen from a URL scan. SSRF-safe: it re-derives the page's allowed image
 * candidates from the bookmark's OWN stored URL (never trusting the client's URLs as fetch targets)
 * and only stores the requested URLs that are genuinely candidates of that page. Returns the
 * bookmark's full image list, or `"not_found"` when the bookmark is gone. Best-effort per image —
 * an undecodable/unfetchable candidate is skipped.
 */
export async function storeBookmarkImagesFromCandidates(
  bookmarkId: string,
  requestedUrls: string[],
  mainUrl?: string | null,
): Promise<BookmarkImage[] | "not_found"> {
  const [bookmark] = await db.select({
    id: bookmarks.id,
    url: bookmarks.url,
  }).from(bookmarks).where(eq(bookmarks.id, bookmarkId));
  if (!bookmark) return "not_found";
  if (!bookmark.url) return [];

  const requested = new Set(requestedUrls.map(imageMatchKey));
  const mainKey = mainUrl != null ? imageMatchKey(mainUrl) : null;
  const allowed = await buildImageCandidates({
    url: bookmark.url,
    blacklist: await getImageUrlBlacklist(),
  });
  // Keep the page's candidate ordering; only store URLs the client asked to keep AND that the page
  // actually exposes. Match on origin+path (not the full URL) so a candidate whose CDN signature
  // changed between the client's scan and this fresh re-derive (e.g. Instagram's expiring tokens)
  // still matches — but we ALWAYS download the server's freshly-derived URL, never the client's.
  const toStore = allowed.filter(candidate => requested.has(imageMatchKey(candidate.url)));

  for (const candidate of toStore) {
    const bytes = await downloadImage(candidate.url, bookmark.url);
    if (!bytes) continue;
    const result = await addBookmarkImage(bookmarkId, bytes, "og", {
      setMain: mainKey != null && imageMatchKey(candidate.url) === mainKey,
    });
    // Stop once the per-bookmark cap is hit; remaining candidates are silently dropped.
    if (result === "too_many") break;
  }

  const rows = await listBookmarkImageRows(bookmarkId);
  return rows.map(bookmarkImageFromRow);
}

/** Delete ALL of a bookmark's images (objects + rows). Returns whether any existed. */
export async function removeBookmarkImage(bookmarkId: string): Promise<boolean> {
  const rows = await listBookmarkImageRows(bookmarkId);
  if (rows.length === 0) return false;
  await deleteAllBookmarkImages(bookmarkId);
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
