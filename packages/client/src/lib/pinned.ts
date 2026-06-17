import type { Bookmark } from "@eesimple/types";

/**
 * Select the pinned bookmarks and order them for the homepage:
 * higher `priority` first, ties broken by most-recently created.
 */
export function sortPinnedBookmarks(bookmarks: Bookmark[]): Bookmark[] {
  return bookmarks
    .filter(bookmark => bookmark.pinned)
    .sort((a, b) =>
      b.priority - a.priority
      || (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}
