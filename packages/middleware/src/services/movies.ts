import { asc, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateMovieInput,
  Movie,
  UpdateMovieInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { albums, artists, bookmarks, episodes, movies, tracks, tvShows, type MovieRow } from "@/db/schema";
import { slugify, uniqueSlug } from "@/utils/slug";
import { takenSlugsOf } from "@/utils/taxonomySlugs";

/** Thrown when a create/rename collides with an existing movie name. */
export class DuplicateMovieError extends Error {
  constructor(name: string) {
    super(`A movie named "${name}" already exists`);
    this.name = "DuplicateMovieError";
  }
}

/** Map a DB row to the shared `Movie` wire type. */
function toMovie(row: MovieRow & { bookmarkCount?: number }): Movie {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName ?? null,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
    plexRatingKey: row.plexRatingKey ?? null,
    plexItemType: row.plexItemType ?? null,
    plexItemTitle: row.plexItemTitle ?? null,
    year: row.year ?? null,
    wikidataId: row.wikidataId ?? null,
    wikipediaLinkEn: row.wikipediaLinkEn ?? null,
    wikipediaLinkLocal: row.wikipediaLinkLocal ?? null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    bookmarkCount: row.bookmarkCount,
  };
}

/** Existing movie slugs, optionally excluding one row (when renaming). */
const takenSlugs = (excludeId?: string) =>
  takenSlugsOf(movies, movies.slug, movies.id, excludeId);

/** The Plex/media-property columns settable on create and patchable on update. */
type MovieDataColumns = Pick<
  MovieRow,
  "mediaPropertyId" | "plexRatingKey" | "plexItemType" | "plexItemTitle" | "year" | "romanizedName"
  | "wikidataId" | "wikipediaLinkEn" | "wikipediaLinkLocal"
>;

/** Build the settable data columns from an input, treating missing keys as "leave"/null. */
function dataFromInput(input: CreateMovieInput | UpdateMovieInput): Partial<MovieDataColumns> {
  const patch: Partial<MovieDataColumns> = {};
  if (input.mediaPropertyId !== undefined) patch.mediaPropertyId = input.mediaPropertyId ?? null;
  if (input.plexRatingKey !== undefined) patch.plexRatingKey = input.plexRatingKey ?? null;
  if (input.plexItemType !== undefined) patch.plexItemType = input.plexItemType ?? null;
  if (input.plexItemTitle !== undefined) patch.plexItemTitle = input.plexItemTitle ?? null;
  if (input.year !== undefined) patch.year = input.year ?? null;
  if (input.romanizedName !== undefined) patch.romanizedName = input.romanizedName ?? null;
  if (input.wikidataId !== undefined) patch.wikidataId = input.wikidataId ?? null;
  if (input.wikipediaLinkEn !== undefined) patch.wikipediaLinkEn = input.wikipediaLinkEn ?? null;
  if (input.wikipediaLinkLocal !== undefined) patch.wikipediaLinkLocal = input.wikipediaLinkLocal ?? null;
  return patch;
}

/** List all movies, ordered by sort order then name, each with its bookmark count. */
export async function listMovies(): Promise<Movie[]> {
  const rows = await db
    .select({
      id: movies.id,
      name: movies.name,
      romanizedName: movies.romanizedName,
      slug: movies.slug,
      sortOrder: movies.sortOrder,
      mediaPropertyId: movies.mediaPropertyId,
      plexRatingKey: movies.plexRatingKey,
      plexItemType: movies.plexItemType,
      plexItemTitle: movies.plexItemTitle,
      year: movies.year,
      wikidataId: movies.wikidataId,
      wikipediaLinkEn: movies.wikipediaLinkEn,
      wikipediaLinkLocal: movies.wikipediaLinkLocal,
      createdAt: movies.createdAt,
      bookmarkCount: db.$count(bookmarks, eq(bookmarks.movieId, movies.id)),
    })
    .from(movies)
    .orderBy(asc(movies.sortOrder), asc(movies.name));
  return rows.map(toMovie);
}

/** Add a movie. Throws `DuplicateMovieError` on a name clash. */
export async function createMovie(input: CreateMovieInput): Promise<Movie> {
  const name = input.name.trim();
  if (name.length === 0) throw new DuplicateMovieError(input.name);

  const [clash] = await db.select({
    id: movies.id,
  }).from(movies).where(eq(movies.name, name));
  if (clash) throw new DuplicateMovieError(name);

  const slug = uniqueSlug(name, await takenSlugs());
  const [row] = await db.insert(movies).values({
    name,
    slug,
    sortOrder: input.sortOrder ?? 0,
    ...dataFromInput(input),
  }).returning();
  return toMovie(row);
}

/** Update a movie (rename, reorder, re-link Plex/media property). Throws on a name clash. */
export async function updateMovie(id: string, input: UpdateMovieInput): Promise<Movie | null> {
  const [existing] = await db.select().from(movies).where(eq(movies.id, id));
  if (!existing) return null;

  const patch: Partial<Pick<MovieRow, "name" | "slug" | "sortOrder">> & Partial<MovieDataColumns> = {
    ...dataFromInput(input),
  };
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const name = input.name.trim();
    const [clash] = await db.select({
      id: movies.id,
    }).from(movies).where(eq(movies.name, name));
    if (clash && clash.id !== id) throw new DuplicateMovieError(name);
    patch.name = name;
    patch.slug = uniqueSlug(name, await takenSlugs(id));
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (Object.keys(patch).length === 0) return toMovie(existing);

  const [row] = await db.update(movies).set(patch).where(eq(movies.id, id)).returning();
  return row ? toMovie(row) : null;
}

/** Delete a movie. The `set null` FK unlinks any bookmarks pointing at it. */
export async function deleteMovie(id: string): Promise<boolean> {
  const rows = await db.delete(movies).where(eq(movies.id, id)).returning({
    id: movies.id,
  });
  return rows.length > 0;
}

/** Delete many movies, reporting per-item outcomes. */
export function bulkDeleteMovies(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteMovie);
}

/** Fill in slugs for any movies missing one (e.g. rows that predate the `slug` column). */
export async function backfillMovieSlugs(): Promise<void> {
  const missing = await db
    .select({
      id: movies.id,
      name: movies.name,
    })
    .from(movies)
    .where(isNull(movies.slug));
  if (missing.length === 0) return;

  const taken = await takenSlugs();
  for (const movie of missing) {
    const slug = uniqueSlug(movie.name, taken);
    taken.push(slug);
    await db.update(movies).set({
      slug,
    }).where(eq(movies.id, movie.id));
  }
}

/** The bookmark's six Plex-taxonomy FK links (at most one set). */
export interface BookmarkPlexLinks {
  movieId: string | null;
  tvShowId: string | null;
  episodeId: string | null;
  albumId: string | null;
  artistId: string | null;
  trackId: string | null;
}

/**
 * Resolve the effective Plex rating key for a bookmark: the linked Movie / TV Show / Episode / Album /
 * Artist / Track's `plexRatingKey` when one is linked and carries it, else the bookmark's legacy
 * `plexRatingKey`. Returns null when none is available. (Lives here alongside the Movies service; all
 * six taxonomy tables are queried so every bookmark Plex FK resolves through one helper.)
 */
export async function resolveBookmarkPlexRatingKey(
  links: BookmarkPlexLinks,
  legacyRatingKey: string | null,
): Promise<string | null> {
  const lookups = [
    {
      id: links.movieId,
      table: movies,
    },
    {
      id: links.tvShowId,
      table: tvShows,
    },
    {
      id: links.episodeId,
      table: episodes,
    },
    {
      id: links.albumId,
      table: albums,
    },
    {
      id: links.artistId,
      table: artists,
    },
    {
      id: links.trackId,
      table: tracks,
    },
  ] as const;
  for (const {
    id, table,
  } of lookups) {
    if (!id) continue;
    const [row] = await db.select({
      plexRatingKey: table.plexRatingKey,
    }).from(table).where(eq(table.id, id));
    if (row?.plexRatingKey) return row.plexRatingKey;
  }
  return legacyRatingKey ?? null;
}
