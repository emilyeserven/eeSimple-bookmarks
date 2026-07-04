import type {
  CreateEpisodeInput,
  Episode,
  UpdateEpisodeInput,
} from "@eesimple/types";
import { createPlexTaxonomyService } from "@/services/plexTaxonomyService";
import { mainTaxonomyImageUrl } from "@/services/taxonomyImages";
import { bookmarks, episodes, type EpisodeRow } from "@/db/schema";
import { slugify } from "@/utils/slug";

/** Thrown when a create/rename collides with an existing episode name. */
export class DuplicateEpisodeError extends Error {
  constructor(name: string) {
    super(`An episode named "${name}" already exists`);
    this.name = "DuplicateEpisodeError";
  }
}

/** Map a DB row to the shared `Episode` wire type. */
function toEpisode(row: EpisodeRow & {
  bookmarkCount?: number;
  mainImage?: { id: string;
    createdAt: Date | string; } | null;
}): Episode {
  return {
    id: row.id,
    name: row.name,
    romanizedName: row.romanizedName ?? null,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
    tvShowId: row.tvShowId ?? null,
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
  };
}

const service = createPlexTaxonomyService<typeof episodes, Episode, CreateEpisodeInput, UpdateEpisodeInput>({
  table: episodes,
  bookmarkFk: bookmarks.episodeId,
  taxonomyImageOwnerType: "episode",
  makeDuplicateError: name => new DuplicateEpisodeError(name),
  toWire: toEpisode,
  extraDataFromInput: (input) => {
    const patch: Record<string, unknown> = {};
    if (input.tvShowId !== undefined) patch.tvShowId = input.tvShowId ?? null;
    return patch;
  },
});

/** List all episodes, ordered by sort order then name, each with its bookmark count. */
export const listEpisodes = service.list;
/** Add an episode. Throws `DuplicateEpisodeError` on a name clash. */
export const createEpisode = service.create;
/** Update an episode (rename, reorder, re-link Plex/media property/parent). Throws on a name clash. */
export const updateEpisode = service.update;
/** Delete an episode. The `set null` FK unlinks any bookmarks pointing at it. */
export const deleteEpisode = service.delete;
/** Delete many episodes, reporting per-item outcomes. */
export const bulkDeleteEpisodes = service.bulkDelete;
/** Fill in slugs for any episodes missing one (e.g. rows that predate the `slug` column). */
export const backfillEpisodeSlugs = service.backfillSlugs;
