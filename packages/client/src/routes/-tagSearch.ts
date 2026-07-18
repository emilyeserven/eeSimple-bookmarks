import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark } from "@eesimple/types";

import { sectionsCarryAnyTag } from "@eesimple/types";

import { validateBookmarkSearch } from "../lib/bookmarkSearch";

/** The tag page's search: the shared bookmark filters plus the optional sections-mode flag. */
export interface TagBookmarkSearch extends BookmarkSearch {
  /**
   * When on, the listing shows bookmarks whose sections-property entries carry this tag (or a
   * descendant) instead of bookmarks tagged directly — the view the tags listing's subtle
   * section-count badge links to.
   */
  taggedSections?: boolean;
}

export function validateTagSearch(search: Record<string, unknown>): TagBookmarkSearch {
  const taggedSections
    = search.taggedSections === true || search.taggedSections === "true" || search.taggedSections === "1"
      ? true
      : undefined;
  return {
    ...validateBookmarkSearch(search),
    taggedSections,
  };
}

/**
 * The tag page's scope filter. Default mode = bookmarks tagged with the tag or a descendant;
 * `taggedSections` mode REPLACES that with "a sections-property entry/child carries the tag" — so
 * the set matches the tags listing's section-count badge, and a bookmark whose chapter is about the
 * tag shows even when the bookmark itself isn't tagged.
 */
export function filterTagBookmarks(
  bookmarks: Bookmark[],
  tagIds: ReadonlySet<string>,
  taggedSections: boolean | undefined,
): Bookmark[] {
  return taggedSections
    ? bookmarks.filter(b => sectionsCarryAnyTag(b.sectionsValues, tagIds))
    : bookmarks.filter(b => b.tags.some(t => tagIds.has(t.id)));
}
