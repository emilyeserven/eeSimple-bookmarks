import type { Website } from "@eesimple/types";

/**
 * How the Websites listing's card view is ordered. Written by the `WebsiteListingControls` Sort
 * dropdown (persisted in `uiStore.websiteSortMode`) and consumed by `sortWebsites` below. Table view
 * keeps its own interactive column sort on top of this initial order.
 */
export type WebsiteSortMode
  = | "name-asc"
    | "name-desc"
    | "count-desc"
    | "count-asc"
    | "created-desc"
    | "created-asc";

/** Built-in vs Custom facet state for the Websites listing (`uiStore.websiteBuiltInFilter`). */
export type WebsiteBuiltInFilter = "all" | "builtin" | "custom";

/** Has-bookmarks facet state for the Websites listing (`uiStore.websiteBookmarkFilter`). */
export type WebsiteBookmarkFilter = "all" | "has" | "empty";

/** ISBN-scanning facet state for the Websites listing (`uiStore.websiteIsbnFilter`): can vs cannot extract ISBNs (the `scanUrlForIsbn` flag). */
export type WebsiteIsbnFilter = "all" | "can" | "cannot";

/** Non-mutating re-sort of `items` by the given mode. Name = siteName; count = bookmarkCount (∅→0). */
export function sortWebsites(items: Website[], mode: WebsiteSortMode): Website[] {
  const copy = [...items];
  switch (mode) {
    case "name-asc":
      return copy.sort((a, b) => a.siteName.localeCompare(b.siteName));
    case "name-desc":
      return copy.sort((a, b) => b.siteName.localeCompare(a.siteName));
    case "count-desc":
      return copy.sort((a, b) => (b.bookmarkCount ?? 0) - (a.bookmarkCount ?? 0));
    case "count-asc":
      return copy.sort((a, b) => (a.bookmarkCount ?? 0) - (b.bookmarkCount ?? 0));
    case "created-desc":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "created-asc":
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}
