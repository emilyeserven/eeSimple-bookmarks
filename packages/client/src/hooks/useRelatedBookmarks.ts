import type { Bookmark } from "@eesimple/types";

import { DEFAULT_BOOKMARK_GRAPH_SETTINGS } from "@eesimple/types";

import { useBookmarks } from "./useBookmarks";
import { computeRelatedBookmarks } from "../lib/relatedBookmarks";

import { useBookmarkGraphSettings } from "@/hooks/useAppSettings";

/**
 * The bookmarks most related to `bookmark`, scored by the weights configured in Settings → Display →
 * Bookmark Graph. O(n) over the already-cached bookmark list (a sanctioned client-side derivation —
 * see the "Data shaping" section in CLAUDE.md); `useBookmarks()` is a cache hit on the detail page.
 * Returns `[]` until the list/settings load and when nothing is related.
 */
export function useRelatedBookmarks(bookmark: Bookmark): Bookmark[] {
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: settings,
  } = useBookmarkGraphSettings();
  return computeRelatedBookmarks(
    bookmark,
    allBookmarks ?? [],
    settings ?? DEFAULT_BOOKMARK_GRAPH_SETTINGS,
  );
}
