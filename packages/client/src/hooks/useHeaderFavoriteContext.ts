import type { FavoriteContext } from "./useFavoriteToggle";
import type { Taxonomy, TaxonomyTermNode } from "@eesimple/types";

import { useQuery } from "@tanstack/react-query";

import { taxonomiesApi } from "../lib/api/taxonomies";
import { ENTITY_PALETTE_CONFIGS } from "../lib/entityPaletteRegistry";
import { ENTITY_ROUTES, matchEntityRoute } from "../lib/entityRoutes";
import { FAVORITABLE_KINDS } from "../lib/favoriteEntityConfig";
import { flattenTree } from "../lib/tagTree";

/**
 * `/taxonomies/<segment>` pages that are fixed built-in surfaces, not user-created taxonomy keys —
 * the built-in entity routes are excluded via `ENTITY_ROUTES` prefixes instead.
 */
const FIXED_TAXONOMY_PAGE_SEGMENTS = new Set([
  "language-usage-levels",
  "translation-sources",
]);

/** The resolved custom taxonomy + term behind a `/taxonomies/$taxonomyKey/$termSlug…` page. */
export interface TaxonomyTermPageContext {
  taxonomy: Taxonomy;
  term: TaxonomyTermNode;
}

/**
 * Resolve the user-created taxonomy term behind the current page (`/taxonomies/<key>/<slug>[/…]`
 * where `<key>` is no built-in entity route), or `null` elsewhere. Both queries are gated so nothing
 * fetches on non-term pages (and the keys mirror `useTaxonomies` / `useTaxonomyTermTree`, so a term
 * page is usually a cache hit). Shared by the header star (`useHeaderFavoriteContext`) and the CMD+K
 * "Current Term" group.
 */
export function useTaxonomyTermPageContext(pathname: string): TaxonomyTermPageContext | null {
  const parts = pathname.split("/").filter(Boolean);
  const candidate = parts[0] === "taxonomies"
    && parts.length >= 3
    && !FIXED_TAXONOMY_PAGE_SEGMENTS.has(parts[1])
    && !ENTITY_ROUTES.some(route => route.prefix === `/taxonomies/${parts[1]}`)
    ? {
      taxonomySlug: parts[1],
      termSlug: parts[2],
    }
    : null;

  const {
    data: taxonomies,
  } = useQuery({
    queryKey: ["taxonomies"],
    queryFn: taxonomiesApi.list,
    enabled: candidate !== null,
  });
  const taxonomy = candidate
    ? taxonomies?.find(item => item.slug === candidate.taxonomySlug)
    : undefined;

  const {
    data: termTree,
  } = useQuery({
    queryKey: taxonomy ? ["taxonomies", taxonomy.id, "terms", "tree"] : ["taxonomies", "terms", "none"],
    queryFn: () => taxonomiesApi.termTree((taxonomy as Taxonomy).id),
    enabled: Boolean(taxonomy),
  });

  if (!candidate || !taxonomy || !termTree) return null;
  const term = flattenTree(termTree).find(item => item.node.slug === candidate.termSlug)?.node;
  if (!term) return null;
  return {
    taxonomy,
    term,
  };
}

/**
 * Resolve the favoritable entity behind the current detail page for the header star button, reusing
 * the same route-match + list-cache mechanism as `useEntityCommandContext` (but ungated). Returns
 * `null` on listing/create/non-favoritable pages. The entity's list is almost always already in cache
 * (the sidebar loads it), so this is a cache hit. Mirrors `resolveFavoriteContext`, generalized to
 * every favoritable kind so the star lights up without per-entity header wiring. A custom-taxonomy
 * **term** page (`/taxonomies/<custom>/<term>`) resolves through `useTaxonomyTermPageContext` to the
 * `"taxonomy-term"` favorite config instead.
 */
export function useHeaderFavoriteContext(pathname: string): FavoriteContext | null {
  const match = matchEntityRoute(pathname);
  const config = match && FAVORITABLE_KINDS.has(match.route.kind)
    ? ENTITY_PALETTE_CONFIGS[match.route.kind]
    : null;

  const {
    data: entities,
  } = useQuery({
    queryKey: config ? [...config.queryKey] : ["header-favorite", "none"],
    queryFn: config?.listFn ?? (() => Promise.resolve([])),
    enabled: config !== null,
  });

  // Custom-taxonomy term pages match no entity route — resolve the term (gated internally).
  const termPage = useTaxonomyTermPageContext(pathname);

  if (!match || !config) {
    if (termPage) {
      return {
        kind: "taxonomy-term",
        entityId: termPage.term.id,
        label: termPage.term.name,
        isFavorite: Boolean(termPage.term.isFavorite),
      };
    }
    return null;
  }
  const entity = entities?.find(candidate => candidate.slug === match.slug);
  if (!entity) return null;
  const name = config.getName?.(entity)
    ?? (entity as { name?: string }).name
    ?? match.route.singular;
  return {
    // Safe cast: `config` is non-null only when `match.route.kind ∈ FAVORITABLE_KINDS`.
    kind: match.route.kind as FavoriteContext["kind"],
    entityId: entity.id,
    label: name,
    isFavorite: Boolean((entity as { isFavorite?: boolean }).isFavorite),
  };
}
