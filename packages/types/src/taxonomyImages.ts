/**
 * Shared multi-image gallery for the Plex/Kavita-backed media taxonomies (Movies, TV Shows, Episodes,
 * Albums, Tracks, Books). Mirrors `BookmarkImage`/`bookmark_images`, but one physical owner
 * table can't carry a foreign key into seven different entity tables, so images are keyed by
 * `(ownerType, ownerId)` instead.
 */

/** Which taxonomy a `taxonomy_images` row belongs to. Add a new entity here in exactly one place. */
export const TAXONOMY_IMAGE_OWNER_TYPES = ["movie", "tvShow", "episode", "album", "track", "book", "podcast"] as const;

export type TaxonomyImageOwnerType = typeof TAXONOMY_IMAGE_OWNER_TYPES[number];

/** One stored image belonging to a taxonomy entity. */
export interface TaxonomyImage {
  id: string;
  ownerType: TaxonomyImageOwnerType;
  ownerId: string;
  url: string;
  width: number | null;
  height: number | null;
  source: "upload" | "plex" | "kavita" | "isbn" | "podcast";
  isMain: boolean;
  sortOrder: number;
}
