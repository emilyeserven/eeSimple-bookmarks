/**
 * YouTube-channel-avatar orchestration: ties the image pipeline (`utils/image`), object storage
 * (`utils/objectStore`), and the `youtube_channel_images` table together so the routes stay thin.
 * Mirrors `bookmarkImages`. Avatars live under the `youtube-channels/` object-storage prefix —
 * outside the Gallery's `bookmarks/` manifest, so they never surface as deletable orphans.
 *
 * A channel page's `og:image` is the channel avatar, so the generic `fetchOgImage` is exactly right
 * here (no favicon-style icon-link preference needed, unlike websites).
 */

import { eq } from "drizzle-orm";
import { channelUrlFromKey } from "@eesimple/types";
import { db } from "@/db";
import { type YouTubeChannelImageRow, youtubeChannelImages, youtubeChannels } from "@/db/schema";
import { type EntityImageResult, fetchOgImage, withTransientRetry } from "@/services/metadata";
import { processImage } from "@/utils/image";
import { deleteObject, putObject } from "@/utils/objectStore";

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
 * `"not_found"` when the channel is gone / `"bad_image"` when the bytes aren't a decodable image.
 */
async function setYouTubeChannelImage(
  channelId: string,
  rawBytes: Buffer,
  source: "og" | "upload",
): Promise<{ imageUrl: string } | "not_found" | "bad_image"> {
  const [channel] = await db
    .select({
      id: youtubeChannels.id,
    })
    .from(youtubeChannels)
    .where(eq(youtubeChannels.id, channelId));
  if (!channel) return "not_found";

  const processed = await processImage(rawBytes);
  if (!processed) return "bad_image";

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

/** Delete a channel's avatar (object + row). Returns whether one existed. */
export async function removeYouTubeChannelImage(channelId: string): Promise<boolean> {
  const row = await getYouTubeChannelImageRow(channelId);
  if (!row) return false;
  await deleteObject(row.objectKey);
  await db.delete(youtubeChannelImages).where(eq(youtubeChannelImages.youtubeChannelId, channelId));
  return true;
}

/**
 * Fetch a channel's avatar from its public channel page (`og:image`) and store it. The page URL is
 * reconstructed from the stored `channelKey` (never a client-supplied URL — avoids an SSRF
 * amplifier). Returns the serving URL, `"not_found"`, or a typed grab error.
 */
export async function fetchAndStoreChannelImage(channelId: string): Promise<EntityImageResult> {
  const [channel] = await db
    .select({
      channelKey: youtubeChannels.channelKey,
    })
    .from(youtubeChannels)
    .where(eq(youtubeChannels.id, channelId));
  if (!channel) return "not_found";

  const url = channelUrlFromKey(channel.channelKey);
  const result = await withTransientRetry(() => fetchOgImage(url));
  if (typeof result === "string") return result;
  return setYouTubeChannelImage(channelId, result, "og");
}
