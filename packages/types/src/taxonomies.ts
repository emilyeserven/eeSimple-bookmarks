/**
 * User-configurable **taxonomies** — the generic classification engine. A taxonomy is a
 * user-defined vocabulary (like Tags, but with its own sidebar item + bookmark combobox), configured
 * as hierarchical-or-flat and single-or-multi-value per bookmark. Its {@link TaxonomyTerm}s are a
 * self-referencing tree (like Genres & Moods) and attach to bookmarks **and** any other taxonomy
 * entity through the polymorphic {@link TaxonomyAssignment} layer.
 *
 * This is the generalization of the former bespoke "Genres & Moods" taxonomy: G&M is now seeded as a
 * built-in taxonomy row rather than its own table. Pure module (no side effects) shared by the
 * Fastify API and the browser — mind the `.js` extension on the intra-package re-export.
 */

import type { EntityName } from "./entityNames.js";

/** Slug of the pre-seeded built-in "Genres & Moods" taxonomy (migrated from the old `genre_moods`). */
export const GENRES_MOODS_TAXONOMY_SLUG = "genres-moods";

/**
 * A user-configurable taxonomy definition. `hierarchical` chooses a tree vs a flat vocabulary;
 * `singleValue` chooses one-term-per-bookmark vs many. `builtIn` rows (seeded, e.g. Genres & Moods)
 * can't be renamed/deleted but can be hidden and demoted to Tags.
 */
export interface Taxonomy {
  id: string;
  /** Display name (e.g. "Genres & Moods"). */
  name: string;
  /** URL-friendly identifier; unique across all taxonomies; owns `/taxonomies/<slug>`. */
  slug: string;
  description: string | null;
  /** True = a `parentId` term tree (Hierarchy tab, tree combobox); false = a flat vocabulary. */
  hierarchical: boolean;
  /** True = at most one term per bookmark (single combobox); false = many (multi combobox). */
  singleValue: boolean;
  /** Seeded built-in (non-renamable / non-deletable, but hideable + demotable). */
  builtIn: boolean;
  /** Hidden from pickers/facets/sidebar while staying resolvable (null = false). */
  hidden?: boolean | null;
  /** Serialized `lucide-react` icon name, resolved to a component at render time via `lib/icons`. */
  icon: string | null;
  /** Whether this taxonomy shows as its own sidebar item. */
  showInSidebar: boolean;
  /**
   * When true, this taxonomy's term View/Edit pages use their **own** stored page layout (keyed by
   * {@link taxonomyTermLayoutKind}) instead of the shared generic `taxonomy-term` layout. Null =
   * false = shared layout.
   */
  customLayout?: boolean | null;
  /** Sort order among taxonomies in the sidebar / management list. */
  sortOrder: number;
  createdAt: string;
  /** Distinct top-level term count (populated by list endpoints). */
  termCount?: number;
  /** Distinct bookmarks carrying any term of this taxonomy (populated by list endpoints). */
  bookmarkCount?: number;
}

/** A term within a taxonomy. `parentId === null` marks a root term (always so for a flat taxonomy). */
export interface TaxonomyTerm {
  id: string;
  /** The owning taxonomy. */
  taxonomyId: string;
  /** Display name, unique among its siblings within the taxonomy. */
  name: string;
  /** Multilingual names, each labelled by language; the `isPrimary` row mirrors `name`. */
  names?: EntityName[];
  /** URL-friendly identifier, unique within the taxonomy. */
  slug: string;
  description: string | null;
  /** Parent term id, or `null` for a root term. */
  parentId: string | null;
  createdAt: string;
  /** Distinct bookmarks carrying this term or any descendant (populated by list endpoints). */
  bookmarkCount?: number;
  /** Distinct bookmarks carrying this term but none of its descendants (the "No Child" bucket). */
  ownBookmarkCount?: number;
}

/** A taxonomy term with its children populated — used to render the term tree. */
export interface TaxonomyTermNode extends TaxonomyTerm {
  children: TaxonomyTermNode[];
}

/** Lightweight shape carried on a bookmark (or other owner) — enough to render, link, and bucket by taxonomy. */
export type BookmarkTaxonomyTerm = Pick<TaxonomyTerm, "id" | "name" | "slug" | "parentId" | "taxonomyId">;

/**
 * The taxonomy entities (plus `bookmark`) a taxonomy term can be attached to. Single edit point —
 * add a target here and thread it through the assignment routes/UI. Config entities (autofill,
 * card-display-rules, import-rules, saved-filters) are intentionally excluded. `taxonomy`
 * (self-referring) lets a term be assigned to another taxonomy's term.
 */
export const TAXONOMY_OWNER_TYPES = [
  "bookmark",
  "category",
  "tag",
  "website",
  "mediaType",
  "youtubeChannel",
  "person",
  "group",
  "newsletter",
  "location",
  "language",
  "taxonomy",
] as const;

/** One of {@link TAXONOMY_OWNER_TYPES}. */
export type TaxonomyOwnerType = (typeof TAXONOMY_OWNER_TYPES)[number];

/** A single term ↔ owner attachment row. `taxonomyId` is denormalized for single-value write scoping + facets. */
export interface TaxonomyAssignment {
  taxonomyId: string;
  termId: string;
  ownerType: TaxonomyOwnerType;
  ownerId: string;
}

/** Payload for creating a taxonomy. */
export interface CreateTaxonomyInput {
  name: string;
  slug?: string;
  description?: string | null;
  hierarchical?: boolean;
  singleValue?: boolean;
  icon?: string | null;
  showInSidebar?: boolean;
  customLayout?: boolean | null;
  sortOrder?: number;
}

/** Payload for updating a taxonomy's config. */
export interface UpdateTaxonomyInput {
  name?: string;
  slug?: string;
  description?: string | null;
  hierarchical?: boolean;
  singleValue?: boolean;
  icon?: string | null;
  showInSidebar?: boolean;
  hidden?: boolean | null;
  customLayout?: boolean | null;
  sortOrder?: number;
}

/** Payload for creating a term in a taxonomy. */
export interface CreateTaxonomyTermInput {
  name: string;
  /** Parent term id, or `null`/omitted for a root term. */
  parentId?: string | null;
  description?: string | null;
}

/** Payload for renaming and/or reparenting a term. `parentId === null` moves it to root. */
export interface UpdateTaxonomyTermInput {
  name?: string;
  parentId?: string | null;
  description?: string | null;
}

/** Payload for promoting a tag subtree into its own taxonomy. */
export interface PromoteTagInput {
  /** The tag whose subtree becomes a taxonomy; its child tags become the taxonomy's terms. */
  tagId: string;
}

/** Payload for demoting a taxonomy back into Tags. */
export interface DemoteTaxonomyInput {
  taxonomyId: string;
  /** Optional existing tag to nest the taxonomy's terms under; omitted = a new parent tag from the taxonomy name. */
  parentTagId?: string | null;
}

/**
 * The Page-Layout kind for a taxonomy's term View/Edit pages. A taxonomy that opted into a custom
 * layout ({@link Taxonomy.customLayout}) uses a **runtime string key** `taxonomy:<id>` so it can carry
 * its own stored `entity_layouts` row; everyone else shares the built-in `"taxonomy-term"` default.
 * Both resolve against the same generic term `defaultLayout`. Kept in `@eesimple/types` so the client
 * read seam and the middleware route validation agree on the key shape.
 */
export function taxonomyTermLayoutKind(taxonomy: Pick<Taxonomy, "id" | "customLayout">): string {
  return taxonomy.customLayout ? `taxonomy:${taxonomy.id}` : "taxonomy-term";
}

/** Whether a stored layout kind string targets a specific taxonomy's custom term-page layout. */
export function isTaxonomyLayoutKind(kind: string): boolean {
  return kind.startsWith("taxonomy:");
}
