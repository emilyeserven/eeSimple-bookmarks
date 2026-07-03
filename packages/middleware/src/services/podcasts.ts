import { asc, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreatePodcastInput,
  Podcast,
  PodcastLinkProvider,
  UpdatePodcastInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { bookmarks, podcasts, type PodcastRow } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing podcast name. */
export class DuplicatePodcastError extends Error {
  constructor(name: string) {
    super(`A podcast named "${name}" already exists`);
    this.name = "DuplicatePodcastError";
  }
}

/** Map a DB row to the shared `Podcast` wire type. */
function toPodcast(row: PodcastRow & { bookmarkCount?: number }): Podcast {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName ?? null,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
    feedUrl: row.feedUrl ?? null,
    itunesId: row.itunesId ?? null,
    itunesUrl: row.itunesUrl ?? null,
    spotifyUrl: row.spotifyUrl ?? null,
    pocketCastsUuid: row.pocketCastsUuid ?? null,
    pocketCastsUrl: row.pocketCastsUrl ?? null,
    defaultLinkProvider: (row.defaultLinkProvider as PodcastLinkProvider | null) ?? null,
    author: row.author ?? null,
    description: row.description ?? null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
  };
}

/** Existing podcast slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(podcasts, podcasts.slug, podcasts.id, excludeId);

/** The source/media-property columns settable on create and patchable on update. */
type PodcastDataColumns = Pick<
  PodcastRow,
  | "mediaPropertyId" | "feedUrl" | "itunesId" | "itunesUrl" | "spotifyUrl" | "pocketCastsUuid"
  | "pocketCastsUrl" | "defaultLinkProvider" | "author" | "description" | "romanizedName"
>;

/** Build the settable data columns from an input, treating missing keys as "leave"/null. */
function dataFromInput(input: CreatePodcastInput | UpdatePodcastInput): Partial<PodcastDataColumns> {
  const patch: Partial<PodcastDataColumns> = {};
  if (input.mediaPropertyId !== undefined) patch.mediaPropertyId = input.mediaPropertyId ?? null;
  if (input.feedUrl !== undefined) patch.feedUrl = input.feedUrl ?? null;
  if (input.itunesId !== undefined) patch.itunesId = input.itunesId ?? null;
  if (input.itunesUrl !== undefined) patch.itunesUrl = input.itunesUrl ?? null;
  if (input.spotifyUrl !== undefined) patch.spotifyUrl = input.spotifyUrl ?? null;
  if (input.pocketCastsUuid !== undefined) patch.pocketCastsUuid = input.pocketCastsUuid ?? null;
  if (input.pocketCastsUrl !== undefined) patch.pocketCastsUrl = input.pocketCastsUrl ?? null;
  if (input.defaultLinkProvider !== undefined) patch.defaultLinkProvider = input.defaultLinkProvider ?? null;
  if (input.author !== undefined) patch.author = input.author ?? null;
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.romanizedName !== undefined) patch.romanizedName = input.romanizedName ?? null;
  return patch;
}

/** List all podcasts, ordered by sort order then name, each with its bookmark count. */
export async function listPodcasts(): Promise<Podcast[]> {
  const rows = await db
    .select({
      id: podcasts.id,
      name: podcasts.name,
      romanizedName: podcasts.romanizedName,
      slug: podcasts.slug,
      sortOrder: podcasts.sortOrder,
      mediaPropertyId: podcasts.mediaPropertyId,
      feedUrl: podcasts.feedUrl,
      itunesId: podcasts.itunesId,
      itunesUrl: podcasts.itunesUrl,
      spotifyUrl: podcasts.spotifyUrl,
      pocketCastsUuid: podcasts.pocketCastsUuid,
      pocketCastsUrl: podcasts.pocketCastsUrl,
      defaultLinkProvider: podcasts.defaultLinkProvider,
      author: podcasts.author,
      description: podcasts.description,
      createdAt: podcasts.createdAt,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.podcastId, podcasts.id)),
    })
    .from(podcasts)
    .orderBy(asc(podcasts.sortOrder), asc(podcasts.name));
  return rows.map(toPodcast);
}

/** Fetch a single podcast by id, or `null` when it doesn't exist. */
export async function getPodcast(id: string): Promise<Podcast | null> {
  const [row] = await db.select().from(podcasts).where(eq(podcasts.id, id));
  return row ? toPodcast(row) : null;
}

/** Add a podcast. Throws `DuplicatePodcastError` on a name clash. */
export async function createPodcast(input: CreatePodcastInput): Promise<Podcast> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicatePodcastError(input.name);

  const [clash] = await db.select({
    id: podcasts.id,
  }).from(podcasts).where(eq(podcasts.name, name));
  if (clash) throw new DuplicatePodcastError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(podcasts).values({
    name,
    slug,
    sortOrder: input.sortOrder ?? 0,
    ...dataFromInput(input),
  }).returning();
  return toPodcast(row);
}

/** Update a podcast (rename, reorder, re-link feed/iTunes/media property). Throws on a name clash. */
export async function updatePodcast(id: string, input: UpdatePodcastInput): Promise<Podcast | null> {
  const [existing] = await db.select().from(podcasts).where(eq(podcasts.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<PodcastRow, "name" | "slug" | "sortOrder">> & Partial<PodcastDataColumns> = {
    ...dataFromInput(input),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: podcasts.id,
    }).from(podcasts).where(eq(podcasts.name, name));
    if (clash && clash.id !== id) throw new DuplicatePodcastError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toPodcast(existing);

  const [row] = await db.update(podcasts).set(patch).where(eq(podcasts.id, id)).returning();
  return row ? toPodcast(row) : null;
}

/** Delete a podcast. The `set null` FK unlinks any bookmarks pointing at it. */
export async function deletePodcast(id: string): Promise<boolean> {
  const rows = await db.delete(podcasts).where(eq(podcasts.id, id)).returning({
    id: podcasts.id,
  });
  return rows.length > 0;
}

/** Delete many podcasts, reporting per-item outcomes. */
export function bulkDeletePodcasts(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deletePodcast);
}

/** Fill in slugs for any podcasts missing one (e.g. rows that predate the `slug` column). */
export async function backfillPodcastSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: podcasts.id,
      name: podcasts.name,
    })
    .from(podcasts)
    .where(isNull(podcasts.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const podcast of missing) {
    const slug = uniqueSlug(podcast.name, taken);
    taken.push(slug);
    await db.update(podcasts).set({
      slug,
    }).where(eq(podcasts.id, podcast.id));
  }
}
