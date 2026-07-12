import type { Taxonomy } from "@eesimple/types";

/**
 * A placeholder with an empty `id` so route components can build taxonomy-parametrized configs/
 * workbenches unconditionally (Rules of Hooks) while the real taxonomy resolves from
 * `useTaxonomyBySlug`. Every taxonomy-id-keyed query (`useTaxonomyTermTree` and friends) is gated on
 * `Boolean(taxonomyId)`, so this placeholder's empty id keeps them disabled — no bogus network calls.
 * The parent `$taxonomyKey`/`$termSlug` layouts already show the loading/not-found state, so a leaf
 * route only ever briefly sees this before the real taxonomy resolves from the same cached
 * `useTaxonomies()` list.
 */
export const EMPTY_TAXONOMY: Taxonomy = {
  id: "",
  name: "",
  slug: "",
  description: null,
  hierarchical: true,
  singleValue: false,
  builtIn: false,
  icon: null,
  showInSidebar: false,
  sortOrder: 0,
  createdAt: "",
};
