/**
 * Stable-sort items so user-starred favorites come first, preserving the original relative order
 * within the favorite and non-favorite partitions. Shared by the category and tag combobox builders
 * (and any other picker) so starred entries surface at the top of their pickers — the same
 * favorites-first ordering the language pickers use. Returns a new array; the input is not mutated.
 * `isFavorite` is optional, so it is coerced with `Boolean()` (an unset flag counts as non-favorite).
 */
export function sortFavoritesFirst<T extends { isFavorite?: boolean }>(items: T[]): T[] {
  return [...items].sort((a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)));
}
