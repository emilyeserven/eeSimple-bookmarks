import type { Category } from "@eesimple/types";

import { sortCategories } from "../lib/categorySort";
import { useUiStore } from "../stores/uiStore";

/**
 * The Categories listing's sort hook, consumed by `categoryListingConfig`'s `useSortedItems` slot.
 * Kept out of `CategorySortToggle.tsx` so that file stays component-only (fast-refresh). The control
 * component writes the same `uiStore.categorySortMode` pref this reads. Mirrors `useWebsiteListing.ts`.
 */

/** Re-sorts the filtered category list per the `uiStore.categorySortMode` pref. */
export function useCategorySortedItems(items: Category[]): Category[] {
  const mode = useUiStore(s => s.categorySortMode);
  return sortCategories(items, mode);
}
