import type {
  CreateTvShowInput,
  TvShow,
  UpdateTvShowInput,
} from "@eesimple/types";
import { createPlexTaxonomyService } from "@/services/plexTaxonomyService";
import { bookmarks, tvShows, type TvShowRow } from "@/db/schema";
import { slugify } from "@/utils/slug";

/** Thrown when a create/rename collides with an existing TV show name. */
export class DuplicateTvShowError extends Error {
  constructor(name: string) {
    super(`A TV show named "${name}" already exists`);
    this.name = "DuplicateTvShowError";
  }
}

/** Map a DB row to the shared `TvShow` wire type. */
function toTvShow(row: TvShowRow & { bookmarkCount?: number }): TvShow {
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

const service = createPlexTaxonomyService<typeof tvShows, TvShow, CreateTvShowInput, UpdateTvShowInput>({
  table: tvShows,
  bookmarkFk: bookmarks.tvShowId,
  taxonomyImageOwnerType: "tvShow",
  languageUsageOwnerType: "tvShow",
  makeDuplicateError: name => new DuplicateTvShowError(name),
  toWire: toTvShow,
});

/** List all TV shows, ordered by sort order then name, each with its bookmark count. */
export const listTvShows = service.list;
/** Add a TV show. Throws `DuplicateTvShowError` on a name clash. */
export const createTvShow = service.create;
/** Update a TV show (rename, reorder, re-link Plex/media property). Throws on a name clash. */
export const updateTvShow = service.update;
/** Delete a TV show. The `set null` FK unlinks any bookmarks pointing at it. */
export const deleteTvShow = service.delete;
/** Delete many TV shows, reporting per-item outcomes. */
export const bulkDeleteTvShows = service.bulkDelete;
/** Fill in slugs for any TV shows missing one (e.g. rows that predate the `slug` column). */
export const backfillTvShowSlugs = service.backfillSlugs;
