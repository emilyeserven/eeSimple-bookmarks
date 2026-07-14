import type { EntityRouteKind } from "./entityRoutes";

import { autofillApi } from "./api/autofill";
import { importRulesApi } from "./api/importRules";
import { newslettersApi } from "./api/imports";
import { savedFiltersApi } from "./api/settings";
import {
  categoriesApi,
  customPropertiesApi,
  genreMoodsApi,
  groupsApi,
  languagesApi,
  locationsApi,
  mediaTypesApi,
  peopleApi,
  relationshipTypesApi,
  tagsApi,
  websitesApi,
  youtubeChannelsApi,
} from "./api/taxonomies";

/**
 * The slug-routed entity kinds whose members can be starred — everything in `ENTITY_ROUTES` except the
 * three shortcut sub-taxonomies (place types, group types, location relations), which surface as fixed
 * shortcut links in a parent's flyout rather than being favorited themselves.
 */
export const FAVORITABLE_KINDS: ReadonlySet<EntityRouteKind> = new Set<EntityRouteKind>([
  "category",
  "tag",
  "website",
  "media-type",
  "genre-mood",
  "language",
  "location",
  "youtube-channel",
  "newsletter",
  "person",
  "group",
  "relationship-type",
  "custom-property",
  "autofill",
  "import-rule",
  "saved-filter",
]);

/** The minimal per-kind binding the favorite toggle needs: PATCH the flag + refresh the right caches. */
export interface FavoriteEntityConfig {
  update: (id: string, patch: { isFavorite: boolean }) => Promise<unknown>;
  /** Query keys to invalidate after a toggle (refreshes the listing + the sidebar flyout). */
  invalidateKeys: readonly (readonly string[])[];
}

// A dedicated registry (NOT the descriptor-derived `ENTITY_PALETTE_CONFIGS`) so that listing rows —
// which import this via `useFavoriteToggle` — don't create an import cycle back through the entity
// descriptors (which import the very listing rows). Sourced from the API layer only.
const FAVORITE_TERMS_KEY = ["taxonomy-terms", "favorites"] as const;

export const FAVORITE_ENTITY_CONFIGS = {
  "category": {
    update: (id, patch) => categoriesApi.update(id, patch),
    invalidateKeys: [["categories"]],
  },
  "tag": {
    update: (id, patch) => tagsApi.update(id, patch),
    invalidateKeys: [["tags"]],
  },
  "website": {
    update: (id, patch) => websitesApi.update(id, patch),
    invalidateKeys: [["websites"]],
  },
  "media-type": {
    update: (id, patch) => mediaTypesApi.update(id, patch),
    invalidateKeys: [["media-types"]],
  },
  "genre-mood": {
    // A genre/mood favorite is a taxonomy_term flag — refresh the G&M tree AND the shared favorite-terms
    // list the sidebar flyout reads.
    update: (id, patch) => genreMoodsApi.update(id, patch),
    invalidateKeys: [["genre-moods"], FAVORITE_TERMS_KEY],
  },
  "language": {
    update: (id, patch) => languagesApi.update(id, patch),
    invalidateKeys: [["languages"]],
  },
  "location": {
    update: (id, patch) => locationsApi.update(id, patch),
    invalidateKeys: [["locations"]],
  },
  "youtube-channel": {
    update: (id, patch) => youtubeChannelsApi.update(id, patch),
    invalidateKeys: [["youtube-channels"]],
  },
  "newsletter": {
    update: (id, patch) => newslettersApi.update(id, patch),
    invalidateKeys: [["newsletters"]],
  },
  "person": {
    update: (id, patch) => peopleApi.update(id, patch),
    invalidateKeys: [["people"]],
  },
  "group": {
    update: (id, patch) => groupsApi.update(id, patch),
    invalidateKeys: [["groups"]],
  },
  "relationship-type": {
    update: (id, patch) => relationshipTypesApi.update(id, patch),
    invalidateKeys: [["relationship-types"]],
  },
  "custom-property": {
    update: (id, patch) => customPropertiesApi.update(id, patch),
    invalidateKeys: [["custom-properties"]],
  },
  "autofill": {
    update: (id, patch) => autofillApi.update(id, patch),
    invalidateKeys: [["autofill-rules"]],
  },
  "import-rule": {
    update: (id, patch) => importRulesApi.update(id, patch),
    invalidateKeys: [["import-rules"]],
  },
  "saved-filter": {
    update: (id, patch) => savedFiltersApi.update(id, patch),
    invalidateKeys: [["saved-filters"]],
  },
} satisfies Record<string, FavoriteEntityConfig>;

/** Exactly the 16 favoritable kinds — the keys of {@link FAVORITE_ENTITY_CONFIGS}. */
export type FavoritableKind = keyof typeof FAVORITE_ENTITY_CONFIGS;
