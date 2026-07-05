import type {
  CreateTrackInput,
  Track,
  UpdateTrackInput,
} from "@eesimple/types";
import { createPlexTaxonomyService } from "@/services/plexTaxonomyService";
import { mainTaxonomyImageUrl } from "@/services/taxonomyImages";
import { bookmarks, tracks, type TrackRow } from "@/db/schema";
import { AppError } from "@/utils/errors";
import { slugify } from "@/utils/slug";

/** Thrown when a create/rename collides with an existing track name. */
export class DuplicateTrackError extends AppError {
  constructor(name: string) {
    super(`A track named "${name}" already exists`, "duplicateName", 409, {
      entity: "track",
      name,
    });
  }
}

/** Map a DB row to the shared `Track` wire type. */
function toTrack(row: TrackRow & {
  bookmarkCount?: number;
  mainImage?: { id: string;
    createdAt: Date | string; } | null;
}): Track {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    sortOrder: row.sortOrder,
    mediaPropertyId: row.mediaPropertyId ?? null,
    albumId: row.albumId ?? null,
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

const service = createPlexTaxonomyService<typeof tracks, Track, CreateTrackInput, UpdateTrackInput>({
  table: tracks,
  bookmarkFk: bookmarks.trackId,
  taxonomyImageOwnerType: "track",
  languageUsageOwnerType: "track",
  genreMoodOwnerType: "track",
  locationOwnerType: "track",
  entityNameOwnerType: "track",
  makeDuplicateError: name => new DuplicateTrackError(name),
  toWire: toTrack,
  extraDataFromInput: (input) => {
    const patch: Record<string, unknown> = {};
    if (input.albumId !== undefined) patch.albumId = input.albumId ?? null;
    return patch;
  },
});

/** List all tracks, ordered by sort order then name, each with its bookmark count. */
export const listTracks = service.list;
/** Add a track. Throws `DuplicateTrackError` on a name clash. */
export const createTrack = service.create;
/** Update a track (rename, reorder, re-link Plex/media property/parent). Throws on a name clash. */
export const updateTrack = service.update;
/** Delete a track. The `set null` FK unlinks any bookmarks pointing at it. */
export const deleteTrack = service.delete;
/** Delete many tracks, reporting per-item outcomes. */
export const bulkDeleteTracks = service.bulkDelete;
/** Fill in slugs for any tracks missing one (e.g. rows that predate the `slug` column). */
export const backfillTrackSlugs = service.backfillSlugs;
