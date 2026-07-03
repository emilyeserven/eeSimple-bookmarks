/**
 * YouTube-channel-avatar orchestration: ties the image pipeline (`utils/image`), object storage
 * (`utils/objectStore`), and the `youtube_channel_images` table together so the routes stay thin.
 * Mirrors `bookmarkImages`. Avatars live under the `youtube-channels/` object-storage prefix —
 * outside the Gallery's `bookmarks/` manifest, so they never surface as deletable orphans.
 *
 * A channel page's `og:image` is the channel avatar, so the generic `fetchOgImage` was originally
 * used to grab it directly (no favicon-style icon-link preference needed, unlike websites). YouTube
 * has since tightened bot-detection on channel pages specifically — they now routinely 403
 * non-browser requests even with browser-shaped headers — so the scrape alone is no longer reliable.
 * When a YouTube Data API key is configured (Tier 2 — Settings → Connectors or the `YOUTUBE_API_KEY`
 * env var), the stable Data API `channels.list` thumbnail is preferred; the scrape remains the
 * keyless fallback so behavior is unchanged when the key isn't configured.
 */

import type { BulkAutoFetchResult } from "@eesimple/types";
import { eq, isNull } from "drizzle-orm";
import { channelUrlFromKey } from "@eesimple/types";
import { db } from "@/db";
import { type YouTubeChannelImageRow, youtubeChannelImages, youtubeChannels } from "@/db/schema";
import { batchFetch } from "@/services/batchFetch";
import { downloadImage, type EntityImageResult, extractImageUrl, fetchHeadOrImageError, fetchOgImage, isPublicHttpUrl, withTransientRetry } from "@/services/metadata";
import { fetchChannelAvatarUrlViaApi } from "@/services/youtube";
import { processImage } from "@/utils/image";
import { deleteObject, putObject } from "@/utils/objectStore";

/**
 * A successful grab/store returns the serving URL; `"not_found"` when the channel is gone; a typed
 * download-failure string (shared with the website-favicon/person-avatar pipelines); or a
 * `{ code: "bad_image" }` result carrying the underlying sharp decode error's message, so the
 * client can surface (and console-log) the real reason instead of an opaque "bad_image".
 */
export type ChannelImageResult = EntityImageResult | { code: "bad_image";
  detail: string; };

/** Object-storage key for a channel's avatar. Stable per channel, so a replace overwrites it. */
function objectKeyFor(channelId: string): string {
  return `youtube-channels/${channelId}.webp`;
}

/** Version token embedded in the serving URL so a replaced avatar busts the browser cache. */
function imageVersion(row: YouTubeChannelImageRow): number {
  const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  return created.getTime();
}

/** Serving URL (with a `?v=` cache-buster) for a channel's stored avatar. */
export function youtubeChannelImageUrl(row: YouTubeChannelImageRow): string {
  return `/api/youtube-channels/${row.youtubeChannelId}/image?v=${imageVersion(row)}`;
}

/** Read a channel's stored-avatar row, or null when it has none. */
export async function getYouTubeChannelImageRow(channelId: string): Promise<YouTubeChannelImageRow | null> {
  const [row] = await db
    .select()
    .from(youtubeChannelImages)
    .where(eq(youtubeChannelImages.youtubeChannelId, channelId));
  return row ?? null;
}

/**
 * Process `rawBytes`, store them, and upsert the channel's avatar row. Returns the serving URL, or
 * `"not_found"` when the channel is gone / a `{ code: "bad_image" }` result (carrying the
 * underlying decode error's message) when the bytes aren't a decodable image.
 */
async function setYouTubeChannelImage(
  channelId: string,
  rawBytes: Buffer,
  source: "og" | "upload",
): Promise<{ imageUrl: string } | "not_found" | { code: "bad_image";
  detail: string; }> {
  const [channel] = await db
    .select({
      id: youtubeChannels.id,
    })
    .from(youtubeChannels)
    .where(eq(youtubeChannels.id, channelId));
  if (!channel) return "not_found";

  const processed = await processImage(rawBytes);
  if ("error" in processed) {
    return {
      code: "bad_image",
      detail: processed.error,
    };
  }

  const objectKey = objectKeyFor(channelId);
  await putObject(objectKey, processed.body, processed.contentType);

  // Bump `createdAt` on replace too, so the serving URL's version changes and caches refresh.
  const values = {
    youtubeChannelId: channelId,
    objectKey,
    contentType: processed.contentType,
    width: processed.width,
    height: processed.height,
    byteSize: processed.body.byteLength,
    source,
    createdAt: new Date(),
  };
  const [row] = await db
    .insert(youtubeChannelImages)
    .values(values)
    .onConflictDoUpdate({
      target: youtubeChannelImages.youtubeChannelId,
      set: values,
    })
    .returning();
  return {
    imageUrl: youtubeChannelImageUrl(row),
  };
}

/**
 * Store a user-uploaded avatar from raw bytes (replacing any existing one). Returns the serving
 * URL, `"not_found"` when the channel is gone, or a `bad_image` result when the bytes aren't
 * decodable.
 */
export async function setYouTubeChannelImageFromBytes(
  channelId: string,
  rawBytes: Buffer,
): Promise<{ imageUrl: string } | "not_found" | { code: "bad_image";
  detail: string; }> {
  return setYouTubeChannelImage(channelId, rawBytes, "upload");
}

/** Delete a channel's avatar (object + row). Returns whether one existed. */
export async function removeYouTubeChannelImage(channelId: string): Promise<boolean> {
  const row = await getYouTubeChannelImageRow(channelId);
  if (!row) return false;
  await deleteObject(row.objectKey);
  await db.delete(youtubeChannelImages).where(eq(youtubeChannelImages.youtubeChannelId, channelId));
  return true;
}

/** Fetch and store a channel's avatar from its already-known `channelKey`, avoiding a re-lookup. */
async function fetchAndStoreChannelAvatar(channelId: string, channelKey: string): Promise<ChannelImageResult> {
  const apiImageUrl = await fetchChannelAvatarUrlViaApi(channelKey);
  if (apiImageUrl && isPublicHttpUrl(apiImageUrl)) {
    const bytes = await downloadImage(apiImageUrl);
    if (bytes) return setYouTubeChannelImage(channelId, bytes, "og");
  }

  const url = channelUrlFromKey(channelKey);
  const result = await withTransientRetry(() => fetchOgImage(url));
  if (typeof result === "string") return result;
  return setYouTubeChannelImage(channelId, result, "og");
}

/**
 * Fetch a channel's avatar from its public channel page (`og:image`) and store it. The page URL is
 * reconstructed from the stored `channelKey` (never a client-supplied URL — avoids an SSRF
 * amplifier). Returns the serving URL, `"not_found"`, or a typed grab error.
 */
export async function fetchAndStoreChannelImage(channelId: string): Promise<ChannelImageResult> {
  const [channel] = await db
    .select({
      channelKey: youtubeChannels.channelKey,
    })
    .from(youtubeChannels)
    .where(eq(youtubeChannels.id, channelId));
  if (!channel) return "not_found";

  return fetchAndStoreChannelAvatar(channelId, channel.channelKey);
}

/**
 * Resolve a channel's source avatar URL WITHOUT downloading or storing it — the same candidate the
 * auto-fetch (`fetchAndStoreChannelImage`) would grab, so a client can preview the new avatar before
 * applying. Prefers the YouTube Data API thumbnail (when a key is configured), else scrapes the
 * channel page's `og:image`. Returns the first public http(s) URL, or `null` when the channel is gone
 * or nothing resolves. The page URL is reconstructed from the stored `channelKey` (never a client
 * value — avoids an SSRF amplifier).
 */
export async function resolveChannelAvatarUrl(channelId: string): Promise<string | null> {
  const [channel] = await db
    .select({
      channelKey: youtubeChannels.channelKey,
    })
    .from(youtubeChannels)
    .where(eq(youtubeChannels.id, channelId));
  if (!channel) return null;

  const apiImageUrl = await fetchChannelAvatarUrlViaApi(channel.channelKey);
  if (apiImageUrl && isPublicHttpUrl(apiImageUrl)) return apiImageUrl;

  const pageUrl = channelUrlFromKey(channel.channelKey);
  const html = await fetchHeadOrImageError(pageUrl);
  if (typeof html !== "string") return null;
  const imageUrl = extractImageUrl(html, pageUrl);
  return imageUrl && isPublicHttpUrl(imageUrl) ? imageUrl : null;
}

/** Channels with no stored avatar row, eligible for bulk backfill. */
async function eligibleNoImageChannels(): Promise<{ id: string;
  channelKey: string; }[]> {
  return db
    .select({
      id: youtubeChannels.id,
      channelKey: youtubeChannels.channelKey,
    })
    .from(youtubeChannels)
    .leftJoin(youtubeChannelImages, eq(youtubeChannelImages.youtubeChannelId, youtubeChannels.id))
    .where(isNull(youtubeChannelImages.youtubeChannelId));
}

/** Channels currently missing an avatar, eligible for bulk backfill. */
export async function countMissingChannelImages(): Promise<number> {
  return (await eligibleNoImageChannels()).length;
}

/**
 * Auto-fetch avatars for all channels currently missing one, in batches of 3 concurrent requests to
 * avoid rate-limiting. Returns how many succeeded vs. failed. `onProgress` is called after each
 * batch with the running total of processed channels.
 */
export async function bulkBackfillChannelImages(
  onProgress?: (processed: number, total: number) => void,
): Promise<BulkAutoFetchResult> {
  const eligible = await eligibleNoImageChannels();
  return batchFetch(eligible, async ({
    id, channelKey,
  }) => {
    const r = await fetchAndStoreChannelAvatar(id, channelKey);
    if (typeof r === "string") throw new Error(r);
    if ("code" in r) throw new Error(r.detail);
    return r;
  }, onProgress);
}
