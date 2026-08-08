/**
 * Pure target-selection helpers shared by every "pick a set of bookmarks for an AI prompt" page
 * (AI Bulk Edit, AI Prompt Builder): resolve which bookmarks are targeted from individual picks
 * unioned with whole taxonomy groups (tree taxonomies matching their subtrees) and saved filters.
 * No hooks, no I/O — everything is unit-tested directly.
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

/**
 * The targeted bookmarks: individually selected OR matching ANY selected group/saved filter (union),
 * deduped for free by the single pass, in the input list's stable order. Empty selections match
 * nothing.
 */
export function resolveBookmarkTargets(
  bookmarks: Bookmark[],
  selection: AiBookmarkTargetSelection,
  trees: AiBookmarkTargetTrees = {},
  savedFilters: SavedFilter[] = [],
): Bookmark[] {
  const individual = new Set(selection.bookmarkIds);
  const categoryIds = new Set(selection.categoryIds);
  const tagIds = expandTreeSelection(selection.tagIds, trees.tagTree);
  const mediaTypeIds = expandTreeSelection(selection.mediaTypeIds, trees.mediaTypeTree);
  const genreMoodIds = expandTreeSelection(selection.genreMoodIds, trees.genreMoodTree);
  const websiteIds = new Set(selection.websiteIds);
  const youtubeChannelIds = new Set(selection.youtubeChannelIds);
  const personIds = new Set(selection.personIds);
  const groupIds = new Set(selection.groupIds);
  const searches = resolveSelectedSearches(selection.savedFilterIds, savedFilters);
  return bookmarks.filter(bookmark =>
    individual.has(bookmark.id)
    || categoryIds.has(bookmark.categoryId)
    || bookmark.tags.some(tag => tagIds.has(tag.id))
    || (bookmark.mediaType !== null && mediaTypeIds.has(bookmark.mediaType.id))
    || (bookmark.website !== null && websiteIds.has(bookmark.website.id))
    || (bookmark.youtubeChannel !== null && youtubeChannelIds.has(bookmark.youtubeChannel.id))
    || bookmark.people.some(person => personIds.has(person.id))
    || bookmark.groups.some(group => groupIds.has(group.id))
    || bookmark.genreMoods.some(genreMood => genreMoodIds.has(genreMood.id))
    || searches.some(search => bookmarkMatchesSearch(bookmark, search)));
}
