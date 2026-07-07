import { eq } from "drizzle-orm";
import type {
  CreateMovieInput,
  LabeledWebsite,
  Movie,
  UpdateMovieInput,
} from "@eesimple/types";
import { db } from "@/db";
import { createPlexTaxonomyService } from "@/services/plexTaxonomyService";
import { mainTaxonomyImageUrl } from "@/services/taxonomyImages";
import { albums, bookmarks, episodes, movies, tracks, tvShows, type MovieRow } from "@/db/schema";
import { AppError } from "@/utils/errors";
import { slugify } from "@/utils/slug";

/** Thrown when a create/rename collides with an existing movie name. */
export class DuplicateMovieError extends AppError {
  constructor(name: string) {
    super(`A movie named "${name}" already exists`, "duplicateName", 409, {
      entity: "movie",
      name,
    });
  }
}

/** Map a DB row to the shared `Movie` wire type. */
function toMovie(row: MovieRow & {
  bookmarkCount?: number;
  mainImage?: { id: string;
    createdAt: Date | string; } | null;
}): Movie {
  return {
    id: row.id,
    name: row.name,
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
    imageUrl: mainTaxonomyImageUrl(row.mainImage ?? null),
    labeledWebsites: (row.labeledWebsites as LabeledWebsite[] | null) ?? [],
  };
}

const service = createPlexTaxonomyService<typeof movies, Movie, CreateMovieInput, UpdateMovieInput>({
  table: movies,
  bookmarkFk: bookmarks.movieId,
  taxonomyImageOwnerType: "movie",
  languageUsageOwnerType: "movie",
  genreMoodOwnerType: "movie",
  locationOwnerType: "movie",
  entityNameOwnerType: "movie",
  makeDuplicateError: name => new DuplicateMovieError(name),
  toWire: toMovie,
});

/** List all movies, ordered by sort order then name, each with its bookmark count. */
export const listMovies = service.list;
/** Add a movie. Throws `DuplicateMovieError` on a name clash. */
export const createMovie = service.create;
/** Update a movie (rename, reorder, re-link Plex/media property). Throws on a name clash. */
export const updateMovie = service.update;
/** Delete a movie. The `set null` FK unlinks any bookmarks pointing at it. */
export const deleteMovie = service.delete;
/** Delete many movies, reporting per-item outcomes. */
export const bulkDeleteMovies = service.bulkDelete;
/** Fill in slugs for any movies missing one (e.g. rows that predate the `slug` column). */
export const backfillMovieSlugs = service.backfillSlugs;

/** The bookmark's five Plex-taxonomy FK links (at most one set). */
export interface BookmarkPlexLinks {
  movieId: string | null;
  tvShowId: string | null;
  episodeId: string | null;
  albumId: string | null;
  trackId: string | null;
}

/**
 * Resolve the effective Plex rating key for a bookmark: the linked Movie / TV Show / Episode / Album /
 * Track's `plexRatingKey` when one is linked and carries it, else the bookmark's legacy
 * `plexRatingKey`. Returns null when none is available. (Lives here alongside the Movies service; all
 * five taxonomy tables are queried so every bookmark Plex FK resolves through one helper.)
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
