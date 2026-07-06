import type { Bookmark } from "@eesimple/types";

import { useBookmarks } from "./useBookmarks";

/** The exact-match media-source identity fields a bookmark can share with others (see #1072). */
export type MediaSourceField = "plexRatingKey" | "kavitaSeriesId" | "isbn" | "feedUrl";

export interface MediaSourceMatchGroup {
  field: MediaSourceField;
  value: string | number;
  bookmarks: Bookmark[];
}

const MEDIA_SOURCE_FIELDS: MediaSourceField[] = ["plexRatingKey", "kavitaSeriesId", "isbn", "feedUrl"];

/**
 * For each Plex/Kavita/ISBN/podcast-feed identity field set on `bookmark`, the other bookmarks
 * (excluding `bookmark` itself) that share the same value. Pure so it's unit-testable independent
 * of the `useBookmarks()` cache read.
 */
export function computeBookmarksSharingMediaSource(
  bookmark: Bookmark,
  allBookmarks: Bookmark[],
): MediaSourceMatchGroup[] {
  const groups: MediaSourceMatchGroup[] = [];
  for (const field of MEDIA_SOURCE_FIELDS) {
    const value = bookmark[field];
    if (value == null) continue;
    const matches = allBookmarks.filter(b => b.id !== bookmark.id && b[field] === value);
    if (matches.length > 0) groups.push({
      field,
      value,
      bookmarks: matches,
    });
  }
  return groups;
}

/**
 * Other bookmarks sharing a Plex/Kavita/ISBN/podcast-feed identity with `bookmark`, grouped by which
 * identity field matched. O(n) over the already-cached bookmark list (a sanctioned client-side
 * derivation — see the "Data shaping" section in CLAUDE.md); `useBookmarks()` is a cache hit on the
 * detail page. Returns `[]` until the list loads and when nothing is shared.
 */
export function useBookmarksSharingMediaSource(bookmark: Bookmark): MediaSourceMatchGroup[] {
  const {
    data: allBookmarks,
  } = useBookmarks();
  return computeBookmarksSharingMediaSource(bookmark, allBookmarks ?? []);
}
