import { and, desc, eq, ilike, inArray, like, ne, or } from "drizzle-orm";
import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkImage,
  BookmarkMediaType,
  BookmarkNumberValue,
  BookmarkTag,
  BookmarkUrlDuplicateResult,
  BookmarkUrlSummary,
  BookmarkWebsite,
  BookmarkYouTubeChannel,
  BulkUrlUpdate,
  BulkUrlUpdateResult,
  CreateBookmarkInput,
  UpdateBookmarkInput,
  UpdateBookmarkRelationshipsInput,
  YouTubeChannelHint,
} from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkBooleanValues,
  bookmarkDateTimeValues,
  bookmarkImages,
  bookmarkNumberValues,
  bookmarkRelationships,
  bookmarks,
  type BookmarkRow,
  bookmarkTags,
  calculatePropertyOperands,
  customProperties,
  mediaTypes,
  tags,
  websites,
  youtubeChannels,
} from "@/db/schema";
import { bookmarkImageFromRow, fetchAndStoreOgImage, getBookmarkImageRow } from "@/services/bookmarkImages";
import { ensureDefaultCategory } from "@/services/categories";
import { getVideoLengthPropertyId } from "@/services/customProperties";
import { getMediaTypeBySlug } from "@/services/mediaTypes";
import { getDescendantIds } from "@/services/tags";
import { fetchAndStoreWebsiteFavicon, getWebsiteFaviconRow } from "@/services/websiteFavicons";
import { ensureWebsiteForUrl, getWebsiteByAnyDomain, normalizeDomain } from "@/services/websites";
import { fetchYouTubeMetadata, isYouTubeVideoUrl, parseYouTubeVideo, type YouTubeMetadata } from "@/services/youtube";
import { fetchAndStoreChannelImage, getYouTubeChannelImageRow } from "@/services/youtubeChannelImages";
import { channelKeyFromUrl, ensureYouTubeChannel } from "@/services/youtubeChannels";
import { isObjectStoreConfigured } from "@/utils/objectStore";
import { slugify } from "@/utils/slug";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a create/update would collide with an existing bookmark's URL. */
export class DuplicateUrlError extends Error {
  constructor(url: string) {
    super(`A bookmark with this URL already exists: ${url}`);
    this.name = "DuplicateUrlError";
  }
}

/** The hydrated relations that accompany a bookmark row. */
interface BookmarkExtras {
  website: BookmarkWebsite | null;
  mediaType: BookmarkMediaType | null;
  youtubeChannel: BookmarkYouTubeChannel | null;
  tags: BookmarkTag[];
  numberValues: BookmarkNumberValue[];
  booleanValues: BookmarkBooleanValue[];
  dateTimeValues: BookmarkDateTimeValue[];
  image: BookmarkImage | null;
  relatedBookmarks: BookmarkUrlSummary[];
}

const EMPTY_EXTRAS: BookmarkExtras = {
  website: null,
  mediaType: null,
  youtubeChannel: null,
  tags: [],
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
  image: null,
  relatedBookmarks: [],
};

/** Map a DB row plus its hydrated relations to the shared `Bookmark` wire type. */
function toBookmark(row: BookmarkRow, extras: BookmarkExtras, defaultCategoryId: string): Bookmark {
  return {
    id: row.id,
    url: row.url,
    originalUrl: row.originalUrl,
    title: row.title,
    description: row.description,
    categoryId: row.categoryId ?? defaultCategoryId,
    website: extras.website,
    mediaType: extras.mediaType,
    youtubeChannel: extras.youtubeChannel,
    tags: extras.tags,
    numberValues: extras.numberValues,
    booleanValues: extras.booleanValues,
    dateTimeValues: extras.dateTimeValues,
    relatedBookmarks: extras.relatedBookmarks,
    image: extras.image,
    imageAutoGrabError: (row.imageAutoGrabError as "no_image" | "bad_image" | "blocked" | "server_error" | "fetch_error" | null) ?? null,
    priority: row.priority,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** Load websites for a set of website ids in a single query, keyed by website id. */
async function websitesById(websiteIds: string[]): Promise<Map<string, BookmarkWebsite>> {
  const byId = new Map<string, BookmarkWebsite>();
  if (websiteIds.length === 0) return byId;

  const rows = await db
    .select({
      id: websites.id,
      domain: websites.domain,
      siteName: websites.siteName,
      slug: websites.slug,
    })
    .from(websites)
    .where(inArray(websites.id, websiteIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      domain: row.domain,
      siteName: row.siteName,
      slug: row.slug ?? (row.domain.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-") || "website"),
    });
  }
  return byId;
}

/** Load media types for a set of media-type ids in a single query, keyed by media-type id. */
async function mediaTypesById(mediaTypeIds: string[]): Promise<Map<string, BookmarkMediaType>> {
  const byId = new Map<string, BookmarkMediaType>();
  if (mediaTypeIds.length === 0) return byId;

  const rows = await db
    .select({
      id: mediaTypes.id,
      name: mediaTypes.name,
      slug: mediaTypes.slug,
    })
    .from(mediaTypes)
    .where(inArray(mediaTypes.id, mediaTypeIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug ?? row.id,
    });
  }
  return byId;
}

/** Load YouTube channels for a set of channel ids in a single query, keyed by channel id. */
async function channelsById(channelIds: string[]): Promise<Map<string, BookmarkYouTubeChannel>> {
  const byId = new Map<string, BookmarkYouTubeChannel>();
  if (channelIds.length === 0) return byId;

  const rows = await db
    .select({
      id: youtubeChannels.id,
      name: youtubeChannels.name,
      slug: youtubeChannels.slug,
    })
    .from(youtubeChannels)
    .where(inArray(youtubeChannels.id, channelIds));

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug ?? row.id,
    });
  }
  return byId;
}

/** Load tags for a set of bookmark ids in a single query, grouped by bookmark id. */
async function tagsByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkTag[]>> {
  const grouped = new Map<string, BookmarkTag[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkTags.bookmarkId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      parentId: tags.parentId,
    })
    .from(bookmarkTags)
    .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
    .where(inArray(bookmarkTags.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      slug: row.slug ?? slugify(row.name),
      parentId: row.parentId,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load number custom-property values for a set of bookmarks, grouped by bookmark id. */
async function numberValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkNumberValue[]>> {
  const grouped = new Map<string, BookmarkNumberValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkNumberValues.bookmarkId,
      propertyId: bookmarkNumberValues.propertyId,
      value: bookmarkNumberValues.value,
    })
    .from(bookmarkNumberValues)
    .where(inArray(bookmarkNumberValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load boolean custom-property values for a set of bookmarks, grouped by bookmark id. */
async function booleanValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkBooleanValue[]>> {
  const grouped = new Map<string, BookmarkBooleanValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkBooleanValues.bookmarkId,
      propertyId: bookmarkBooleanValues.propertyId,
      value: bookmarkBooleanValues.value,
    })
    .from(bookmarkBooleanValues)
    .where(inArray(bookmarkBooleanValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load date/time custom-property values for a set of bookmarks, grouped by bookmark id. */
async function dateTimeValuesByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkDateTimeValue[]>> {
  const grouped = new Map<string, BookmarkDateTimeValue[]>();
  if (bookmarkIds.length === 0) return grouped;

  const rows = await db
    .select({
      bookmarkId: bookmarkDateTimeValues.bookmarkId,
      propertyId: bookmarkDateTimeValues.propertyId,
      value: bookmarkDateTimeValues.value,
    })
    .from(bookmarkDateTimeValues)
    .where(inArray(bookmarkDateTimeValues.bookmarkId, bookmarkIds));

  for (const row of rows) {
    const list = grouped.get(row.bookmarkId) ?? [];
    list.push({
      propertyId: row.propertyId,
      value: row.value,
    });
    grouped.set(row.bookmarkId, list);
  }
  return grouped;
}

/** Load attached images for a set of bookmarks in a single query, keyed by bookmark id. */
async function imagesByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkImage>> {
  const byId = new Map<string, BookmarkImage>();
  if (bookmarkIds.length === 0) return byId;

  const rows = await db
    .select()
    .from(bookmarkImages)
    .where(inArray(bookmarkImages.bookmarkId, bookmarkIds));

  for (const row of rows) {
    byId.set(row.bookmarkId, bookmarkImageFromRow(row));
  }
  return byId;
}

/**
 * Load related bookmarks for a set of bookmark ids, handling both sides of the undirected join.
 * Returns a map of bookmarkId → array of minimal bookmark summaries for its related bookmarks.
 */
async function relatedBookmarksByBookmarkId(
  bookmarkIds: string[],
): Promise<Map<string, BookmarkUrlSummary[]>> {
  const grouped = new Map<string, BookmarkUrlSummary[]>();
  if (bookmarkIds.length === 0) return grouped;

  const idSet = new Set(bookmarkIds);

  const rels = await db
    .select({
      bookmarkAId: bookmarkRelationships.bookmarkAId,
      bookmarkBId: bookmarkRelationships.bookmarkBId,
    })
    .from(bookmarkRelationships)
    .where(
      or(
        inArray(bookmarkRelationships.bookmarkAId, bookmarkIds),
        inArray(bookmarkRelationships.bookmarkBId, bookmarkIds),
      ),
    );

  if (rels.length === 0) return grouped;

  // Collect all "other" bookmark ids we need to fetch (may include ids outside our batch).
  const otherIds = new Set<string>();
  for (const rel of rels) {
    if (idSet.has(rel.bookmarkAId)) otherIds.add(rel.bookmarkBId);
    if (idSet.has(rel.bookmarkBId)) otherIds.add(rel.bookmarkAId);
  }

  const otherRows = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(inArray(bookmarks.id, [...otherIds]));

  const otherById = new Map(otherRows.map(row => [row.id, row]));

  for (const rel of rels) {
    const addTo = (ownId: string, otherId: string) => {
      if (!idSet.has(ownId)) return;
      const other = otherById.get(otherId);
      if (!other) return;
      const list = grouped.get(ownId) ?? [];
      list.push({
        id: other.id,
        url: other.url,
        title: other.title,
      });
      grouped.set(ownId, list);
    };
    addTo(rel.bookmarkAId, rel.bookmarkBId);
    addTo(rel.bookmarkBId, rel.bookmarkAId);
  }

  return grouped;
}

/** Hydrate all custom-property relations for a set of bookmark rows in batched queries. */
async function extrasByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkExtras>> {
  const [tagsMap, numberMap, booleanMap, dateTimeMap, imageMap, relatedMap] = await Promise.all([
    tagsByBookmarkId(bookmarkIds),
    numberValuesByBookmarkId(bookmarkIds),
    booleanValuesByBookmarkId(bookmarkIds),
    dateTimeValuesByBookmarkId(bookmarkIds),
    imagesByBookmarkId(bookmarkIds),
    relatedBookmarksByBookmarkId(bookmarkIds),
  ]);
  const grouped = new Map<string, BookmarkExtras>();
  for (const id of bookmarkIds) {
    grouped.set(id, {
      website: null,
      mediaType: null,
      youtubeChannel: null,
      tags: tagsMap.get(id) ?? [],
      numberValues: numberMap.get(id) ?? [],
      booleanValues: booleanMap.get(id) ?? [],
      dateTimeValues: dateTimeMap.get(id) ?? [],
      image: imageMap.get(id) ?? null,
      relatedBookmarks: relatedMap.get(id) ?? [],
    });
  }
  return grouped;
}

/** Hydrate a list of bookmark rows into wire types (shared by list/get/homepage/sections). */
export async function hydrateBookmarkRows(rows: BookmarkRow[]): Promise<Bookmark[]> {
  if (rows.length === 0) return [];
  const defaultCategoryId = await ensureDefaultCategory();
  const websiteIds = [...new Set(rows.map(row => row.websiteId).filter((id): id is string => id !== null))];
  const mediaTypeIds = [...new Set(rows.map(row => row.mediaTypeId).filter((id): id is string => id !== null))];
  const channelIds = [...new Set(rows.map(row => row.youtubeChannelId).filter((id): id is string => id !== null))];
  const [grouped, websiteMap, mediaTypeMap, channelMap] = await Promise.all([
    extrasByBookmarkId(rows.map(row => row.id)),
    websitesById(websiteIds),
    mediaTypesById(mediaTypeIds),
    channelsById(channelIds),
  ]);
  return rows.map((row) => {
    const extras = grouped.get(row.id) ?? EMPTY_EXTRAS;
    return toBookmark(row, {
      ...extras,
      website: row.websiteId ? websiteMap.get(row.websiteId) ?? null : null,
      mediaType: row.mediaTypeId ? mediaTypeMap.get(row.mediaTypeId) ?? null : null,
      youtubeChannel: row.youtubeChannelId ? channelMap.get(row.youtubeChannelId) ?? null : null,
    }, defaultCategoryId);
  });
}

/** List bookmarks, optionally filtered to a tag and its entire subtree. */
export async function listBookmarks(filterTagId?: string): Promise<Bookmark[]> {
  let allowedIds: Set<string> | null = null;
  if (filterTagId) {
    const subtree = await getDescendantIds(filterTagId);
    if (subtree.size === 0) return [];
    const links = await db
      .select({
        bookmarkId: bookmarkTags.bookmarkId,
      })
      .from(bookmarkTags)
      .where(inArray(bookmarkTags.tagId, [...subtree]));
    allowedIds = new Set(links.map(link => link.bookmarkId));
    if (allowedIds.size === 0) return [];
  }

  const baseRows = await db.select().from(bookmarks).orderBy(desc(bookmarks.createdAt));
  const rows = allowedIds ? baseRows.filter(row => allowedIds.has(row.id)) : baseRows;
  return hydrateBookmarkRows(rows);
}

export async function getBookmark(id: string): Promise<Bookmark | null> {
  const [row] = await db.select().from(bookmarks).where(eq(bookmarks.id, id));
  if (!row) return null;
  const [hydrated] = await hydrateBookmarkRows([row]);
  return hydrated ?? null;
}

/**
 * List bookmarks whose URL host equals `domain` (used to find links saved on a shortened domain so
 * they can be bulk-expanded). An `ILIKE` prefilter narrows the scan, then `normalizeDomain` confirms
 * the exact host so a substring like `youtu.be` can't match an unrelated URL.
 */
export async function listBookmarksOnHost(domain: string): Promise<BookmarkUrlSummary[]> {
  const host = domain.trim().replace(/^www\./i, "").toLowerCase();
  if (host.length === 0) return [];
  const rows = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(ilike(bookmarks.url, `%${host}%`))
    .orderBy(desc(bookmarks.createdAt));
  return rows.filter(row => normalizeDomain(row.url) === host);
}

/**
 * Apply a batch of URL rewrites (e.g. expanding shortened links). Each item reuses `updateBookmark`
 * so the website / YouTube-channel are re-derived, and preserves the pre-existing original URL (or
 * records the old URL as the original on first change). Per-item failures are reported rather than
 * aborting the batch, so one duplicate doesn't sink the rest.
 */
export async function bulkUpdateBookmarkUrls(items: BulkUrlUpdate[]): Promise<BulkUrlUpdateResult[]> {
  const results: BulkUrlUpdateResult[] = [];
  for (const item of items) {
    const [current] = await db
      .select({
        url: bookmarks.url,
        originalUrl: bookmarks.originalUrl,
      })
      .from(bookmarks)
      .where(eq(bookmarks.id, item.id));
    if (!current) {
      results.push({
        id: item.id,
        status: "not-found",
      });
      continue;
    }
    if (current.url === item.url) {
      results.push({
        id: item.id,
        status: "skipped-unchanged",
      });
      continue;
    }
    try {
      await updateBookmark(item.id, {
        url: item.url,
        // Keep the first-seen original; otherwise record the URL we're replacing.
        originalUrl: current.originalUrl ?? current.url,
      });
      results.push({
        id: item.id,
        status: "applied",
      });
    }
    catch (err) {
      if (err instanceof DuplicateUrlError) {
        results.push({
          id: item.id,
          status: "skipped-duplicate",
          message: err.message,
        });
      }
      else {
        results.push({
          id: item.id,
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
  return results;
}

/** Slug of the built-in "Video" media type, defaulted onto YouTube-video bookmarks. */
const VIDEO_MEDIA_TYPE_SLUG = "video";

/** Tagged log line so the whole YouTube enrichment path is greppable in production. */
function ytLog(level: "info" | "warn", message: string, err?: unknown): void {
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
function channelHintFrom(
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
async function videoMediaTypeId(): Promise<string | null> {
  const type = await getMediaTypeBySlug(VIDEO_MEDIA_TYPE_SLUG);
  return type?.id ?? null;
}

/**
 * Append the video's duration to a bookmark's number values as the built-in "Video Length"
 * property, unless the metadata has no duration or the caller already supplied a value for that
 * property (a user edit always wins). Returns the (possibly extended) array. `ctx` labels the log.
 */
async function withVideoLength(
  numberValues: BookmarkNumberValue[],
  meta: YouTubeMetadata | null,
  ctx: string,
): Promise<BookmarkNumberValue[]> {
  if (meta?.durationSeconds == null) return numberValues;
  const lengthPropId = await getVideoLengthPropertyId();
  if (!lengthPropId) {
    ytLog("warn", `${ctx}: "video-length" property missing; duration ${meta.durationSeconds}s not stored`);
    return numberValues;
  }
  if (numberValues.some(value => value.propertyId === lengthPropId)) {
    ytLog("info", `${ctx}: Video Length already supplied; keeping caller value`);
    return numberValues;
  }
  ytLog("info", `${ctx}: filled Video Length = ${meta.durationSeconds}s`);
  return [
    ...numberValues,
    {
      propertyId: lengthPropId,
      value: meta.durationSeconds,
    },
  ];
}

/**
 * Best-effort thumbnail capture for a YouTube-video bookmark: pulls the oEmbed thumbnail (falling
 * back to og:image) and stores it. Never throws — a failure here must not fail the create/update.
 * Skips silently when object storage isn't configured. `ctx` labels the log.
 */
async function captureYouTubeThumbnail(bookmarkId: string, ctx: string): Promise<void> {
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
async function captureWebsiteFavicon(websiteId: string | null, ctx: string): Promise<void> {
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
async function captureChannelAvatar(channelId: string | null, ctx: string): Promise<void> {
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
async function resolveYouTubeMeta(url: string, ctx: string): Promise<YouTubeMetadata | null> {
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
async function getChannelCategoryId(channelKey: string): Promise<string | null> {
  const [row] = await db.select({
    categoryId: youtubeChannels.categoryId,
  }).from(youtubeChannels).where(eq(youtubeChannels.channelKey, channelKey));
  return row?.categoryId ?? null;
}

export async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  const existing = await db.select({
    id: bookmarks.id,
  }).from(bookmarks).where(eq(bookmarks.url, input.url));
  if (existing.length > 0) throw new DuplicateUrlError(input.url);

  const defaultId = await ensureDefaultCategory();
  let categoryId = input.categoryId ?? defaultId;

  // Resolve YouTube metadata once (network) before opening the transaction, then reuse it for the
  // channel, the "Video" media-type default, and the Video Length backfill below.
  const meta = await resolveYouTubeMeta(input.url, "create");
  const channelHint = channelHintFrom(input.youtubeChannel, meta);

  // If the bookmark is on the Default category and the channel has its own category set, inherit it.
  if (channelHint && categoryId === defaultId) {
    const channelCategoryId = await getChannelCategoryId(channelHint.key);
    if (channelCategoryId) categoryId = channelCategoryId;
  }

  // Default the media type to "Video" for a YouTube video unless the caller already chose one.
  let mediaTypeId = input.mediaTypeId ?? null;
  if (meta && !mediaTypeId) {
    const videoId = await videoMediaTypeId();
    if (videoId) {
      mediaTypeId = videoId;
      ytLog("info", "create: applied \"Video\" media type");
    }
    else {
      ytLog("warn", "create: \"video\" media type missing; media type left unset");
    }
  }

  const numberValues = await withVideoLength(input.numberValues ?? [], meta, "create");

  const {
    id, websiteId, youtubeChannelId,
  } = await db.transaction(async (tx) => {
    const websiteId = await ensureWebsiteForUrl(tx, input.url, input.websiteSiteName);
    const youtubeChannelId = channelHint ? await ensureYouTubeChannel(tx, channelHint) : null;
    const [row] = await tx
      .insert(bookmarks)
      .values({
        url: input.url,
        originalUrl: input.originalUrl ?? null,
        title: input.title,
        description: input.description ?? null,
        categoryId,
        websiteId,
        mediaTypeId,
        youtubeChannelId,
        priority: input.priority ?? 0,
      })
      .returning({
        id: bookmarks.id,
      });
    await linkTags(tx, row.id, input.tagIds);
    await setNumberValues(tx, row.id, numberValues);
    await setBooleanValues(tx, row.id, input.booleanValues);
    await setDateTimeValues(tx, row.id, input.dateTimeValues);
    await recomputeCalculatedValues(tx, row.id);
    return {
      id: row.id,
      websiteId,
      youtubeChannelId,
    };
  });

  // Auto-capture the YouTube thumbnail after the row exists, before the hydrated re-read so the
  // returned bookmark includes the image. Best-effort: never fails the create.
  if (meta !== null) await captureYouTubeThumbnail(id, "create");
  // Populate the website favicon / channel avatar on first sighting. Fire-and-forget (these don't
  // appear on the bookmark itself), so a new-domain bookmark isn't blocked on the icon fetch; each
  // helper is self-guarded (skips when one already exists) and swallows its own errors.
  void captureWebsiteFavicon(websiteId, "create");
  void captureChannelAvatar(youtubeChannelId, "create");

  // Re-read so callers always get the hydrated shape.
  return (await getBookmark(id))!;
}

export async function updateBookmark(
  id: string,
  input: UpdateBookmarkInput,
): Promise<Bookmark | null> {
  if (input.url !== undefined) {
    const clash = await db
      .select({
        id: bookmarks.id,
      })
      .from(bookmarks)
      .where(and(eq(bookmarks.url, input.url), ne(bookmarks.id, id)));
    if (clash.length > 0) throw new DuplicateUrlError(input.url);
  }

  // When the URL changes, resolve YouTube metadata once and reuse it for the channel, the "Video"
  // media-type default, and the Video Length backfill. A channel-only change still re-resolves the
  // channel from the supplied hint.
  const meta = input.url !== undefined ? await resolveYouTubeMeta(input.url, "update") : null;
  const channelHint
    = input.url !== undefined || input.youtubeChannel !== undefined
      ? channelHintFrom(input.youtubeChannel, meta)
      : undefined;

  // Default the media type to "Video" only when the URL becomes a YouTube video, the caller didn't
  // set a media type, and the bookmark doesn't already have one — never overriding an existing pick.
  let mediaTypeDefault: string | undefined;
  if (meta && input.mediaTypeId === undefined) {
    const [current] = await db
      .select({
        mediaTypeId: bookmarks.mediaTypeId,
      })
      .from(bookmarks)
      .where(eq(bookmarks.id, id));
    if (current && current.mediaTypeId == null) {
      const videoId = await videoMediaTypeId();
      if (videoId) {
        mediaTypeDefault = videoId;
        ytLog("info", "update: applied \"Video\" media type");
      }
      else {
        ytLog("warn", "update: \"video\" media type missing; media type left unset");
      }
    }
  }

  // Backfill Video Length only when the caller is already managing number values (full form submit),
  // so a partial update that doesn't touch properties is left untouched.
  const numberValues = input.numberValues !== undefined
    ? await withVideoLength(input.numberValues, meta, "update")
    : undefined;

  // Website / channel ids touched by this update, surfaced from the transaction so the post-commit
  // favicon / avatar capture can run on the resolved entities. `undefined` means "not changed".
  let touchedWebsiteId: string | null | undefined;
  let touchedChannelId: string | null | undefined;

  const found = await db.transaction(async (tx) => {
    const patch: Partial<
      Pick<
        BookmarkRow,
        | "url"
        | "originalUrl"
        | "title"
        | "description"
        | "categoryId"
        | "websiteId"
        | "mediaTypeId"
        | "youtubeChannelId"
        | "priority"
      >
    > = {};
    if (input.url !== undefined) {
      patch.url = input.url;
      // Re-derive the website and YouTube channel whenever the URL changes.
      patch.websiteId = await ensureWebsiteForUrl(tx, input.url);
      patch.youtubeChannelId = channelHint ? await ensureYouTubeChannel(tx, channelHint) : null;
      touchedWebsiteId = patch.websiteId;
      touchedChannelId = patch.youtubeChannelId;
    }
    else if (channelHint !== undefined) {
      patch.youtubeChannelId = channelHint ? await ensureYouTubeChannel(tx, channelHint) : null;
      touchedChannelId = patch.youtubeChannelId;
    }
    if (input.originalUrl !== undefined) patch.originalUrl = input.originalUrl ?? null;
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
    if (input.mediaTypeId !== undefined) patch.mediaTypeId = input.mediaTypeId ?? null;
    else if (mediaTypeDefault !== undefined) patch.mediaTypeId = mediaTypeDefault;
    if (input.priority !== undefined) patch.priority = input.priority;

    if (Object.keys(patch).length > 0) {
      const [row] = await tx.update(bookmarks).set(patch).where(eq(bookmarks.id, id)).returning({
        id: bookmarks.id,
      });
      if (!row) return false;
    }
    else {
      const [row] = await tx.select({
        id: bookmarks.id,
      }).from(bookmarks).where(eq(bookmarks.id, id));
      if (!row) return false;
    }

    if (input.tagIds !== undefined) {
      await tx.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, id));
      await linkTags(tx, id, input.tagIds);
    }
    if (numberValues !== undefined) {
      await tx.delete(bookmarkNumberValues).where(eq(bookmarkNumberValues.bookmarkId, id));
      await setNumberValues(tx, id, numberValues);
    }
    if (input.booleanValues !== undefined) {
      await tx.delete(bookmarkBooleanValues).where(eq(bookmarkBooleanValues.bookmarkId, id));
      await setBooleanValues(tx, id, input.booleanValues);
    }
    if (input.dateTimeValues !== undefined) {
      await tx.delete(bookmarkDateTimeValues).where(eq(bookmarkDateTimeValues.bookmarkId, id));
      await setDateTimeValues(tx, id, input.dateTimeValues);
    }
    // Always recompute last: number-value edits ripple into calculate results.
    await recomputeCalculatedValues(tx, id);
    return true;
  });

  // Capture a thumbnail when the URL becomes a YouTube video and there's no image yet — don't
  // clobber a user upload or an earlier capture. Best-effort, before the hydrated re-read.
  if (found && meta !== null) {
    const existingImage = await getBookmarkImageRow(id);
    if (existingImage) {
      ytLog("info", `update: thumbnail skipped (image already present) for ${id}`);
    }
    else {
      await captureYouTubeThumbnail(id, "update");
    }
  }

  // Populate the website favicon / channel avatar on first sighting of a newly-linked entity.
  // Fire-and-forget (see createBookmark); only fires when this update actually (re)resolved them.
  if (found) {
    void captureWebsiteFavicon(touchedWebsiteId ?? null, "update");
    void captureChannelAvatar(touchedChannelId ?? null, "update");
  }

  return found ? getBookmark(id) : null;
}

export async function deleteBookmark(id: string): Promise<boolean> {
  const rows = await db.delete(bookmarks).where(eq(bookmarks.id, id)).returning({
    id: bookmarks.id,
  });
  return rows.length > 0;
}

/** Insert join rows linking a bookmark to the given tag ids (no-op when empty). */
async function linkTags(tx: Tx, bookmarkId: string, tagIds: string[] | undefined): Promise<void> {
  if (!tagIds || tagIds.length === 0) return;
  await tx.insert(bookmarkTags).values(tagIds.map(tagId => ({
    bookmarkId,
    tagId,
  })));
}

/** Insert number custom-property values for a bookmark (no-op when empty). */
async function setNumberValues(
  tx: Tx,
  bookmarkId: string,
  numberValues: BookmarkNumberValue[] | undefined,
): Promise<void> {
  if (!numberValues || numberValues.length === 0) return;
  await tx.insert(bookmarkNumberValues).values(numberValues.map(entry => ({
    bookmarkId,
    propertyId: entry.propertyId,
    value: entry.value,
  })));
}

/** Insert boolean custom-property values for a bookmark (no-op when empty). */
async function setBooleanValues(
  tx: Tx,
  bookmarkId: string,
  booleanValues: BookmarkBooleanValue[] | undefined,
): Promise<void> {
  if (!booleanValues || booleanValues.length === 0) return;
  await tx.insert(bookmarkBooleanValues).values(booleanValues.map(entry => ({
    bookmarkId,
    propertyId: entry.propertyId,
    value: entry.value,
  })));
}

/** Insert date/time custom-property values for a bookmark (no-op when empty). */
async function setDateTimeValues(
  tx: Tx,
  bookmarkId: string,
  dateTimeValues: BookmarkDateTimeValue[] | undefined,
): Promise<void> {
  if (!dateTimeValues || dateTimeValues.length === 0) return;
  await tx.insert(bookmarkDateTimeValues).values(dateTimeValues.map(entry => ({
    bookmarkId,
    propertyId: entry.propertyId,
    value: entry.value,
  })));
}

/**
 * Sum the stored values of the given operand properties for a bookmark, treating a missing
 * value as 0. Pure — kept separate from DB access so it can be unit-tested.
 */
export function sumOperands(valueById: Map<string, number>, operandIds: string[]): number {
  return operandIds.reduce((total, id) => total + (valueById.get(id) ?? 0), 0);
}

/**
 * Recompute and persist every calculate property's value for a bookmark, storing the result
 * in `bookmark_number_values` so it filters and sorts like a real number. Must run after the
 * bookmark's number values are written, since calculate results derive from them.
 */
async function recomputeCalculatedValues(tx: Tx, bookmarkId: string): Promise<void> {
  const calcProps = await tx
    .select({
      id: customProperties.id,
    })
    .from(customProperties)
    .where(eq(customProperties.type, "calculate"));
  if (calcProps.length === 0) return;
  const calcIds = calcProps.map(prop => prop.id);

  // Clear stale calculate results so they don't pollute the operand sums below.
  await tx
    .delete(bookmarkNumberValues)
    .where(and(eq(bookmarkNumberValues.bookmarkId, bookmarkId), inArray(bookmarkNumberValues.propertyId, calcIds)));

  const operandRows = await tx
    .select({
      propertyId: calculatePropertyOperands.propertyId,
      operandPropertyId: calculatePropertyOperands.operandPropertyId,
    })
    .from(calculatePropertyOperands)
    .where(inArray(calculatePropertyOperands.propertyId, calcIds));
  const operandsByCalc = new Map<string, string[]>();
  for (const row of operandRows) {
    const list = operandsByCalc.get(row.propertyId) ?? [];
    list.push(row.operandPropertyId);
    operandsByCalc.set(row.propertyId, list);
  }

  const valueRows = await tx
    .select({
      propertyId: bookmarkNumberValues.propertyId,
      value: bookmarkNumberValues.value,
    })
    .from(bookmarkNumberValues)
    .where(eq(bookmarkNumberValues.bookmarkId, bookmarkId));
  const valueById = new Map(valueRows.map(row => [row.propertyId, row.value]));

  const inserts = calcProps.map(prop => ({
    bookmarkId,
    propertyId: prop.id,
    value: sumOperands(valueById, operandsByCalc.get(prop.id) ?? []),
  }));
  if (inserts.length > 0) await tx.insert(bookmarkNumberValues).values(inserts);
}

/**
 * Replace the full set of undirected relationships for a bookmark. Each pair is stored with the
 * lexicographically smaller UUID in `bookmarkAId` so each edge has exactly one canonical row.
 * Self-references (a bookmark related to itself) are silently ignored.
 */
export async function updateBookmarkRelationships(
  bookmarkId: string,
  {
    relatedBookmarkIds,
  }: UpdateBookmarkRelationshipsInput,
): Promise<void> {
  const pairs = relatedBookmarkIds
    .filter(otherId => otherId !== bookmarkId)
    .map(otherId =>
      bookmarkId < otherId
        ? {
          bookmarkAId: bookmarkId,
          bookmarkBId: otherId,
        }
        : {
          bookmarkAId: otherId,
          bookmarkBId: bookmarkId,
        });

  await db.transaction(async (tx) => {
    await tx
      .delete(bookmarkRelationships)
      .where(
        or(
          eq(bookmarkRelationships.bookmarkAId, bookmarkId),
          eq(bookmarkRelationships.bookmarkBId, bookmarkId),
        ),
      );
    if (pairs.length > 0) {
      await tx.insert(bookmarkRelationships).values(pairs);
    }
  });
}

/** Check if a URL exactly matches an existing bookmark, or shares the same origin+pathname. */
export async function checkBookmarkUrlDuplicate(url: string): Promise<BookmarkUrlDuplicateResult> {
  const exact = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(eq(bookmarks.url, url))
    .limit(1);
  if (exact.length > 0) return {
    exactMatch: exact[0]!,
    pathMatch: null,
  };

  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return {
      exactMatch: null,
      pathMatch: null,
    };
  }
  const basePath = parsed.origin + parsed.pathname;

  const candidates = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
    })
    .from(bookmarks)
    .where(like(bookmarks.url, `${basePath}%`));

  const pathCandidates = candidates.filter((b) => {
    try {
      const p = new URL(b.url);
      return p.origin + p.pathname === basePath;
    }
    catch { return false; }
  });

  if (pathCandidates.length === 0) return {
    exactMatch: null,
    pathMatch: null,
  };

  // Look up paramRules for this domain so identity-bearing params (e.g. YouTube's ?v= on /watch)
  // are included in the match. Uses getWebsiteByAnyDomain so youtu.be resolves to youtube.com.
  const domain = normalizeDomain(url);
  const website = domain ? await getWebsiteByAnyDomain(domain) : null;

  // Find the most-specific matching rule (longest pathSuffix wins, mirrors urlCleanup applyParamRules).
  const matchingRule = website?.paramRules.length
    ? website.paramRules
      .filter(r => r.pathSuffix === "" || parsed.pathname.endsWith(r.pathSuffix))
      .sort((a, b) => b.pathSuffix.length - a.pathSuffix.length)[0] ?? null
    : null;

  if (!matchingRule) {
    return {
      exactMatch: null,
      pathMatch: pathCandidates[0] ?? null,
    };
  }

  // Only flag a candidate as a path-match when all identity params also match.
  const newParamValues = matchingRule.params.map(p => parsed.searchParams.get(p) ?? "");
  const pathMatch = pathCandidates.find((b) => {
    try {
      const bp = new URL(b.url);
      return matchingRule.params.every((p, i) => (bp.searchParams.get(p) ?? "") === newParamValues[i]);
    }
    catch { return false; }
  }) ?? null;

  return {
    exactMatch: null,
    pathMatch,
  };
}
