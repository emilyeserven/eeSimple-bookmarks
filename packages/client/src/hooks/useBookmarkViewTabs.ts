import type { RenderTab } from "../lib/workbenchLayout";
import type { Bookmark, EntityLayout } from "@eesimple/types";

import { useBookmarks } from "./useBookmarks";
import { useBookmarksSharingMediaSource } from "./useBookmarksSharingMediaSource";
import { useCustomProperties } from "./useCustomProperties";
import { useResolvedWorkbenchLayout } from "./useEntityLayout";
import { useRelatedBookmarks } from "./useRelatedBookmarks";
import { bookmarkWorkbench } from "../components/workbench/bookmark";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";
import { buildBookmarkHierarchy } from "../lib/bookmarkHierarchy";
import { hasBookmarkPropertyRows } from "../lib/bookmarkProperties";
import { hiddenBookmarkViewTabKeys } from "../lib/bookmarkViewTabs";
import { flattenTree } from "../lib/tagTree";
import { modeVisibleTabs } from "../lib/workbenchLayout";

/**
 * The view-visible bookmark detail tabs, in layout order, with the **computed-empty** tabs dropped —
 * the registry replacement for `buildBookmarkDetailSections`' null-filtering. `modeVisibleTabs` handles
 * structural + `showIf` visibility; this hook additionally hides a tab whose data (loaded here, exactly
 * as the old detail bodies did) is empty, so an empty Image / Video / Languages / Properties / Related
 * tab never appears — matching the old behavior. Both `BookmarkDetailBody` (single column) and
 * `BookmarkDetailTabbed` consume this so they stay in sync.
 */
export function useBookmarkViewTabs(bookmark: Bookmark): {
  layout: EntityLayout | null;
  tabs: RenderTab[];
} {
  const layout = useResolvedWorkbenchLayout(bookmarkWorkbench);
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: properties,
  } = useCustomProperties();
  const defaultFieldZones = useDefaultFieldZones();
  const relatedBookmarks = useRelatedBookmarks(bookmark);
  const mediaSourceMatches = useBookmarksSharingMediaSource(bookmark);

  if (!layout || !bookmarkWorkbench.fields) {
    return {
      layout: null,
      tabs: [],
    };
  }

  const flatHierarchy = flattenTree(buildBookmarkHierarchy(bookmark.id, allBookmarks ?? []));

  const hidden = hiddenBookmarkViewTabKeys(bookmark, {
    relatedBookmarkCount: relatedBookmarks.length,
    hierarchyCount: flatHierarchy.length,
    mediaSourceCount: mediaSourceMatches.length,
    hasPropertyRows: hasBookmarkPropertyRows(bookmark, properties ?? [], defaultFieldZones),
  });

  const tabs = modeVisibleTabs(layout, bookmarkWorkbench.fields, "view", bookmark)
    .filter(tab => !hidden.has(tab.key));
  return {
    layout,
    tabs,
  };
}
