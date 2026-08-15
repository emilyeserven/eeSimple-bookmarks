/**
 * Pure target-selection helpers shared by every "pick a set of bookmarks for an AI prompt" page
 * (AI Bulk Edit, AI Prompt Builder): resolve which bookmarks are targeted from individual picks,
 * whole taxonomy groups (tree taxonomies matching their subtrees) and saved filters.
 * No hooks, no I/O — everything is unit-tested directly.
 *
 * Every selected item — one bookmark, one category, one tag, one saved filter — is its own
 * criterion, and {@link AiBookmarkTargetMatchMode} decides how the criteria combine: `"any"` unions
 * them (the original behavior), `"all"` intersects them. Because criteria are per ITEM and not per
 * picker, selecting two tags in `"all"` mode means "carries both tags", not "carries either".
 *
 * Saved filters are evaluated with the SHARED `bookmarkMatchesSearch` predicate from
 * `@eesimple/types` — the same implementation the listing search runs server-side — so a filter
 * targets exactly the bookmarks its own page lists.
 */

import type { Bookmark, BookmarkSearch, SavedFilter } from "@eesimple/types";

import { bookmarkMatchesSearch, validateBookmarkSearch } from "@eesimple/types";

import { subtreeIds } from "./tagTree";

/** The target selection: individual bookmark ids, whole-taxonomy-group ids, and saved filters. */
export interface AiBookmarkTargetSelection {
  bookmarkIds: string[];
  categoryIds: string[];
  /** Selected tags match their whole subtree (a parent tag targets its sub-tags' bookmarks too). */
  tagIds: string[];
  /** Selected media types match their whole subtree. */
  mediaTypeIds: string[];
  websiteIds: string[];
  youtubeChannelIds: string[];
  personIds: string[];
  groupIds: string[];
  /** Selected genres/moods match their whole subtree. */
  genreMoodIds: string[];
  /** Saved filters whose stored `BookmarkSearch` is evaluated against each bookmark. */
  savedFilterIds: string[];
}

export const EMPTY_AI_BOOKMARK_TARGET_SELECTION: AiBookmarkTargetSelection = {
  bookmarkIds: [],
  categoryIds: [],
  tagIds: [],
  mediaTypeIds: [],
  websiteIds: [],
  youtubeChannelIds: [],
  personIds: [],
  groupIds: [],
  genreMoodIds: [],
  savedFilterIds: [],
};

/** Above this many targeted bookmarks a page shows a non-blocking size warning (UI-only). */
export const AI_TARGET_SOFT_WARNING_THRESHOLD = 25;

/**
 * How the selected items combine: `"any"` targets a bookmark matching AT LEAST ONE selected item
 * (the default, and the historical behavior); `"all"` targets only bookmarks matching EVERY
 * selected item.
 */
export const AI_TARGET_MATCH_MODES = ["any", "all"] as const;

export type AiBookmarkTargetMatchMode = typeof AI_TARGET_MATCH_MODES[number];

export const DEFAULT_AI_TARGET_MATCH_MODE: AiBookmarkTargetMatchMode = "any";

/** A minimal parent/children tree node, satisfied by TagNode / MediaTypeNode / GenreMoodNode. */
interface SubtreeNode {
  id: string;
  children: SubtreeNode[];
}

/** The trees used to expand tree-taxonomy selections to their subtrees (absent = exact-id match). */
export interface AiBookmarkTargetTrees {
  tagTree?: SubtreeNode[];
  mediaTypeTree?: SubtreeNode[];
  genreMoodTree?: SubtreeNode[];
}

/**
 * Expand selected tree-taxonomy ids to include every descendant. A missing tree (still loading)
 * falls back to the exact ids; a selected id absent from the tree (stale) is kept as-is.
 */
function expandTreeSelection(selected: string[], tree: SubtreeNode[] | undefined): Set<string> {
  const result = new Set(selected);
  if (!tree || selected.length === 0) return result;
  const want = new Set(selected);
  const visit = (node: SubtreeNode): void => {
    if (want.has(node.id)) {
      for (const id of subtreeIds(node)) result.add(id);
    }
    node.children.forEach(visit);
  };
  tree.forEach(visit);
  return result;
}

/**
 * The selected saved filters' searches, narrowed once up-front so the per-bookmark pass stays a
 * cheap `.some()`. A selected id matching no loaded filter (stale) simply contributes nothing.
 */
function resolveSelectedSearches(
  selectedIds: string[],
  savedFilters: SavedFilter[],
): BookmarkSearch[] {
  if (selectedIds.length === 0) return [];
  const wanted = new Set(selectedIds);
  return savedFilters
    .filter(filter => wanted.has(filter.id))
    .map(filter => validateBookmarkSearch(filter.filters));
}

/** Whether one bookmark satisfies one selected item. */
type BookmarkPredicate = (bookmark: Bookmark) => boolean;

/** The ids a bookmark carries for one selectable relation (empty when it carries none). */
type BookmarkIdReader = (bookmark: Bookmark) => string[];

/**
 * One predicate PER selected id, so `"all"` mode can require each of them independently. A tree
 * taxonomy expands each id to its own subtree; without a tree (or for a flat taxonomy) the
 * predicate is an exact-id match.
 */
function itemPredicates(
  selected: string[],
  read: BookmarkIdReader,
  tree?: SubtreeNode[],
): BookmarkPredicate[] {
  return selected.map((id) => {
    const ids = expandTreeSelection([id], tree);
    return bookmark => read(bookmark).some(candidate => ids.has(candidate));
  });
}

/** The single-id list for a nullable relation, so it reads like the multi-valued ones. */
function optionalId(entity: { id: string } | null): string[] {
  return entity === null ? [] : [entity.id];
}

/** One predicate per selected item across every picker, in picker order. */
function buildTargetPredicates(
  selection: AiBookmarkTargetSelection,
  trees: AiBookmarkTargetTrees,
  savedFilters: SavedFilter[],
): BookmarkPredicate[] {
  const searches = resolveSelectedSearches(selection.savedFilterIds, savedFilters);
  return [
    ...itemPredicates(selection.bookmarkIds, bookmark => [bookmark.id]),
    ...itemPredicates(selection.categoryIds, bookmark => [bookmark.categoryId]),
    ...itemPredicates(selection.tagIds, bookmark => bookmark.tags.map(tag => tag.id), trees.tagTree),
    ...itemPredicates(selection.mediaTypeIds, bookmark => optionalId(bookmark.mediaType), trees.mediaTypeTree),
    ...itemPredicates(selection.websiteIds, bookmark => optionalId(bookmark.website)),
    ...itemPredicates(selection.youtubeChannelIds, bookmark => optionalId(bookmark.youtubeChannel)),
    ...itemPredicates(selection.personIds, bookmark => bookmark.people.map(person => person.id)),
    ...itemPredicates(selection.groupIds, bookmark => bookmark.groups.map(group => group.id)),
    ...itemPredicates(
      selection.genreMoodIds,
      bookmark => bookmark.genreMoods.map(genreMood => genreMood.id),
      trees.genreMoodTree,
    ),
    ...searches.map((search): BookmarkPredicate => bookmark => bookmarkMatchesSearch(bookmark, search)),
  ];
}

/**
 * The targeted bookmarks, deduped for free by the single pass and in the input list's stable order.
 * `mode: "any"` (the default) targets a bookmark matching AT LEAST ONE selected item — an
 * individual pick, a group, or a saved filter; `mode: "all"` targets only bookmarks matching EVERY
 * selected item. An empty selection matches nothing in BOTH modes (an empty `every()` would
 * otherwise target the whole library).
 */
export function resolveBookmarkTargets(
  bookmarks: Bookmark[],
  selection: AiBookmarkTargetSelection,
  trees: AiBookmarkTargetTrees = {},
  savedFilters: SavedFilter[] = [],
  mode: AiBookmarkTargetMatchMode = DEFAULT_AI_TARGET_MATCH_MODE,
): Bookmark[] {
  const predicates = buildTargetPredicates(selection, trees, savedFilters);
  if (predicates.length === 0) return [];
  return mode === "all"
    ? bookmarks.filter(bookmark => predicates.every(matches => matches(bookmark)))
    : bookmarks.filter(bookmark => predicates.some(matches => matches(bookmark)));
}
