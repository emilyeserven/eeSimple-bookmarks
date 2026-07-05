/**
 * The "Genres & Moods" taxonomy — a single hierarchical vocabulary unifying genre- and mood-style
 * classification (no built-in distinction between the two). A self-referencing tree like Tags, it is
 * many-to-many with bookmarks and can also be attached to any other taxonomy entity via the
 * polymorphic assignment layer (see {@link GenreMoodAssignment}).
 */

import type { EntityName } from "./entityNames.js";

/** A node in the Genres & Moods taxonomy tree. `parentId === null` marks a root entry. */
export interface GenreMood {
  id: string;
  /** Display name, unique among its siblings. */
  name: string;
  /** Multilingual names for this entry, each labelled by language; the `isPrimary` row mirrors `name`. */
  names?: EntityName[];
  /** URL-friendly identifier derived from the name; unique across all entries. */
  slug: string;
  /** Parent entry id, or `null` for a root-level entry. */
  parentId: string | null;
  /** ISO-8601 timestamp of when the entry was created. */
  createdAt: string;
  /** Distinct bookmarks carrying this entry or any descendant (populated by list endpoints). */
  bookmarkCount?: number;
  /** Distinct bookmarks carrying this entry but none of its descendants (the "No Child" bucket). */
  ownBookmarkCount?: number;
}

/** A Genres & Moods entry with its children populated — used to render the taxonomy tree. */
export interface GenreMoodNode extends GenreMood {
  children: GenreMoodNode[];
}

/** Lightweight shape carried on a bookmark (or other owner) — enough to render and link. */
export type BookmarkGenreMood = Pick<GenreMood, "id" | "name" | "slug" | "parentId">;

/** Payload for creating a Genres & Moods entry. */
export interface CreateGenreMoodInput {
  name: string;
  /** Parent entry id, or `null`/omitted for a root entry. */
  parentId?: string | null;
}

/** Payload for renaming and/or reparenting a Genres & Moods entry. `parentId === null` moves it to root. */
export interface UpdateGenreMoodInput {
  name?: string;
  parentId?: string | null;
}

/**
 * The taxonomy entities (plus `bookmark`) a Genres & Moods entry can be attached to. Single edit
 * point — add a target here and thread it through the assignment routes/UI. Config entities
 * (autofill, card-display-rules, import-rules, saved-filters) are intentionally excluded; they are
 * not classification taxonomies.
 */
export const GENRE_MOOD_OWNER_TYPES = [
  "bookmark",
  "category",
  "tag",
  "website",
  "mediaType",
  "youtubeChannel",
  "person",
  "group",
  "newsletter",
  "location",
  "language",
  "genreMood",
] as const;

/** One of {@link GENRE_MOOD_OWNER_TYPES}. */
export type GenreMoodOwnerType = (typeof GENRE_MOOD_OWNER_TYPES)[number];

/** A single genre/mood ↔ owner attachment row. */
export interface GenreMoodAssignment {
  genreMoodId: string;
  ownerType: GenreMoodOwnerType;
  ownerId: string;
}
