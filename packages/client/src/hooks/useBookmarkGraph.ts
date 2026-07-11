import type { BookmarkGraphModel } from "../lib/bookmarkGraph";
import type { Bookmark } from "@eesimple/types";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_BOOKMARK_GRAPH_SETTINGS } from "@eesimple/types";

import { useBookmarks } from "./useBookmarks";
import { buildBookmarkGraph } from "../lib/bookmarkGraph";
import { toggleInSet } from "../lib/toggleInSet";

import { useBookmarkGraphSettings } from "@/hooks/useAppSettings";

export interface UseBookmarkGraphResult {
  graph: BookmarkGraphModel;
  /** Peer ids the user has expanded (each grows its own related ring). */
  expandedIds: Set<string>;
  /** Flip a peer's expanded state — the model rebuilds to add/remove its related ring. */
  toggleExpand: (id: string) => void;
  /** Whether every layer-1 peer is expanded at once (the "show second layer" toggle). */
  showSecondLayer: boolean;
  /** Flip the show-all-second-layer state. */
  toggleSecondLayer: () => void;
}

/**
 * The relatedness graph around `bookmark` — the same layer-1 node set as `useRelatedBookmarks`, plus
 * commonality edges between every displayed pair and any expanded peer's further ring, scored by the
 * weights configured in Settings → Display → Bookmark Graph. O(n) over the already-cached bookmark
 * list (a sanctioned client-side derivation — see the "Data shaping" section in CLAUDE.md). Owns the
 * `expandedIds` state so the model rebuilds on expand/collapse; resets it when navigating to a
 * different bookmark.
 */
export function useBookmarkGraph(bookmark: Bookmark): UseBookmarkGraphResult {
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: settings,
  } = useBookmarkGraphSettings();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [showSecondLayer, setShowSecondLayer] = useState(false);
  const initializedFor = useRef<string | null>(null);

  // Reset per-bookmark expansion state on navigation.
  useEffect(() => {
    setExpandedIds(new Set());
    initializedFor.current = null;
  }, [bookmark.id]);

  // Seed the show-second-layer toggle from the saved default, once settings are available per bookmark
  // (guarded so a background settings refetch doesn't clobber a manual toggle).
  useEffect(() => {
    if (!settings || initializedFor.current === bookmark.id) return;
    initializedFor.current = bookmark.id;
    setShowSecondLayer(settings.showSecondLayer);
  }, [bookmark.id, settings]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => toggleInSet(prev, id));
  }, []);
  const toggleSecondLayer = useCallback(() => {
    setShowSecondLayer(prev => !prev);
  }, []);

  const graph = useMemo(
    () => buildBookmarkGraph(bookmark, allBookmarks ?? [], settings ?? DEFAULT_BOOKMARK_GRAPH_SETTINGS, {
      expandedIds,
      expandAllLayerOne: showSecondLayer,
    }),
    [bookmark, allBookmarks, settings, expandedIds, showSecondLayer],
  );

  return {
    graph,
    expandedIds,
    toggleExpand,
    showSecondLayer,
    toggleSecondLayer,
  };
}
