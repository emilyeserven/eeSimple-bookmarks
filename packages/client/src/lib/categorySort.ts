import type { TitleSortContext } from "./bookmarkSort";
import type { Category } from "@eesimple/types";

import { resolveNameSortKey } from "@eesimple/types";

/**
 * How the Categories listing is ordered: by name (A–Z / Z–A) or by bookmark count (most / fewest).
 * `"name-asc"` is the default and mirrors the server's `asc(name)` order for English-only names.
 */
export type CategorySortMode = "name-asc" | "name-desc" | "count-desc" | "count-asc";

/** A category's tie-break key: its preferred-language name, else primary, else `name`. */
function categorySortKey(category: Category, ctx: TitleSortContext): string {
  return resolveNameSortKey(
    category.names ?? [],
    category.name,
    {
      preferredLanguage: ctx.preferredLanguage,
      fallbackLanguage: ctx.fallbackLanguage,
    },
  );
}

/**
 * Sort a flat list of categories by the chosen mode. Name modes compare the multilingual name key
 * (locale-aware via `ctx`); count modes compare `bookmarkCount` (missing = 0) with the name key as
 * tie-break so equal counts stay alphabetical. Pure — returns a new array, never mutates the input.
 */
export function sortCategories(
  items: Category[],
  mode: CategorySortMode,
  ctx: TitleSortContext = {},
): Category[] {
  const byName = (a: Category, b: Category): number =>
    categorySortKey(a, ctx).localeCompare(categorySortKey(b, ctx), ctx.locale);
  const sorted = [...items];
  switch (mode) {
    case "name-asc":
      return sorted.sort(byName);
    case "name-desc":
      return sorted.sort((a, b) => byName(b, a));
    case "count-desc":
      return sorted.sort((a, b) => (b.bookmarkCount ?? 0) - (a.bookmarkCount ?? 0) || byName(a, b));
    case "count-asc":
      return sorted.sort((a, b) => (a.bookmarkCount ?? 0) - (b.bookmarkCount ?? 0) || byName(a, b));
  }
}
