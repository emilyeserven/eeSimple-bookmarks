import type { EntityWorkbench } from "../components/workbench/types";
import type { RenderTab, SectionMatches } from "../lib/workbenchLayout";
import type { Bookmark, EntityLayout } from "@eesimple/types";

import { useBookmarks } from "./useBookmarks";
import { useBookmarkSectionVisibility } from "./useBookmarkSectionVisibility";
import { useBookmarksSharingMediaSource } from "./useBookmarksSharingMediaSource";
import { useCustomProperties } from "./useCustomProperties";
import { useLayoutDrivenWorkbench, useResolvedWorkbenchLayout } from "./useEntityLayout";
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
  /** The dynamic-field-merged workbench the detail bodies must render with (so per-property fields show). */
  workbench: EntityWorkbench<Bookmark>;
  /** The per-section condition gate, shared with the detail bodies' `LayoutDrivenTabBody`. */
  sectionMatches: SectionMatches;
} {
  const workbench = useLayoutDrivenWorkbench(bookmarkWorkbench);
  const layout = useResolvedWorkbenchLayout(workbench);
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: properties,
  } = useCustomProperties();
  const defaultFieldZones = useDefaultFieldZones();
  const relatedBookmarks = useRelatedBookmarks(bookmark);
  const mediaSourceMatches = useBookmarksSharingMediaSource(bookmark);
  const sectionMatches = useBookmarkSectionVisibility(bookmark);

  if (!layout || !workbench.fields) {
    return {
      layout: null,
      tabs: [],
      workbench,
      sectionMatches,
    };
  }

  const flatHierarchy = flattenTree(buildBookmarkHierarchy(bookmark.id, allBookmarks ?? []));

  const hidden = hiddenBookmarkViewTabKeys(bookmark, {
    relatedBookmarkCount: relatedBookmarks.length,
    hierarchyCount: flatHierarchy.length,
    mediaSourceCount: mediaSourceMatches.length,
    hasPropertyRows: hasBookmarkPropertyRows(bookmark, properties ?? [], defaultFieldZones),
  });

  const tabs = modeVisibleTabs(layout, workbench.fields, "view", bookmark, sectionMatches)
    .filter(tab => !hidden.has(tab.key));
  return {
    layout,
    tabs,
    workbench,
    sectionMatches,
  };
}
