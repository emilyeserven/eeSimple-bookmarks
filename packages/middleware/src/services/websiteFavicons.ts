/**
 * Website-favicon orchestration: ties the image pipeline (`utils/image`), object storage
 * (`utils/objectStore`), and the `website_favicons` table together so the routes stay thin.
 * Mirrors `bookmarkImages`. Favicons live under the `website-favicons/` object-storage prefix —
 * outside the Gallery's `bookmarks/` manifest, so they never surface as deletable orphans.
 *
 * Unlike a bookmark's preview image, a favicon is the site's small icon, so this prefers declared
 * icon links (via `fetchFaviconImage`) over the large `og:image` share card.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { type WebsiteFaviconRow, websiteFavicons, websites } from "@/db/schema";
import { type EntityImageResult, fetchFaviconImage, withTransientRetry } from "@/services/metadata";
import { processImage } from "@/utils/image";
import { deleteObject, putObject } from "@/utils/objectStore";

/** Object-storage key for a website's favicon. Stable per website, so a replace overwrites it. */
function objectKeyFor(websiteId: string): string {
  return `website-favicons/${websiteId}.webp`;
}

/** Version token embedded in the serving URL so a replaced favicon busts the browser cache. */
function imageVersion(row: WebsiteFaviconRow): number {
  const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  return created.getTime();
}

/** Serving URL (with a `?v=` cache-buster) for a website's stored favicon. */
export function websiteFaviconUrl(row: WebsiteFaviconRow): string {
  return `/api/websites/${row.websiteId}/image?v=${imageVersion(row)}`;
}

/** Read a website's stored-favicon row, or null when it has none. */
export async function getWebsiteFaviconRow(websiteId: string): Promise<WebsiteFaviconRow | null> {
  const [row] = await db
    .select()
    .from(websiteFavicons)
    .where(eq(websiteFavicons.websiteId, websiteId));
  return row ?? null;
}

/**
 * Process `rawBytes`, store them, and upsert the website's favicon row. Returns the serving URL, or
 * `"not_found"` when the website is gone / `"bad_image"` when the bytes aren't a decodable image.
 */
async function setWebsiteFavicon(
  websiteId: string,
  rawBytes: Buffer,
  source: "icon" | "og" | "upload",
): Promise<{ imageUrl: string } | "not_found" | "bad_image"> {
  const [website] = await db
    .select({
      id: websites.id,
    })
    .from(websites)
    .where(eq(websites.id, websiteId));
  if (!website) return "not_found";

  const processed = await processImage(rawBytes);
  if (!processed) return "bad_image";

  const objectKey = objectKeyFor(websiteId);
  await putObject(objectKey, processed.body, processed.contentType);

  // Bump `createdAt` on replace too, so the serving URL's version changes and caches refresh.
  const values = {
    websiteId,
    objectKey,
    contentType: processed.contentType,
    width: processed.width,
    height: processed.height,
    byteSize: processed.body.byteLength,
    source,
    createdAt: new Date(),
  };
  const [row] = await db
    .insert(websiteFavicons)
    .values(values)
    .onConflictDoUpdate({
      target: websiteFavicons.websiteId,
      set: values,
    })
    .returning();
  // Clear any previous auto-grab error: a new image (upload or auto) resolves the failure.
  await db.update(websites).set({ faviconAutoGrabError: null }).where(eq(websites.id, websiteId));
  return {
    imageUrl: websiteFaviconUrl(row),
  };
}

/**
 * Store a user-uploaded favicon from raw bytes (replacing any existing one). Returns the serving
 * URL, `"not_found"` when the website is gone, or `"bad_image"` when the bytes aren't decodable.
 */
export async function setWebsiteFaviconFromBytes(
  websiteId: string,
  rawBytes: Buffer,
): Promise<{ imageUrl: string } | "not_found" | "bad_image"> {
  return setWebsiteFavicon(websiteId, rawBytes, "upload");
}

/** Delete a website's favicon (object + row). Returns whether one existed. */
export async function removeWebsiteFavicon(websiteId: string): Promise<boolean> {
  const row = await getWebsiteFaviconRow(websiteId);
  if (!row) return false;
  await deleteObject(row.objectKey);
  await db.delete(websiteFavicons).where(eq(websiteFavicons.websiteId, websiteId));
  // Clear any stored grab error so the button re-enables after a manual remove.
  await db.update(websites).set({ faviconAutoGrabError: null }).where(eq(websites.id, websiteId));
  return true;
}

/**
 * Fetch a website's favicon from its homepage (icon link, then `og:image`, then `/favicon.ico`) and
 * store it. The page URL is derived from the website's own normalized `domain` (never a
 * client-supplied URL — avoids an SSRF amplifier). Returns the serving URL, `"not_found"`, or a
 * typed grab error.
 */
export async function fetchAndStoreWebsiteFavicon(websiteId: string): Promise<EntityImageResult> {
  const [website] = await db
    .select({
      domain: websites.domain,
    })
    .from(websites)
    .where(eq(websites.id, websiteId));
  if (!website) return "not_found";

  const pageUrl = `https://${website.domain}/`;
  const result = await withTransientRetry(() => fetchFaviconImage(pageUrl));
  if (typeof result === "string") {
    await db.update(websites).set({ faviconAutoGrabError: result }).where(eq(websites.id, websiteId));
    return result;
  }
  const storeResult = await setWebsiteFavicon(websiteId, result, "icon");
  if (storeResult === "bad_image") {
    await db.update(websites).set({ faviconAutoGrabError: "bad_image" }).where(eq(websites.id, websiteId));
    return "bad_image";
  }
  return storeResult;
}
