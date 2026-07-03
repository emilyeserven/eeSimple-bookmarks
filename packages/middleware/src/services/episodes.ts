import { asc, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateEpisodeInput,
  Episode,
  UpdateEpisodeInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { bookmarks, episodes, type EpisodeRow } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing episode name. */
export class DuplicateEpisodeError extends Error {
  constructor(name: string) {
    super(`An episode named "${name}" already exists`);
    this.name = "DuplicateEpisodeError";
  }
}

/** Map a DB row to the shared `Episode` wire type. */
function toEpisode(row: EpisodeRow & { bookmarkCount?: number }): Episode {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
    tvShowId: row.tvShowId ?? null,
    plexRatingKey: row.plexRatingKey ?? null,
    plexItemType: row.plexItemType ?? null,
    year: row.year ?? null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
  };
}

/** Existing episode slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(episodes, episodes.slug, episodes.id, excludeId);

/** The Plex/media-property/parent columns settable on create and patchable on update. */
type EpisodeDataColumns = Pick<
  EpisodeRow,
  "mediaPropertyId" | "tvShowId" | "plexRatingKey" | "plexItemType" | "year"
>;

/** Build the settable data columns from an input, treating missing keys as "leave"/null. */
function dataFromInput(input: CreateEpisodeInput | UpdateEpisodeInput): Partial<EpisodeDataColumns> {
  const patch: Partial<EpisodeDataColumns> = {};
  if (input.mediaPropertyId !== undefined) patch.mediaPropertyId = input.mediaPropertyId ?? null;
  if (input.tvShowId !== undefined) patch.tvShowId = input.tvShowId ?? null;
  if (input.plexRatingKey !== undefined) patch.plexRatingKey = input.plexRatingKey ?? null;
  if (input.plexItemType !== undefined) patch.plexItemType = input.plexItemType ?? null;
  if (input.year !== undefined) patch.year = input.year ?? null;
  return patch;
}

/** List all episodes, ordered by sort order then name, each with its bookmark count. */
export async function listEpisodes(): Promise<Episode[]> {
  const rows = await db
    .select({
      id: episodes.id,
      name: episodes.name,
      slug: episodes.slug,
      sortOrder: episodes.sortOrder,
      mediaPropertyId: episodes.mediaPropertyId,
      tvShowId: episodes.tvShowId,
      plexRatingKey: episodes.plexRatingKey,
      plexItemType: episodes.plexItemType,
      year: episodes.year,
      createdAt: episodes.createdAt,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.episodeId, episodes.id)),
    })
    .from(episodes)
    .orderBy(asc(episodes.sortOrder), asc(episodes.name));
  return rows.map(toEpisode);
}

/** Add an episode. Throws `DuplicateEpisodeError` on a name clash. */
export async function createEpisode(input: CreateEpisodeInput): Promise<Episode> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateEpisodeError(input.name);

  const [clash] = await db.select({
    id: episodes.id,
  }).from(episodes).where(eq(episodes.name, name));
  if (clash) throw new DuplicateEpisodeError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(episodes).values({
    name,
    slug,
    sortOrder: input.sortOrder ?? 0,
    ...dataFromInput(input),
  }).returning();
  return toEpisode(row);
}

/** Update an episode (rename, reorder, re-link Plex/media property/parent). Throws on a name clash. */
export async function updateEpisode(id: string, input: UpdateEpisodeInput): Promise<Episode | null> {
  const [existing] = await db.select().from(episodes).where(eq(episodes.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<EpisodeRow, "name" | "slug" | "sortOrder">> & Partial<EpisodeDataColumns> = {
    ...dataFromInput(input),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: episodes.id,
    }).from(episodes).where(eq(episodes.name, name));
    if (clash && clash.id !== id) throw new DuplicateEpisodeError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toEpisode(existing);

  const [row] = await db.update(episodes).set(patch).where(eq(episodes.id, id)).returning();
  return row ? toEpisode(row) : null;
}

/** Delete an episode. The `set null` FK unlinks any bookmarks pointing at it. */
export async function deleteEpisode(id: string): Promise<boolean> {
  const rows = await db.delete(episodes).where(eq(episodes.id, id)).returning({
    id: episodes.id,
  });
  return rows.length > 0;
}

/** Delete many episodes, reporting per-item outcomes. */
export function bulkDeleteEpisodes(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteEpisode);
}

/** Fill in slugs for any episodes missing one (e.g. rows that predate the `slug` column). */
export async function backfillEpisodeSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: episodes.id,
      name: episodes.name,
    })
    .from(episodes)
    .where(isNull(episodes.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const episode of missing) {
    const slug = uniqueSlug(episode.name, taken);
    taken.push(slug);
    await db.update(episodes).set({
      slug,
    }).where(eq(episodes.id, episode.id));
  }
}
