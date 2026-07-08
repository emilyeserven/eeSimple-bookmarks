import type { Category } from "@eesimple/types";

/**
 * How the Categories listing's card view is ordered. Written by the `CategorySortToggle` Sort
 * dropdown (persisted in `uiStore.categorySortMode`) and consumed by `sortCategories` below. Table
 * view keeps its own interactive column sort on top of this initial order. Mirrors
 * `lib/websiteListingSort.ts`.
 */
export type CategorySortMode = "name-asc" | "name-desc" | "count-desc" | "count-asc";

/** Non-mutating re-sort of `items` by the given mode. Name = `name`; count = `bookmarkCount` (∅→0). */
export function sortCategories(items: Category[], mode: CategorySortMode): Category[] {
  const copy = [...items];
  switch (mode) {
    case "name-asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case "count-desc":
      return copy.sort((a, b) => (b.bookmarkCount ?? 0) - (a.bookmarkCount ?? 0) || a.name.localeCompare(b.name));
    case "count-asc":
      return copy.sort((a, b) => (a.bookmarkCount ?? 0) - (b.bookmarkCount ?? 0) || a.name.localeCompare(b.name));
  }
}
