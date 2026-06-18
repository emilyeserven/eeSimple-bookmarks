import { and, desc, eq, inArray, ne } from "drizzle-orm";
import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkImage,
  BookmarkMediaType,
  BookmarkNumberValue,
  BookmarkTag,
  BookmarkWebsite,
  BookmarkYouTubeChannel,
  CreateBookmarkInput,
  UpdateBookmarkInput,
  YouTubeChannelHint,
} from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarkBooleanValues,
  bookmarkDateTimeValues,
  bookmarkImages,
  bookmarkNumberValues,
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
import { bookmarkImageFromRow } from "@/services/bookmarkImages";
import { ensureDefaultCategory } from "@/services/categories";
import { getDescendantIds } from "@/services/tags";
import { ensureWebsiteForUrl } from "@/services/websites";
import { fetchYouTubeMetadata, isYouTubeVideoUrl } from "@/services/youtube";
import { channelKeyFromUrl, ensureYouTubeChannel } from "@/services/youtubeChannels";

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
    image: extras.image,
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

/** Hydrate all custom-property relations for a set of bookmark rows in batched queries. */
async function extrasByBookmarkId(bookmarkIds: string[]): Promise<Map<string, BookmarkExtras>> {
  const [tagsMap, numberMap, booleanMap, dateTimeMap, imageMap] = await Promise.all([
    tagsByBookmarkId(bookmarkIds),
    numberValuesByBookmarkId(bookmarkIds),
    booleanValuesByBookmarkId(bookmarkIds),
    dateTimeValuesByBookmarkId(bookmarkIds),
    imagesByBookmarkId(bookmarkIds),
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
 * Resolve the `{ key, name }` channel hint for a URL, fetching the video's metadata when the URL is
 * a YouTube video and no hint was supplied. Run *outside* a transaction (it may do a network call),
 * so the resolved hint can then be upserted cheaply inside one. Returns `null` for non-videos.
 */
async function resolveChannelHint(
  url: string,
  hint: YouTubeChannelHint | null | undefined,
): Promise<{ key: string;
  name: string; } | null> {
  if (hint && hint.key.trim() && hint.name.trim()) {
    return {
      key: hint.key.trim(),
      name: hint.name.trim(),
    };
  }
  if (!isYouTubeVideoUrl(url)) return null;
  const meta = await fetchYouTubeMetadata(url);
  if (meta?.channelName && meta.channelUrl) {
    const key = channelKeyFromUrl(meta.channelUrl);
    if (key) return {
      key,
      name: meta.channelName,
    };
  }
  return null;
}

export async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  const existing = await db.select({
    id: bookmarks.id,
  }).from(bookmarks).where(eq(bookmarks.url, input.url));
  if (existing.length > 0) throw new DuplicateUrlError(input.url);

  const categoryId = input.categoryId ?? await ensureDefaultCategory();
  // Resolve the channel before opening the transaction — it may make a network request.
  const channelHint = await resolveChannelHint(input.url, input.youtubeChannel);
  const id = await db.transaction(async (tx) => {
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
        mediaTypeId: input.mediaTypeId ?? null,
        youtubeChannelId,
        priority: input.priority ?? 0,
      })
      .returning({
        id: bookmarks.id,
      });
    await linkTags(tx, row.id, input.tagIds);
    await setNumberValues(tx, row.id, input.numberValues);
    await setBooleanValues(tx, row.id, input.booleanValues);
    await setDateTimeValues(tx, row.id, input.dateTimeValues);
    await recomputeCalculatedValues(tx, row.id);
    return row.id;
  });
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

  // Re-resolve the channel outside the transaction when the URL changes or a hint is supplied.
  const channelHint
    = input.url !== undefined || input.youtubeChannel !== undefined
      ? await resolveChannelHint(input.url ?? "", input.youtubeChannel)
      : undefined;

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
    }
    else if (channelHint !== undefined) {
      patch.youtubeChannelId = channelHint ? await ensureYouTubeChannel(tx, channelHint) : null;
    }
    if (input.originalUrl !== undefined) patch.originalUrl = input.originalUrl ?? null;
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
    if (input.mediaTypeId !== undefined) patch.mediaTypeId = input.mediaTypeId ?? null;
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
    if (input.numberValues !== undefined) {
      await tx.delete(bookmarkNumberValues).where(eq(bookmarkNumberValues.bookmarkId, id));
      await setNumberValues(tx, id, input.numberValues);
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
