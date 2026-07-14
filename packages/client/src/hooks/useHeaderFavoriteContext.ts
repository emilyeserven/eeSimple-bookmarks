import type { FavoriteContext } from "./useFavoriteToggle";

import { useQuery } from "@tanstack/react-query";

import { ENTITY_PALETTE_CONFIGS } from "../lib/entityPaletteRegistry";
import { matchEntityRoute } from "../lib/entityRoutes";
import { FAVORITABLE_KINDS } from "../lib/favoriteEntityConfig";

/**
 * Resolve the favoritable entity behind the current detail page for the header star button, reusing
 * the same route-match + list-cache mechanism as `useEntityCommandContext` (but ungated). Returns
 * `null` on listing/create/non-favoritable pages. The entity's list is almost always already in cache
 * (the sidebar loads it), so this is a cache hit. Mirrors `resolveFavoriteContext`, generalized to
 * every favoritable kind so the star lights up without per-entity header wiring.
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

  if (!match || !config) return null;
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
