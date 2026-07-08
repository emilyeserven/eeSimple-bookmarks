import type { Website } from "@eesimple/types";

import { sortWebsites } from "../lib/websiteListingSort";
import { useUiStore } from "../stores/uiStore";

/**
 * The Websites listing's sort + facet-filter hooks, consumed by `websiteListingConfig`'s
 * `useSortedItems` / `useExtraFilter` slots. Kept out of `WebsiteListingControls.tsx` so that file
 * stays component-only (fast-refresh). The control component writes the same `uiStore` prefs these read.
 */

/** Re-sorts the filtered website list per the `uiStore.websiteSortMode` pref. */
export function useWebsiteSortedItems(items: Website[]): Website[] {
  const mode = useUiStore(s => s.websiteSortMode);
  return sortWebsites(items, mode);
}

/** Narrows the website list by the four facet prefs in `uiStore` (category / media type / built-in / bookmarks). */
export function useWebsiteFacetFilter(items: Website[]): Website[] {
  const category = useUiStore(s => s.websiteCategoryFilter);
  const mediaType = useUiStore(s => s.websiteMediaTypeFilter);
  const builtIn = useUiStore(s => s.websiteBuiltInFilter);
  const bookmark = useUiStore(s => s.websiteBookmarkFilter);

  return items.filter((w) => {
    if (category && w.category?.id !== category) return false;
    if (mediaType && (w.mediaTypeId ?? null) !== mediaType) return false;
    if (builtIn === "builtin" && !w.builtIn) return false;
    if (builtIn === "custom" && w.builtIn) return false;
    if (bookmark === "has" && (w.bookmarkCount ?? 0) === 0) return false;
    if (bookmark === "empty" && (w.bookmarkCount ?? 0) !== 0) return false;
    return true;
  });
}
