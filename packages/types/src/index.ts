/**
 * Shared eeSimple Bookmarks domain types.
 *
 * These are consumed by both the Fastify API (`@eesimple/middleware`) and the React client
 * (`@eesimple/client`) so the wire contract stays in one place.
 */

/** A tag node in the hierarchical taxonomy. `parentId === null` marks a root tag. */
export interface Tag {
  id: string;
  /** Display name, unique among its siblings. */
  name: string;
  /** Parent tag id, or `null` for a root-level tag. */
  parentId: string | null;
  /** ISO-8601 timestamp of when the tag was created. */
  createdAt: string;
}

/** A tag with its children populated — used to render the taxonomy tree. */
export interface TagNode extends Tag {
  children: TagNode[];
}

/** Lightweight tag shape carried on a bookmark (enough to render and group). */
export type BookmarkTag = Pick<Tag, "id" | "name" | "parentId">;

/** Payload for creating a tag. */
export interface CreateTagInput {
  name: string;
  /** Parent tag id, or `null`/omitted for a root tag. */
  parentId?: string | null;
}

/** Payload for renaming and/or reparenting a tag. `parentId === null` moves it to root. */
export interface UpdateTagInput {
  name?: string;
  parentId?: string | null;
}

/** A single saved bookmark. */
export interface Bookmark {
  id: string;
  /** The bookmarked URL (http/https). */
  url: string;
  /** Human-friendly title, e.g. "GitHub". */
  title: string;
  /** Optional free-form description. */
  description: string | null;
  /** Tags assigned to this bookmark, drawn from the taxonomy. */
  tags: BookmarkTag[];
  /** Whether the bookmark is marked as a favorite. */
  favorite: boolean;
  /** ISO-8601 timestamp of when the bookmark was created. */
  createdAt: string;
}

/** Payload for creating a bookmark. */
export interface CreateBookmarkInput {
  url: string;
  title: string;
  description?: string | null;
  /** Ids of tags to assign, drawn from the taxonomy. */
  tagIds?: string[];
  favorite?: boolean;
}

/** Payload for partially updating a bookmark. */
export type UpdateBookmarkInput = Partial<CreateBookmarkInput>;

/** Standard error shape returned by the API. */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
