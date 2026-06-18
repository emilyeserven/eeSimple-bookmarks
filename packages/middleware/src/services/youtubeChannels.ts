import { asc, eq, isNull, ne, sql } from "drizzle-orm";
import type { UpdateYouTubeChannelInput, YouTubeChannel } from "@eesimple/types";
import { db } from "@/db";
import { bookmarks, type YouTubeChannelRow, youtubeChannels } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";

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

/** Map a DB row to the shared `YouTubeChannel` wire type. */
function toYouTubeChannel(row: YouTubeChannelRow & { bookmarkCount?: number }): YouTubeChannel {
  return {
    id: row.id,
    channelKey: row.channelKey,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
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
    })
    .from(youtubeChannels)
    .orderBy(asc(youtubeChannels.name));
  return rows.map(toYouTubeChannel);
}

/** Fetch a single channel by id, or `null` when absent. */
export async function getYouTubeChannel(id: string): Promise<YouTubeChannel | null> {
  const [row] = await db.select().from(youtubeChannels).where(eq(youtubeChannels.id, id));
  return row ? toYouTubeChannel(row) : null;
}

/** Fetch a channel by its slug, or `null` when absent. */
export async function getYouTubeChannelBySlug(slug: string): Promise<YouTubeChannel | null> {
  const [row] = await db.select().from(youtubeChannels).where(eq(youtubeChannels.slug, slug));
  return row ? toYouTubeChannel(row) : null;
}

/**
 * Resolve the channel for a `{ key, name }` hint inside a transaction, creating it when none exists
 * yet. Returns the channel id, or `null` when the hint is unusable.
 */
export async function ensureYouTubeChannel(
  tx: Tx,
  hint: { key: string;
    name: string; },
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
  if (existing) return existing.id;

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
  if (inserted.length > 0) return inserted[0].id;

  // Lost a concurrent insert race — re-read the row the other writer created.
  const [row] = await tx
    .select({
      id: youtubeChannels.id,
    })
    .from(youtubeChannels)
    .where(eq(youtubeChannels.channelKey, channelKey));
  return row?.id ?? null;
}

/** Rename a channel. Returns the updated row, or `null` when absent. */
export async function updateYouTubeChannel(
  id: string,
  input: UpdateYouTubeChannelInput,
): Promise<YouTubeChannel | null> {
  if (input.name === undefined) return getYouTubeChannel(id);
  const name = input.name.trim();
  if (name.length === 0) return getYouTubeChannel(id);

  const [clash] = await db.select({
    id: youtubeChannels.id,
  }).from(youtubeChannels).where(eq(youtubeChannels.name, name));
  if (clash && clash.id !== id) throw new DuplicateYouTubeChannelError(name);

  const slug = uniqueSlug(name, await takenSlugs(id));
  const [row] = await db
    .update(youtubeChannels)
    .set({
      name,
      slug,
    })
    .where(eq(youtubeChannels.id, id))
    .returning();
  return row ? toYouTubeChannel(row) : null;
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
