/**
 * Shared "Location Relation" types.
 *
 * A {@link LocationRelation} is a user-managed vocabulary describing *how* a bookmark relates to one of
 * its locations — e.g. the bookmark's subject is the **Physical Place** itself, relates to its
 * **Culture and Tradition**, was **Created In** it, or is **Inspired By** it. It qualifies each
 * `(bookmark, location)` edge, not the location row (a bookmark can be "Created In" Tokyo but
 * "Inspired By" Kyoto). Mirrors `place_types` as a Locations-adjacent taxonomy.
 *
 * This module is pure so it runs unchanged in the Fastify API and the browser.
 */

/** A user-managed location-relation vocabulary entry. */
export interface LocationRelation {
  id: string;
  name: string;
  slug: string;
  /** Free-text description surfaced on the relation's detail page. */
  description: string | null;
  /** Seeded built-ins can't be renamed or deleted; users may add custom ones. */
  builtIn: boolean;
  sortOrder: number;
  createdAt: string;
  /** Distinct bookmarks whose location edges reference this relation. Computed server-side. */
  bookmarkCount: number;
}

export interface CreateLocationRelationInput {
  name: string;
  sortOrder?: number;
  description?: string | null;
}

export interface UpdateLocationRelationInput {
  name?: string;
  sortOrder?: number;
  description?: string | null;
}

/** Lightweight relation shape carried on a bookmark's location edge and on a location's derived list. */
export type BookmarkLocationRelation = Pick<LocationRelation, "id" | "name" | "slug">;
