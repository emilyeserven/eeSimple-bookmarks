/**
 * The "Location assignment" polymorphic layer — attaches a Location taxonomy term to any owner
 * entity via `(ownerType, ownerId)`, mirroring the `genre_mood_assignments` layer. Unlike the
 * bookmark-specific `bookmark_locations` junction (single-owner FK, matchable in autofill), this is
 * a display/classification association for taxonomy entities. A real FK on the value side (cascade),
 * but `ownerId` carries no FK, so each owner's delete service must clean up its rows.
 */

import type { Location } from "./locations.js";

/**
 * The taxonomy entities a Location term can be attached to. Single edit point — add a target here
 * and thread it through the assignment routes/UI. Currently the media taxonomies (Movies, TV Shows,
 * Episodes, Albums, Tracks, Books, Podcasts).
 */
export const LOCATION_ASSIGNMENT_OWNER_TYPES = [
  "movie",
  "tvShow",
  "episode",
  "album",
  "track",
  "book",
  "podcast",
] as const;

/** One of {@link LOCATION_ASSIGNMENT_OWNER_TYPES}. */
export type LocationAssignmentOwnerType = (typeof LOCATION_ASSIGNMENT_OWNER_TYPES)[number];

/** Lightweight Location shape carried on an owner — enough to render and link. */
export type OwnerLocation = Pick<Location, "id" | "name" | "slug" | "parentId">;

/** A single location ↔ owner attachment row. */
export interface LocationAssignment {
  locationId: string;
  ownerType: LocationAssignmentOwnerType;
  ownerId: string;
}
