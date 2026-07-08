import type { Bookmark } from "@eesimple/types";

/** The computed (not entity-derivable) inputs the bookmark detail bodies need to decide emptiness. */
export interface BookmarkViewTabData {
  /** Related-bookmark entries (`useRelatedBookmarks`). */
  relatedBookmarkCount: number;
  /** Flattened parent/child hierarchy rows (`buildBookmarkHierarchy` + `flattenTree`). */
  hierarchyCount: number;
  /** Shared media-source match groups (`useBookmarksSharingMediaSource`). */
  mediaSourceCount: number;
  /** Whether any custom-property row renders (`hasBookmarkPropertyRows`). */
  hasPropertyRows: boolean;
}

type BookmarkEmptinessFields = Pick<
  Bookmark,
  "images" | "screenshot" | "reelArchive" | "languageUsages" | "locations"
>;

/**
 * The view tabs the bookmark detail bodies hide because their content is empty — the layout-registry
 * replacement for `buildBookmarkDetailSections`' per-section null-omission. `modeVisibleTabs` already
 * drops structurally/`showIf`-empty tabs; this covers the tabs whose emptiness is **data-derived**:
 * Image (no images/screenshot), Video (no reel), Languages (no usages), Properties (no rows), and the
 * aggregate Related tab (no related bookmarks, hierarchy, shared-source matches, or locations). Pure so
 * the omission rules stay unit-tested independent of the react-query hooks that feed `data`.
 */
export function hiddenBookmarkViewTabKeys(
  bookmark: BookmarkEmptinessFields,
  data: BookmarkViewTabData,
): Set<string> {
  const hidden = new Set<string>();
  if (bookmark.images.length === 0 && bookmark.screenshot === null) hidden.add("image");
  if (bookmark.reelArchive === null) hidden.add("video");
  if (bookmark.languageUsages.length === 0) hidden.add("languages");
  if (!data.hasPropertyRows) hidden.add("properties");
  if (
    data.relatedBookmarkCount === 0
    && data.hierarchyCount === 0
    && data.mediaSourceCount === 0
    && bookmark.locations.length === 0
  ) hidden.add("related");
  return hidden;
}
