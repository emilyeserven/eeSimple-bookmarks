/**
 * Coarse "what kind of content is this" classification for the Add Bookmark form, derived purely from
 * signals the URL scan (`GET /api/scan`) already computes — no extra fetching. Surfaced as a
 * "Detected content type" badge on the create form and used to pre-select a matching built-in Media
 * Type when that field is still empty.
 *
 * Pure and dependency-free so it runs identically in the Fastify middleware (where the scan builds it)
 * and the browser (where the form labels it).
 */

/**
 * The content kinds the scan can distinguish from data it already has. Ordered by detection priority
 * in {@link detectContentKind}. `web-link` is the generic fallback for a normal page.
 */
export const BOOKMARK_CONTENT_KINDS = [
  "youtube-video",
  "book",
  "social-account",
  "web-link",
] as const;

/** A detected content kind. Derived from {@link BOOKMARK_CONTENT_KINDS}. */
export type BookmarkContentKind = typeof BOOKMARK_CONTENT_KINDS[number];

/** The signals the classifier reads — a subset of what the scan already resolves. */
export interface ContentKindSignals {
  /** Whether the URL was recognized as a YouTube video. */
  isYouTube: boolean;
  /** A checksum-valid ISBN extracted from the URL (e.g. an Amazon ASIN), or `null`. */
  isbn: string | null;
  /** Whether the URL points at a social-media account/profile. */
  hasSocialAccount: boolean;
}

/**
 * Classify a scanned URL into a coarse content kind from the signals the scan already produced.
 * Returns `null` when nothing more specific than a generic web link is detected (so callers can hide
 * the badge rather than show an uninformative "Web link").
 */
export function detectContentKind(signals: ContentKindSignals): BookmarkContentKind | null {
  if (signals.isYouTube) return "youtube-video";
  if (signals.isbn) return "book";
  if (signals.hasSocialAccount) return "social-account";
  return null;
}

/**
 * The exact name of the built-in Media Type a content kind maps to (matching the seeds in the
 * middleware's `BUILT_IN_MEDIA_TYPES`), or `null` when there is no natural media type to pre-select.
 * The client resolves the name to an id against its loaded media-type list, mirroring how the ISBN
 * flow resolves "Book".
 */
export function contentKindToMediaTypeName(kind: BookmarkContentKind): string | null {
  switch (kind) {
    case "youtube-video":
      return "Video";
    case "book":
      return "Book";
    case "social-account":
      return "Social Media Post";
    case "web-link":
      return null;
  }
}
