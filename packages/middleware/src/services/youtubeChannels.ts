import { asc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { UpdateYouTubeChannelInput, YouTubeChannel } from "@eesimple/types";
import { db } from "@/db";
import { bookmarks, categories, type YouTubeChannelRow, youtubeChannelImages, youtubeChannelSelfIds, youtubeChannels } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";

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
export class DuplicateYouTubeChannelError extends Error {
  constructor(name: string) {
    super(`A channel named "${name}" already exists`);
    this.name = "DuplicateYouTubeChannelError";
  }
}

/**
 * Derive a stable, normalized channel key from a channel URL (oEmbed's `author_url`). Prefers a
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

/**
 * Reconstruct a browsable channel-page URL from a stored `channelKey`, inverting `channelKeyFromUrl`.
 * Handles (`@name`) and channel ids (`UC…`) round-trip exactly; bare vanity names fall back to the
 * `/c/<name>` path. Used to fetch a channel's avatar (its page `og:image`) on demand. Pure.
 */
export function channelUrlFromKey(channelKey: string): string {
  const key = channelKey.trim();
  if (key.startsWith("@")) return `https://www.youtube.com/${key}`;
  // Channel ids are "UC" followed by 22 url-safe chars; route them through `/channel/`.
  if (/^UC[\w-]{20,}$/.test(key)) return `https://www.youtube.com/channel/${key}`;
  return `https://www.youtube.com/c/${key}`;
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
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.channelId) ?? [];
    existing.push(row.value);
    map.set(row.channelId, existing);
  }
  return map;
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
  };
}

/** Existing channel slugs, optionally excluding one row (when renaming). */
async function takenSlugs(excludeId?: string): Promise<string[]> {
  const rows = await db
    .select({
      slug: youtubeChannels.slug,
    })
    .from(youtubeChannels)
    .where(excludeId ? ne(youtubeChannels.id, excludeId) : undefined);
  return rows.map(r => r.slug).filter((s): s is string => s !== null);
}

/** List all channels, ordered by name. */
export async function listYouTubeChannels(): Promise<YouTubeChannel[]> {
  const rows = await db
    .select({
      id: youtubeChannels.id,
      channelKey: youtubeChannels.channelKey,
      name: youtubeChannels.name,
      slug: youtubeChannels.slug,
      createdAt: youtubeChannels.createdAt,
      bookmarkCount: sql<number>`(select count(*)::int from ${bookmarks} where ${bookmarks.youtubeChannelId} = ${youtubeChannels.id})`.mapWith(Number),
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

  const selfIdsMap = await loadSelfIdsMap(rows.map(r => r.id));
  return rows.map(row => toYouTubeChannel(row, selfIdsMap.get(row.id) ?? []));
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

/** Fetch a single channel by id, or `null` when absent. */
export async function getYouTubeChannel(id: string): Promise<YouTubeChannel | null> {
  const [row] = await db
    .select(channelSelect)
    .from(youtubeChannels)
    .leftJoin(youtubeChannelImages, eq(youtubeChannelImages.youtubeChannelId, youtubeChannels.id))
    .leftJoin(categories, eq(categories.id, youtubeChannels.categoryId))
    .where(eq(youtubeChannels.id, id));
  if (!row) return null;
  const selfIdsMap = await loadSelfIdsMap([id]);
  return toYouTubeChannel(row, selfIdsMap.get(id) ?? []);
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
  const selfIdsMap = await loadSelfIdsMap([row.id]);
  return toYouTubeChannel(row, selfIdsMap.get(row.id) ?? []);
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
    const slug = uniqueSlug(name, await takenSlugs());
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

      const slug = uniqueSlug(name, await takenSlugs(id));
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

  return getYouTubeChannel(id);
}

/** Delete a channel. Bookmarks pointing at it have their `youtubeChannelId` set to NULL via FK. */
export async function deleteYouTubeChannel(id: string): Promise<boolean> {
  const rows = await db.delete(youtubeChannels).where(eq(youtubeChannels.id, id)).returning({
    id: youtubeChannels.id,
  });
  return rows.length > 0;
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
    const slug = uniqueSlug(channel.name, taken);
    taken.push(slug);
    await db.update(youtubeChannels).set({
      slug,
    }).where(eq(youtubeChannels.id, channel.id));
  }
}
