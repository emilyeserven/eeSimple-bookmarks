import { asc, eq, inArray, isNull } from "drizzle-orm";
import type { BulkDeleteResult, CreateYouTubeChannelInput, UpdateYouTubeChannelInput, YouTubeChannel } from "@eesimple/types";
import { db } from "@/db";
import { deleteGenreMoodAssignmentsForOwner } from "@/services/genreMoodAssignments";
import { deleteLanguageUsagesForOwner } from "@/services/languageUsages";
import { invalidateBookmarkCache } from "@/services/bookmarkCache";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import {
  bookmarks,
  categories,
  groupYoutubeChannels,
  websiteYoutubeChannels,
  type YouTubeChannelRow,
  youtubeChannelImages,
  youtubeChannelSelfIds,
  youtubeChannelTags,
  youtubeChannels,
} from "@/db/schema";
import { AppError } from "@/utils/errors";
import { buildStringMap } from "@/utils/mapUtils";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/**
 * Build an avatar serving URL (with a `?v=` cache-buster) from a channel id and its avatar's
 * `createdAt`, or `null` when there's no avatar. Kept in sync with `youtubeChannelImageUrl` in the
 * channel-image service — both encode the version the same way so a replaced avatar busts the cache.
 */
function avatarUrlFrom(channelId: string, createdAt: Date | string | null): string | null {
  if (!createdAt) return null;
  const time = (createdAt instanceof Date ? createdAt : new Date(createdAt)).getTime();
  return `/api/youtube-channels/${channelId}/image?v=${time}`;
}

/** Transaction handle type, matching the callback arg of `db.transaction`. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a rename collides with an existing channel name. */
export class DuplicateYouTubeChannelError extends AppError {
  constructor(name: string) {
    super(`A channel named "${name}" already exists`, "duplicateName", 409, {
      entity: "channel",
      name,
    });
  }
}

/** Thrown when the provided channel URL cannot be parsed into a channel key. */
export class InvalidChannelUrlError extends AppError {
  constructor(url: string) {
    super(`"${url}" is not a valid YouTube channel URL`, "validation", 400, {
      url,
    });
  }
}

/** Thrown when trying to create a channel whose key already exists in the database. */
export class DuplicateChannelKeyError extends AppError {
  constructor(channelKey: string) {
    super(`A channel with the key "${channelKey}" already exists`, "duplicateChannelKey", 409, {
      channelKey,
    });
  }
}

/**
 * Derive a stable, normalized channel key from a channel URL (oEmbed's `person_url`). Prefers a
 * `@handle`, then a `/channel/<id>`, `/c/<name>`, or `/user/<name>` segment, falling back to the
 * last path segment. Pure — returns `null` when the URL has no usable path.
 */
export function channelKeyFromUrl(channelUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(channelUrl);
  }
  catch {
    return null;
  }
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  if (segments[0].startsWith("@")) return segments[0].toLowerCase();
  if (["channel", "c", "user"].includes(segments[0]) && segments[1]) {
    // Channel ids (UC…) are case-sensitive; vanity names are not.
    return segments[0] === "channel" ? segments[1] : segments[1].toLowerCase();
  }
  return segments[segments.length - 1].toLowerCase();
}

/** Replace the full set of self-identifiers for a channel (delete-then-insert). */
async function setSelfIds(
  txOrDb: Tx | typeof db,
  channelId: string,
  values: string[],
): Promise<void> {
  await txOrDb.delete(youtubeChannelSelfIds).where(eq(youtubeChannelSelfIds.channelId, channelId));
  if (values.length > 0) {
    await txOrDb.insert(youtubeChannelSelfIds).values(
      values.map(value => ({
        channelId,
        value,
      })),
    );
  }
}

/** Load default tag ids for a set of channel ids as a map of id → string[]. */
async function loadChannelTagsMap(channelIds: string[]): Promise<Map<string, string[]>> {
  if (channelIds.length === 0) return new Map();
  const rows = await db
    .select({
      channelId: youtubeChannelTags.channelId,
      tagId: youtubeChannelTags.tagId,
    })
    .from(youtubeChannelTags)
    .where(inArray(youtubeChannelTags.channelId, channelIds));
  return buildStringMap(rows, r => r.channelId, r => r.tagId);
}

/** Replace the full set of default tags for a channel (delete-then-insert). */
async function setChannelTags(
  txOrDb: Tx | typeof db,
  channelId: string,
  tagIds: string[],
): Promise<void> {
  await txOrDb.delete(youtubeChannelTags).where(eq(youtubeChannelTags.channelId, channelId));
  if (tagIds.length > 0) {
    await txOrDb.insert(youtubeChannelTags).values(tagIds.map(tagId => ({
      channelId,
      tagId,
    })));
  }
}

/** Load associated website ids for a set of channel ids as a map of id → string[]. */
async function loadChannelWebsitesMap(channelIds: string[]): Promise<Map<string, string[]>> {
  if (channelIds.length === 0) return new Map();
  const rows = await db
    .select({
      channelId: websiteYoutubeChannels.channelId,
      websiteId: websiteYoutubeChannels.websiteId,
    })
    .from(websiteYoutubeChannels)
    .where(inArray(websiteYoutubeChannels.channelId, channelIds));
  return buildStringMap(rows, r => r.channelId, r => r.websiteId);
}

/** Replace the full set of associated websites for a channel (delete-then-insert). */
async function setChannelWebsites(
  txOrDb: Tx | typeof db,
  channelId: string,
  websiteIds: string[],
): Promise<void> {
  await txOrDb.delete(websiteYoutubeChannels).where(eq(websiteYoutubeChannels.channelId, channelId));
  if (websiteIds.length > 0) {
    await txOrDb.insert(websiteYoutubeChannels).values(websiteIds.map(websiteId => ({
      websiteId,
      channelId,
    })));
  }
}

/** Load associated group ids for a set of channel ids as a map of id → string[]. */
async function loadChannelGroupsMap(channelIds: string[]): Promise<Map<string, string[]>> {
  if (channelIds.length === 0) return new Map();
  const rows = await db
    .select({
      channelId: groupYoutubeChannels.channelId,
      groupId: groupYoutubeChannels.groupId,
    })
    .from(groupYoutubeChannels)
    .where(inArray(groupYoutubeChannels.channelId, channelIds));
  return buildStringMap(rows, r => r.channelId, r => r.groupId);
}

/** Replace the full set of associated groups for a channel (delete-then-insert). */
async function setChannelGroups(
  txOrDb: Tx | typeof db,
  channelId: string,
  groupIds: string[],
): Promise<void> {
  await txOrDb.delete(groupYoutubeChannels).where(eq(groupYoutubeChannels.channelId, channelId));
  if (groupIds.length > 0) {
    await txOrDb.insert(groupYoutubeChannels).values(groupIds.map(groupId => ({
      groupId,
      channelId,
    })));
  }
}

/** Load self-identifiers for a set of channel ids as a map of id → string[]. */
async function loadSelfIdsMap(channelIds: string[]): Promise<Map<string, string[]>> {
  if (channelIds.length === 0) return new Map();
  const rows = await db
    .select({
      channelId: youtubeChannelSelfIds.channelId,
      value: youtubeChannelSelfIds.value,
    })
    .from(youtubeChannelSelfIds)
    .where(inArray(youtubeChannelSelfIds.channelId, channelIds));
  return buildStringMap(rows, r => r.channelId, r => r.value);
}

/** Map a DB row to the shared `YouTubeChannel` wire type. */
function toYouTubeChannel(
  row: YouTubeChannelRow & {
    bookmarkCount?: number;
    avatarCreatedAt?: Date | string | null;
    categoryId?: string | null;
    categoryName?: string | null;
    categorySlug?: string | null;
    categoryIcon?: string | null;
  },
  selfIds: string[] = [],
  tagIds: string[] = [],
  websiteIds: string[] = [],
  groupIds: string[] = [],
): YouTubeChannel {
  return {
    id: row.id,
    channelKey: row.channelKey,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
    selfIds,
    imageUrl: avatarUrlFrom(row.id, row.avatarCreatedAt ?? null),
    category: row.categoryId && row.categoryName
      ? {
        id: row.categoryId,
        name: row.categoryName,
        slug: row.categorySlug ?? slugify(row.categoryName),
        icon: row.categoryIcon ?? null,
      }
      : null,
    tagIds,
    websiteIds,
    groupIds,
  };
}

/** Existing channel slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(youtubeChannels, youtubeChannels.slug, youtubeChannels.id, excludeId);

/** List all channels, ordered by name. */
export async function listYouTubeChannels(): Promise<YouTubeChannel[]> {
  const rows = await db
    .select({
      id: youtubeChannels.id,
      channelKey: youtubeChannels.channelKey,
      name: youtubeChannels.name,
      slug: youtubeChannels.slug,
      createdAt: youtubeChannels.createdAt,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.youtubeChannelId, youtubeChannels.id)),
      avatarCreatedAt: youtubeChannelImages.createdAt,
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryIcon: categories.icon,
    })
    .from(youtubeChannels)
    .leftJoin(youtubeChannelImages, eq(youtubeChannelImages.youtubeChannelId, youtubeChannels.id))
    .leftJoin(categories, eq(categories.id, youtubeChannels.categoryId))
    .orderBy(asc(youtubeChannels.name));

  const ids = rows.map(r => r.id);
  const [selfIdsMap, tagsMap, websitesMap, groupsMap] = await Promise.all([
    loadSelfIdsMap(ids),
    loadChannelTagsMap(ids),
    loadChannelWebsitesMap(ids),
    loadChannelGroupsMap(ids),
  ]);
  return rows.map(row =>
    toYouTubeChannel(
      row,
      selfIdsMap.get(row.id) ?? [],
      tagsMap.get(row.id) ?? [],
      websitesMap.get(row.id) ?? [],
      groupsMap.get(row.id) ?? [],
    ));
}

/** Shared select shape for single-channel lookups (includes category join). */
const channelSelect = {
  id: youtubeChannels.id,
  channelKey: youtubeChannels.channelKey,
  name: youtubeChannels.name,
  slug: youtubeChannels.slug,
  categoryId: youtubeChannels.categoryId,
  createdAt: youtubeChannels.createdAt,
  avatarCreatedAt: youtubeChannelImages.createdAt,
  categoryName: categories.name,
  categorySlug: categories.slug,
  categoryIcon: categories.icon,
};

/** Load self-ids + tags + associated websites/groups for a single channel row and map it to the wire type. */
async function hydrateChannelRow(row: Parameters<typeof toYouTubeChannel>[0]): Promise<YouTubeChannel> {
  const [selfIdsMap, tagsMap, websitesMap, groupsMap] = await Promise.all([
    loadSelfIdsMap([row.id]),
    loadChannelTagsMap([row.id]),
    loadChannelWebsitesMap([row.id]),
    loadChannelGroupsMap([row.id]),
  ]);
  return toYouTubeChannel(
    row,
    selfIdsMap.get(row.id) ?? [],
    tagsMap.get(row.id) ?? [],
    websitesMap.get(row.id) ?? [],
    groupsMap.get(row.id) ?? [],
  );
}

/** Fetch a single channel by id, or `null` when absent. */
export async function getYouTubeChannel(id: string): Promise<YouTubeChannel | null> {
  const [row] = await db
    .select(channelSelect)
    .from(youtubeChannels)
    .leftJoin(youtubeChannelImages, eq(youtubeChannelImages.youtubeChannelId, youtubeChannels.id))
    .leftJoin(categories, eq(categories.id, youtubeChannels.categoryId))
    .where(eq(youtubeChannels.id, id));
  if (!row) return null;
  return hydrateChannelRow(row);
}

/** Fetch a channel by its stable channel key, or `null` when absent. */
export async function getYouTubeChannelByKey(channelKey: string): Promise<YouTubeChannel | null> {
  const [row] = await db
    .select(channelSelect)
    .from(youtubeChannels)
    .leftJoin(youtubeChannelImages, eq(youtubeChannelImages.youtubeChannelId, youtubeChannels.id))
    .leftJoin(categories, eq(categories.id, youtubeChannels.categoryId))
    .where(eq(youtubeChannels.channelKey, channelKey));
  if (!row) return null;
  return hydrateChannelRow(row);
}

/**
 * Resolve the channel for a `{ key, name }` hint inside a transaction, creating it when none exists
 * yet. Returns the channel id, or `null` when the hint is unusable.
 * When `hint.selfIds` is provided, replaces the channel's self-identifier set.
 */
export async function ensureYouTubeChannel(
  tx: Tx,
  hint: { key: string;
    name: string;
    selfIds?: string[]; },
): Promise<string | null> {
  const channelKey = hint.key.trim();
  const name = hint.name.trim();
  if (channelKey.length === 0 || name.length === 0) return null;

  const [existing] = await tx
    .select({
      id: youtubeChannels.id,
    })
    .from(youtubeChannels)
    .where(eq(youtubeChannels.channelKey, channelKey));

  let channelId: string;

  if (existing) {
    channelId = existing.id;
  }
  else {
    const slug = uniqueSlug(name, await takenSlugs(), "youtube-channel");
    const inserted = await tx
      .insert(youtubeChannels)
      .values({
        channelKey,
        name,
        slug,
      })
      .onConflictDoNothing({
        target: youtubeChannels.channelKey,
      })
      .returning({
        id: youtubeChannels.id,
      });

    if (inserted.length > 0) {
      channelId = inserted[0].id;
    }
    else {
      // Lost a concurrent insert race — re-read the row the other writer created.
      const [row] = await tx
        .select({
          id: youtubeChannels.id,
        })
        .from(youtubeChannels)
        .where(eq(youtubeChannels.channelKey, channelKey));
      if (!row) return null;
      channelId = row.id;
    }
  }

  if (hint.selfIds && hint.selfIds.length > 0) {
    await setSelfIds(tx, channelId, hint.selfIds);
  }

  return channelId;
}

/** Rename a channel and/or update its self-identifiers and category. Returns the updated row, or `null` when absent. */
export async function updateYouTubeChannel(
  id: string,
  input: UpdateYouTubeChannelInput,
): Promise<YouTubeChannel | null> {
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length > 0) {
      const [clash] = await db.select({
        id: youtubeChannels.id,
      }).from(youtubeChannels).where(eq(youtubeChannels.name, name));
      if (clash && clash.id !== id) throw new DuplicateYouTubeChannelError(name);

      const slug = uniqueSlug(name, await takenSlugs(id), "youtube-channel");
      await db
        .update(youtubeChannels)
        .set({
          name,
          slug,
        })
        .where(eq(youtubeChannels.id, id));
    }
  }

  if (input.selfIds !== undefined) {
    await setSelfIds(db, id, input.selfIds);
  }

  if ("categoryId" in input) {
    await db
      .update(youtubeChannels)
      .set({
        categoryId: input.categoryId ?? null,
      })
      .where(eq(youtubeChannels.id, id));
  }

  if (input.tagIds !== undefined) {
    await setChannelTags(db, id, input.tagIds);
  }

  if (input.websiteIds !== undefined) {
    await setChannelWebsites(db, id, input.websiteIds);
  }

  if (input.groupIds !== undefined) {
    await setChannelGroups(db, id, input.groupIds);
  }

  return getYouTubeChannel(id);
}

/** Delete a channel. Bookmarks pointing at it have their `youtubeChannelId` set to NULL via FK. */
export async function deleteYouTubeChannel(id: string): Promise<boolean> {
  const rows = await db.delete(youtubeChannels).where(eq(youtubeChannels.id, id)).returning({
    id: youtubeChannels.id,
  });
  // The FK sets bookmarks.youtubeChannelId to NULL — matchable data (youtube-channel conditions).
  if (rows.length > 0) {
    await deleteLanguageUsagesForOwner("youtubeChannel", id);
    // Genre/mood assignments key off (ownerType, ownerId) with no FK on ownerId, so clean them up here.
    await deleteGenreMoodAssignmentsForOwner("youtubeChannel", id);
    invalidateBookmarkCache();
  }
  return rows.length > 0;
}

/** Delete many YouTube channels, reporting per-item outcomes. */
export function bulkDeleteYouTubeChannels(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteYouTubeChannel);
}

/**
 * Create a YouTube channel by hand from a channel URL and display name.
 * Throws `InvalidChannelUrlError` when the URL yields no usable channel key,
 * and `DuplicateChannelKeyError` when a channel with that key already exists.
 */
export async function createYouTubeChannel(input: CreateYouTubeChannelInput): Promise<YouTubeChannel> {
  const channelKey = channelKeyFromUrl(input.channelUrl.trim());
  if (!channelKey) throw new InvalidChannelUrlError(input.channelUrl);

  const existing = await getYouTubeChannelByKey(channelKey);
  if (existing) throw new DuplicateChannelKeyError(channelKey);

  const name = input.name.trim();
  const slug = uniqueSlug(name, await takenSlugs(), "youtube-channel");
  const [row] = await db
    .insert(youtubeChannels)
    .values({
      channelKey,
      name,
      slug,
    })
    .returning({
      id: youtubeChannels.id,
    });

  return (await getYouTubeChannel(row.id))!;
}

/** Fill in slugs for any channels missing one (e.g. rows that predate the `slug` column). */
export async function backfillYouTubeChannelSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: youtubeChannels.id,
      name: youtubeChannels.name,
    })
    .from(youtubeChannels)
    .where(isNull(youtubeChannels.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const channel of missing) {
    const slug = uniqueSlug(channel.name, taken, "youtube-channel");
    taken.push(slug);
    await db.update(youtubeChannels).set({
      slug,
    }).where(eq(youtubeChannels.id, channel.id));
  }
}
