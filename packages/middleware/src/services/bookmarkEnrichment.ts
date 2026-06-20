import { eq } from "drizzle-orm";
import type {
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  YouTubeChannelHint,
} from "@eesimple/types";
import { db } from "@/db";
import { youtubeChannels, youtubeChannelTags } from "@/db/schema";
import { fetchAndStoreOgImage } from "@/services/bookmarkImages";
import { getDatePostedPropertyId, getRuntimePropertyId } from "@/services/customProperties";
import { getMediaTypeBySlug } from "@/services/mediaTypes";
import { fetchAndStoreWebsiteFavicon, getWebsiteFaviconRow } from "@/services/websiteFavicons";
import { fetchYouTubeMetadata, isYouTubeVideoUrl, parseYouTubeVideo, type YouTubeMetadata } from "@/services/youtube";
import { fetchAndStoreChannelImage, getYouTubeChannelImageRow } from "@/services/youtubeChannelImages";
import { channelKeyFromUrl } from "@/services/youtubeChannels";
import { isObjectStoreConfigured } from "@/utils/objectStore";

/** Slug of the built-in "Video" media type, defaulted onto YouTube-video bookmarks. */
const VIDEO_MEDIA_TYPE_SLUG = "video";

/** Tagged log line so the whole YouTube enrichment path is greppable in production. */
export function ytLog(level: "info" | "warn", message: string, err?: unknown): void {
  const line = `[youtube-enrich] ${message}`;
  if (level === "warn") err === undefined ? console.warn(line) : console.warn(line, err);
  else console.info(line);
}

/**
 * Derive the `{ key, name }` channel hint from a client-supplied hint or already-fetched YouTube
 * metadata. Pure — the network fetch happens once in the caller and is reused for media type and
 * duration too. A client hint wins; otherwise fall back to the metadata's channel. Returns `null`
 * when neither yields a usable channel.
 */
export function channelHintFrom(
  hint: YouTubeChannelHint | null | undefined,
  meta: YouTubeMetadata | null,
): { key: string;
  name: string;
  selfIds?: string[]; } | null {
  if (hint && hint.key.trim() && hint.name.trim()) {
    return {
      key: hint.key.trim(),
      name: hint.name.trim(),
      selfIds: hint.selfIds,
    };
  }
  if (meta?.channelName && meta.channelUrl) {
    const key = channelKeyFromUrl(meta.channelUrl);
    if (key) return {
      key,
      name: meta.channelName,
    };
  }
  return null;
}

/** The built-in "Video" media type id, or `null` when it hasn't been seeded yet. */
export async function videoMediaTypeId(): Promise<string | null> {
  const type = await getMediaTypeBySlug(VIDEO_MEDIA_TYPE_SLUG);
  return type?.id ?? null;
}

/**
 * Append the video's duration to a bookmark's number values as the built-in "Runtime" property,
 * unless the metadata has no duration or the caller already supplied a value for that property
 * (a user edit always wins). Returns the (possibly extended) array. `ctx` labels the log.
 */
export async function withRuntime(
  numberValues: BookmarkNumberValue[],
  meta: YouTubeMetadata | null,
  ctx: string,
): Promise<BookmarkNumberValue[]> {
  if (meta?.durationSeconds == null) return numberValues;
  const runtimePropId = await getRuntimePropertyId();
  if (!runtimePropId) {
    ytLog("warn", `${ctx}: "runtime" property missing; duration ${meta.durationSeconds}s not stored`);
    return numberValues;
  }
  if (numberValues.some(value => value.propertyId === runtimePropId)) {
    ytLog("info", `${ctx}: Runtime already supplied; keeping caller value`);
    return numberValues;
  }
  ytLog("info", `${ctx}: filled Runtime = ${meta.durationSeconds}s`);
  return [
    ...numberValues,
    {
      propertyId: runtimePropId,
      value: meta.durationSeconds,
    },
  ];
}

/**
 * Append the video's publish date to a bookmark's datetime values as the built-in "Date Posted"
 * property, unless the metadata has no date or the caller already supplied a value for that
 * property (a user edit always wins). Returns the (possibly extended) array. `ctx` labels the log.
 */
export async function withDatePosted(
  dateTimeValues: BookmarkDateTimeValue[],
  meta: YouTubeMetadata | null,
  ctx: string,
): Promise<BookmarkDateTimeValue[]> {
  if (meta?.datePosted == null) return dateTimeValues;
  const datePostedPropId = await getDatePostedPropertyId();
  if (!datePostedPropId) {
    ytLog("warn", `${ctx}: "date-posted" property missing; date "${meta.datePosted}" not stored`);
    return dateTimeValues;
  }
  if (dateTimeValues.some(value => value.propertyId === datePostedPropId)) {
    ytLog("info", `${ctx}: Date Posted already supplied; keeping caller value`);
    return dateTimeValues;
  }
  ytLog("info", `${ctx}: filled Date Posted = ${meta.datePosted}`);
  return [
    ...dateTimeValues,
    {
      propertyId: datePostedPropId,
      value: meta.datePosted,
    },
  ];
}

/**
 * Best-effort thumbnail capture for a YouTube-video bookmark: pulls the oEmbed thumbnail (falling
 * back to og:image) and stores it. Never throws — a failure here must not fail the create/update.
 * Skips silently when object storage isn't configured. `ctx` labels the log.
 */
export async function captureYouTubeThumbnail(bookmarkId: string, ctx: string): Promise<void> {
  if (!isObjectStoreConfigured()) {
    ytLog("info", `${ctx}: thumbnail skipped (object store not configured) for ${bookmarkId}`);
    return;
  }
  try {
    const result = await fetchAndStoreOgImage(bookmarkId);
    ytLog("info", `${ctx}: thumbnail capture result=${typeof result === "string" ? result : "stored"} for ${bookmarkId}`);
  }
  catch (err) {
    ytLog("warn", `${ctx}: thumbnail capture threw for ${bookmarkId}`, err);
  }
}

/**
 * Best-effort favicon capture for the website a bookmark was just linked to. Fetches and stores the
 * site's favicon only when it has none yet, so the first bookmark for a domain populates the icon
 * and later ones skip the network round-trip. Never throws; skips when object storage is unconfigured.
 */
export async function captureWebsiteFavicon(websiteId: string | null, ctx: string): Promise<void> {
  if (!websiteId || !isObjectStoreConfigured()) return;
  try {
    if (await getWebsiteFaviconRow(websiteId)) return;
    const result = await fetchAndStoreWebsiteFavicon(websiteId);
    ytLog("info", `${ctx}: favicon capture result=${typeof result === "string" ? result : "stored"} for website ${websiteId}`);
  }
  catch (err) {
    ytLog("warn", `${ctx}: favicon capture threw for website ${websiteId}`, err);
  }
}

/**
 * Best-effort avatar capture for the YouTube channel a bookmark was just linked to. Fetches and
 * stores the channel's avatar (its page `og:image`) only when it has none yet — so the first
 * bookmark for a channel populates the avatar and later ones skip the network round-trip. Never
 * throws; skips when object storage is unconfigured.
 */
export async function captureChannelAvatar(channelId: string | null, ctx: string): Promise<void> {
  if (!channelId || !isObjectStoreConfigured()) return;
  try {
    if (await getYouTubeChannelImageRow(channelId)) return;
    const result = await fetchAndStoreChannelImage(channelId);
    ytLog("info", `${ctx}: avatar capture result=${typeof result === "string" ? result : "stored"} for channel ${channelId}`);
  }
  catch (err) {
    ytLog("warn", `${ctx}: avatar capture threw for channel ${channelId}`, err);
  }
}

/**
 * Fetch a YouTube video's metadata once (network) and log what resolved, or `null` for non-videos.
 * Callers reuse the result for the channel, media-type default, and duration backfill so a create or
 * update makes at most one metadata round-trip.
 */
export async function resolveYouTubeMeta(url: string, ctx: string): Promise<YouTubeMetadata | null> {
  if (!isYouTubeVideoUrl(url)) return null;
  const video = parseYouTubeVideo(url);
  ytLog("info", `${ctx}: detected YouTube video id=${video?.videoId ?? "?"} url=${url}`);
  const meta = await fetchYouTubeMetadata(url);
  if (!meta) {
    ytLog("warn", `${ctx}: metadata fetch FAILED (oEmbed/watch page unreachable) url=${url}`);
  }
  else {
    ytLog("info", `${ctx}: metadata resolved title=${meta.title != null} channel=${meta.channelName != null} duration=${meta.durationSeconds != null} thumbnail=${meta.thumbnailUrl != null}`);
  }
  return meta;
}

/** Fetch just the categoryId of a YouTube channel by channelKey, or null when absent/uncategorized. */
export async function getChannelCategoryId(channelKey: string): Promise<string | null> {
  const [row] = await db.select({
    categoryId: youtubeChannels.categoryId,
  }).from(youtubeChannels).where(eq(youtubeChannels.channelKey, channelKey));
  return row?.categoryId ?? null;
}

/** Fetch the default mediaTypeId of a YouTube channel by channelKey, or null when absent/unset. */
export async function getChannelMediaTypeId(channelKey: string): Promise<string | null> {
  const [row] = await db.select({
    mediaTypeId: youtubeChannels.mediaTypeId,
  }).from(youtubeChannels).where(eq(youtubeChannels.channelKey, channelKey));
  return row?.mediaTypeId ?? null;
}

/** Fetch the default tag ids for a YouTube channel by channelKey. */
export async function getChannelTagIds(channelKey: string): Promise<string[]> {
  const [channel] = await db.select({
    id: youtubeChannels.id,
  }).from(youtubeChannels).where(eq(youtubeChannels.channelKey, channelKey));
  if (!channel) return [];
  const rows = await db.select({
    tagId: youtubeChannelTags.tagId,
  }).from(youtubeChannelTags).where(eq(youtubeChannelTags.channelId, channel.id));
  return rows.map(r => r.tagId);
}
