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
  /** Number-typed custom property values assigned to this bookmark. */
  numberValues: BookmarkNumberValue[];
  /** Tiered-tags custom property selections assigned to this bookmark. */
  propertyTags: BookmarkPropertyTag[];
  /** Whether the bookmark is marked as a favorite. */
  favorite: boolean;
  /** Whether the bookmark is pinned to the homepage. */
  pinned: boolean;
  /** Homepage ordering weight; higher values appear first. */
  priority: number;
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
  /** Number custom property values to assign. */
  numberValues?: BookmarkNumberValue[];
  /** Ids of tiered-tags custom property tags to assign. */
  propertyTagIds?: string[];
  favorite?: boolean;
  /** Pin this bookmark to the homepage. */
  pinned?: boolean;
  /** Homepage ordering weight; higher values appear first. */
  priority?: number;
}

/** Payload for partially updating a bookmark. */
export type UpdateBookmarkInput = Partial<CreateBookmarkInput>;

/**
 * The kind of a user-defined custom property:
 * - `tiered_tags` — a hierarchical tag set, independent per property.
 * - `number` — a single numeric value per bookmark, filtered via a range slider.
 */
export type CustomPropertyType = "tiered_tags" | "number";

/** A user-defined custom property that becomes a dynamic bookmark filter. */
export interface CustomProperty {
  id: string;
  name: string;
  type: CustomPropertyType;
  /** Lower bound of a `number` property's range slider (`null` = derive from data). */
  numberMin: number | null;
  /** Upper bound of a `number` property's range slider (`null` = derive from data). */
  numberMax: number | null;
  /** Ids of the categories this property is assigned to (zero, one, or many). */
  categoryIds: string[];
  createdAt: string;
}

/** Payload for creating a custom property. */
export interface CreateCustomPropertyInput {
  name: string;
  type: CustomPropertyType;
  numberMin?: number | null;
  numberMax?: number | null;
  /** Ids of categories to assign this property to. Omit to leave unassigned. */
  categoryIds?: string[];
}

/** Payload for updating a custom property. Its `type` is immutable. */
export type UpdateCustomPropertyInput = Partial<Omit<CreateCustomPropertyInput, "type">>;

/** A tag within a tiered-tags custom property's own hierarchy. */
export interface CustomPropertyTag {
  id: string;
  /** Owning custom property id. */
  propertyId: string;
  name: string;
  /** Parent tag id, or `null` for a root-level tag within this property. */
  parentId: string | null;
  createdAt: string;
}

/** A property tag with its children populated — used to render the tier tree. */
export interface CustomPropertyTagNode extends CustomPropertyTag {
  children: CustomPropertyTagNode[];
}

/** Payload for creating a tag within a tiered-tags custom property. */
export interface CreateCustomPropertyTagInput {
  name: string;
  parentId?: string | null;
}

/** Payload for renaming and/or reparenting a custom property tag. */
export interface UpdateCustomPropertyTagInput {
  name?: string;
  parentId?: string | null;
}

/** A number custom property value carried on a bookmark. */
export interface BookmarkNumberValue {
  propertyId: string;
  value: number;
}

/** A tiered-tags custom property selection carried on a bookmark. */
export interface BookmarkPropertyTag {
  propertyId: string;
  id: string;
  name: string;
  parentId: string | null;
}

/**
 * A category groups custom properties. Properties may belong to zero, one, or many
 * categories, and each category carries an optional Lucide icon shown in the sidebar.
 */
export interface Category {
  id: string;
  name: string;
  /** Optional free-form description. */
  description: string | null;
  /** Name of a Lucide icon (e.g. `"Star"`), or `null` for the default icon. */
  icon: string | null;
  createdAt: string;
}

/** Payload for creating a category. */
export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  icon?: string | null;
}

/** Payload for partially updating a category. */
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

/** Standard error shape returned by the API. */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
