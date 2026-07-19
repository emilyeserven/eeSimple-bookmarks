import type { BookmarkSearch } from "../lib/bookmarkSearch";

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
