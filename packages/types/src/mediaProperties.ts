/**
 * A Media Property — a franchise / IP grouping (e.g. "The Lord of the Rings"). A Book may belong to
 * one media property. Flat, user-managed taxonomy.
 */
export interface MediaProperty {
  id: string;
  /** Display name. Unique. */
  name: string;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** ISO-8601 timestamp of when the media property was created. */
  createdAt: string;
  /** Number of books that belong to this media property (populated by list endpoints). */
  bookCount?: number;
}

/** Payload for creating a media property. */
export interface CreateMediaPropertyInput {
  name: string;
  sortOrder?: number;
}

/** Payload for updating a media property (rename and/or reorder). */
export interface UpdateMediaPropertyInput {
  name?: string;
  sortOrder?: number;
}
