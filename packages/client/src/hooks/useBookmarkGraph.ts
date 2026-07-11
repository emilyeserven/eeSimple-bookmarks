import type { BookmarkGraphModel } from "../lib/bookmarkGraph";
import type { Bookmark } from "@eesimple/types";

import { useMemo } from "react";

import { DEFAULT_BOOKMARK_GRAPH_SETTINGS } from "@eesimple/types";

import { useBookmarks } from "./useBookmarks";
import { buildBookmarkGraph } from "../lib/bookmarkGraph";

import { useBookmarkGraphSettings } from "@/hooks/useAppSettings";

/**
 * The one-layer relatedness graph around `bookmark` — the same node set as `useRelatedBookmarks`,
 * plus commonality edges between every displayed pair, scored by the weights configured in
 * Settings → Display → Bookmark Graph. O(n) over the already-cached bookmark list (a sanctioned
 * client-side derivation — see the "Data shaping" section in CLAUDE.md). Memoized because the graph
 * renderer's force-layout `useMemo` keys off the model's identity.
 */
export function useBookmarkGraph(bookmark: Bookmark): BookmarkGraphModel {
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: settings,
  } = useBookmarkGraphSettings();
  return useMemo(
    () => buildBookmarkGraph(bookmark, allBookmarks ?? [], settings ?? DEFAULT_BOOKMARK_GRAPH_SETTINGS),
    [bookmark, allBookmarks, settings],
  );
}
