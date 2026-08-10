import type { Taxonomy } from "@eesimple/types";

import { GENRES_MOODS_TAXONOMY_SLUG } from "@eesimple/types";

import { useTaxonomies } from "./useTaxonomies";

/**
 * The user-created taxonomies that get their own bookmark **filter facet** and **condition leaf**,
 * in the taxonomy list's own order. The single gate both surfaces share, so a taxonomy can never be
 * filterable but not matchable (or vice versa).
 *
 * A taxonomy qualifies when it is not hidden and has at least one term — a taxonomy with nothing to
 * pick would render an empty picker. **Genres & Moods is excluded**: it is a seeded built-in
 * taxonomy row, but it already has its own dedicated `genre-moods` facet (`BookmarkSearch.genreMoods`)
 * and its own `genre-mood` condition leaf, so including it here would show the same vocabulary
 * twice. This mirrors the carve-out `useTaxonomyDynamicFields` makes for the placeable-field registry.
 *
 * Reads the one shared `useTaxonomies()` query, so every filter/condition surface that calls this
 * shares a single cached fetch.
 */
export function useUserTaxonomies(): Taxonomy[] {
  const {
    data: taxonomies = [],
  } = useTaxonomies();
  return taxonomies.filter(taxonomy =>
    !taxonomy.hidden
    && taxonomy.slug !== GENRES_MOODS_TAXONOMY_SLUG
    && (taxonomy.termCount ?? 0) > 0);
}
