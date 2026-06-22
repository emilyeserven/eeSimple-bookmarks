import { useUiStore } from "@/stores/uiStore";

export interface HeaderSearchFilter<T> {
  /** The raw (untrimmed) header search query, for display in "no match" messages. */
  rawQuery: string;
  /** Whether a non-empty (trimmed) query is active. */
  hasQuery: boolean;
  /** The items matching the query — all items when no query is active. */
  filtered: T[];
}

/**
 * Filter a list against the global header search query, using a per-entity match predicate. The
 * predicate receives the already-trimmed/lowercased query so each listing only spells out which of
 * its fields to match. Shared by the taxonomy listing pages (Categories / Websites / YouTube Channels
 * / …) so they don't each re-derive the same query/filter wiring.
 */
export function useHeaderSearchFilter<T>(
  items: T[],
  matches: (item: T, query: string) => boolean,
): HeaderSearchFilter<T> {
  const rawQuery = useUiStore(state => state.headerSearchQuery);
  const q = rawQuery.trim().toLowerCase();
  const filtered = q ? items.filter(item => matches(item, q)) : items;
  return {
    rawQuery,
    hasQuery: q.length > 0,
    filtered,
  };
}
