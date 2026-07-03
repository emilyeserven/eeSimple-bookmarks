/**
 * A Book in the "Books" taxonomy. Bookmarks link to a Book (via `bookmark.bookId`) rather than a live
 * Kavita series; the Book carries the Kavita linkage so cover/ToC/deep-link features resolve the
 * series id from it. A Book may optionally belong to a Media Property (franchise/IP grouping).
 */
export interface Book {
  id: string;
  /** Display name. Unique. */
  name: string;
  /** URL-friendly identifier derived from the name. Unique. */
  slug: string;
  /** Display ordering weight; lower sorts first. */
  sortOrder: number;
  /** Optional franchise/IP grouping this book belongs to. */
  mediaPropertyId: string | null;
  /** Kavita series id (Settings → Connectors) this book maps to, or null if not linked. */
  kavitaSeriesId: number | null;
  /** Kavita library id, kept alongside the series id to build the web-UI deep link. */
  kavitaLibraryId: number | null;
  /** Denormalized Kavita series name for display without a Kavita round-trip. */
  kavitaSeriesName: string | null;
  /** Optional release year surfaced by the Kavita search. */
  releaseYear: number | null;
  /** ISO-8601 timestamp of when the book was created. */
  createdAt: string;
  /** Number of bookmarks linked to this book (populated by list endpoints). */
  bookmarkCount?: number;
}

/** Payload for creating a book. */
export interface CreateBookInput {
  name: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  kavitaSeriesId?: number | null;
  kavitaLibraryId?: number | null;
  kavitaSeriesName?: string | null;
  releaseYear?: number | null;
}

/** Payload for updating a book (rename, reorder, re-link Kavita/media property). */
export interface UpdateBookInput {
  name?: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  kavitaSeriesId?: number | null;
  kavitaLibraryId?: number | null;
  kavitaSeriesName?: string | null;
  releaseYear?: number | null;
}
