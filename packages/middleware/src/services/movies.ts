import { asc, eq, isNull } from "drizzle-orm";
import type {
  BulkDeleteResult,
  CreateMovieInput,
  Movie,
  UpdateMovieInput,
} from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { bookmarks, movies, tvShows, type MovieRow } from "@/db/schema";
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
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
    plexRatingKey: row.plexRatingKey ?? null,
    plexItemType: row.plexItemType ?? null,
    year: row.year ?? null,
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
  "mediaPropertyId" | "plexRatingKey" | "plexItemType" | "year"
>;

/** Build the settable data columns from an input, treating missing keys as "leave"/null. */
function dataFromInput(input: CreateMovieInput | UpdateMovieInput): Partial<MovieDataColumns> {
  const patch: Partial<MovieDataColumns> = {};
  if (input.mediaPropertyId !== undefined) patch.mediaPropertyId = input.mediaPropertyId ?? null;
  if (input.plexRatingKey !== undefined) patch.plexRatingKey = input.plexRatingKey ?? null;
  if (input.plexItemType !== undefined) patch.plexItemType = input.plexItemType ?? null;
  if (input.year !== undefined) patch.year = input.year ?? null;
  return patch;
}

/** List all movies, ordered by sort order then name, each with its bookmark count. */
export async function listMovies(): Promise<Movie[]> {
  const rows = await db
    .select({
      id: movies.id,
      name: movies.name,
      slug: movies.slug,
      sortOrder: movies.sortOrder,
      mediaPropertyId: movies.mediaPropertyId,
      plexRatingKey: movies.plexRatingKey,
      plexItemType: movies.plexItemType,
      year: movies.year,
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

/**
 * Resolve the effective Plex rating key for a bookmark: the linked Movie's or TV Show's
 * `plexRatingKey` when one is linked and carries it, else the bookmark's legacy `plexRatingKey`.
 * Returns null when none is available. (Lives here alongside the Movies service; the TV Shows table
 * is queried too so both bookmark FKs resolve through one helper.)
 */
export async function resolveBookmarkPlexRatingKey(
  movieId: string | null,
  tvShowId: string | null,
  legacyRatingKey: string | null,
): Promise<string | null> {
  if (movieId) {
    const [movie] = await db.select({
      plexRatingKey: movies.plexRatingKey,
    }).from(movies).where(eq(movies.id, movieId));
    if (movie?.plexRatingKey) return movie.plexRatingKey;
  }
  if (tvShowId) {
    const [show] = await db.select({
      plexRatingKey: tvShows.plexRatingKey,
    }).from(tvShows).where(eq(tvShows.id, tvShowId));
    if (show?.plexRatingKey) return show.plexRatingKey;
  }
  return legacyRatingKey ?? null;
}
