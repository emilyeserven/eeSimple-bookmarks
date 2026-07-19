import type { TagDescendants } from "./conditions.js";
import type { Bookmark } from "./index.js";

import { sectionsCarryAnyTag } from "./sectionTags.js";

/**
 * The entity scope an entity-scoped bookmarks listing (a category/tag/website/… page) applies
 * before the user-visible `BookmarkSearch` facets. Kept separate from the facets so the scope can
 * express relations the facet surface has no equivalent for (groups, locations, taxonomy terms,
 * tagged-sections mode, language + usage level) and so scope ∧ facets keeps today's semantics.
 * Evaluated server-side by `POST /api/bookmarks/search`.
 */
export type BookmarkSearchScope
  /** Exact single-value relations (`import` = a newsletter issue's import group). */
  = | { kind: "category" | "mediaType" | "website" | "youtubeChannel" | "import";
    id: string; }
  /** Multi-value relations, exact-id "any match". */
    | { kind: "person" | "group";
      id: string; }
  /** Multi-value tree relations — the id's whole subtree matches. */
      | { kind: "genreMood" | "location" | "taxonomyTerm";
        id: string; }
  /**
   * Tag subtree membership; `taggedSections` REPLACES membership with "a sections-property
   * entry/child carries the tag (or a descendant)" — the tags listing's section-count badge view.
   */
        | { kind: "tag";
          id: string;
          taggedSections?: boolean; }
  /** Bookmarks carrying this language via any usage association, optionally at one usage level. */
          | { kind: "language";
            languageId: string;
            usageLevelId?: string; };

/** The slice of a hydrated bookmark the scope matcher reads. */
export type ScopeMatchableBookmark = Pick<
  Bookmark,
  | "categoryId"
  | "mediaType"
  | "website"
  | "youtubeChannel"
  | "import"
  | "people"
  | "groups"
  | "genreMoods"
  | "locations"
  | "taxonomyTerms"
  | "tags"
  | "sectionsValues"
  | "languageUsages"
>;

/**
 * Subtree resolvers for the tree-shaped scope kinds. Genres & Moods rows are taxonomy terms, so
 * they resolve through `taxonomyTermDescendants` (mirroring the condition-leaf cascade). A missing
 * resolver degrades to exact-id matching, like `EvaluateOptions`.
 */
export interface BookmarkScopeResolvers {
  tagDescendants?: TagDescendants;
  locationDescendants?: TagDescendants;
  taxonomyTermDescendants?: TagDescendants;
}

/** The id's inclusive subtree via `resolve`, or just the id itself when no resolver is available. */
function subtree(resolve: TagDescendants | undefined, id: string): Set<string> {
  return resolve?.(id) ?? new Set([id]);
}

/** Whether a bookmark falls inside an entity-scoped listing's scope. */
export function bookmarkMatchesScope(
  bookmark: ScopeMatchableBookmark,
  scope: BookmarkSearchScope,
  resolvers: BookmarkScopeResolvers = {},
): boolean {
  switch (scope.kind) {
    case "category":
      return bookmark.categoryId === scope.id;
    case "mediaType":
      return bookmark.mediaType?.id === scope.id;
    case "website":
      return bookmark.website?.id === scope.id;
    case "youtubeChannel":
      return bookmark.youtubeChannel?.id === scope.id;
    case "import":
      return bookmark.import?.id === scope.id;
    case "person":
      return bookmark.people.some(entry => entry.id === scope.id);
    case "group":
      return bookmark.groups.some(entry => entry.id === scope.id);
    case "genreMood": {
      const ids = subtree(resolvers.taxonomyTermDescendants, scope.id);
      return bookmark.genreMoods.some(entry => ids.has(entry.id));
    }
    case "location": {
      const ids = subtree(resolvers.locationDescendants, scope.id);
      return bookmark.locations.some(entry => ids.has(entry.id));
    }
    case "taxonomyTerm": {
      const ids = subtree(resolvers.taxonomyTermDescendants, scope.id);
      return bookmark.taxonomyTerms.some(entry => ids.has(entry.id));
    }
    case "tag": {
      const ids = subtree(resolvers.tagDescendants, scope.id);
      return scope.taggedSections
        ? sectionsCarryAnyTag(bookmark.sectionsValues, ids)
        : bookmark.tags.some(tag => ids.has(tag.id));
    }
    case "language":
      return bookmark.languageUsages.some(usage =>
        usage.language.id === scope.languageId
        && (scope.usageLevelId === undefined || usage.level.id === scope.usageLevelId));
  }
}

const ID_SCOPE_KINDS = [
  "category",
  "mediaType",
  "website",
  "youtubeChannel",
  "import",
  "person",
  "group",
  "genreMood",
  "location",
  "taxonomyTerm",
] as const;

/** Narrow an unknown wire value to a `BookmarkSearchScope`, or `undefined` when absent/malformed. */
export function validateBookmarkSearchScope(raw: unknown): BookmarkSearchScope | undefined {
  if (raw === null || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  const kind = value.kind;
  if ((ID_SCOPE_KINDS as readonly string[]).includes(kind as string)) {
    if (typeof value.id !== "string" || value.id === "") return undefined;
    return {
      kind: kind as typeof ID_SCOPE_KINDS[number],
      id: value.id,
    };
  }
  if (kind === "tag") {
    if (typeof value.id !== "string" || value.id === "") return undefined;
    return {
      kind: "tag",
      id: value.id,
      taggedSections: value.taggedSections === true ? true : undefined,
    };
  }
  if (kind === "language") {
    if (typeof value.languageId !== "string" || value.languageId === "") return undefined;
    return {
      kind: "language",
      languageId: value.languageId,
      usageLevelId: typeof value.usageLevelId === "string" && value.usageLevelId !== ""
        ? value.usageLevelId
        : undefined,
    };
  }
  return undefined;
}
