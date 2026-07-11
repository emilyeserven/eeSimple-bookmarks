import type { Bookmark, BookmarkGraphSettings, BookmarkGraphWeights, BookmarkRelationship } from "@eesimple/types";

/** One entry in the "Related bookmarks" list — pinned (explicit edge) or scored (derived). */
export interface RelatedBookmarkEntry {
  bookmark: Bookmark;
  /** The explicit edge that pinned this bookmark; undefined for scored (non-pinned) entries. */
  relationship: BookmarkRelationship | undefined;
}

/**
 * Compute the "Related bookmarks" list shown on a bookmark's View page. Pure and O(n) over the
 * already-cached bookmark list (a sanctioned client-side derivation — see the "Data shaping" section
 * in CLAUDE.md).
 *
 * `target.relationships` (explicit typed edges) are pinned first, in their existing order,
 * regardless of graph score — each entry's `relationship` names the edge. They're always shown in
 * full and excluded from the scored tail (no duplicates).
 *
 * The scored tail ranks every other candidate by relatedness score = Σ (weight × overlap) across
 * the configured dimensions: set dimensions (tags, genres & moods, people, groups) score by the
 * number of shared ids; scalar dimensions (category, media type, website, YouTube channel) score 1
 * on an exact match. Candidates that share nothing weighted are dropped; the rest are ranked by
 * score (desc), then by priority (desc), then recency (desc), and truncated to whatever remains of
 * `settings.maxRelated` after the pinned entries.
 */
export function computeRelatedBookmarks(
  target: Bookmark,
  all: Bookmark[],
  settings: BookmarkGraphSettings,
): RelatedBookmarkEntry[] {
  const {
    weights,
  } = settings;
  const targetSets = buildRelatednessSets(target);

  const relationshipByBookmarkId = new Map(target.relationships.map(rel => [rel.bookmark.id, rel]));
  const bookmarksById = new Map(all.map(bookmark => [bookmark.id, bookmark]));
  const pinned: RelatedBookmarkEntry[] = [];
  for (const rel of target.relationships) {
    const bookmark = bookmarksById.get(rel.bookmark.id);
    if (bookmark) pinned.push({
      bookmark,
      relationship: rel,
    });
  }

  const scored: { bookmark: Bookmark;
    score: number; }[] = [];
  for (const candidate of all) {
    if (candidate.id === target.id) continue;
    if (relationshipByBookmarkId.has(candidate.id)) continue;
    const score = scoreBookmarkPair(target, candidate, weights, targetSets);
    if (score > 0) scored.push({
      bookmark: candidate,
      score,
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.bookmark.priority !== a.bookmark.priority) return b.bookmark.priority - a.bookmark.priority;
    return b.bookmark.createdAt.localeCompare(a.bookmark.createdAt);
  });

  const tailLimit = Math.max(0, settings.maxRelated - pinned.length);
  const tail: RelatedBookmarkEntry[] = scored.slice(0, tailLimit).map(entry => ({
    bookmark: entry.bookmark,
    relationship: undefined,
  }));

  return [...pinned, ...tail];
}

/** The target bookmark's set-dimension ids, precomputed once so pair scoring stays O(candidate). */
export interface RelatednessSets {
  targetTags: Set<string>;
  targetGenreMoods: Set<string>;
  targetPeople: Set<string>;
  targetGroups: Set<string>;
}

/** Precompute a bookmark's set-dimension id sets for {@link scoreBookmarkPair}. */
export function buildRelatednessSets(bookmark: Bookmark): RelatednessSets {
  return {
    targetTags: new Set(bookmark.tags.map(t => t.id)),
    targetGenreMoods: new Set(bookmark.genreMoods.map(g => g.id)),
    targetPeople: new Set(bookmark.people.map(p => p.id)),
    targetGroups: new Set(bookmark.groups.map(g => g.id)),
  };
}

/**
 * Sum the weighted overlap across every relatedness dimension for one candidate. Symmetric —
 * swapping target and candidate (with the swapped sets) yields the same score.
 */
export function scoreBookmarkPair(
  target: Bookmark,
  candidate: Bookmark,
  weights: BookmarkGraphWeights,
  sets: RelatednessSets,
): number {
  let score = 0;
  score += weights.tags * countShared(sets.targetTags, candidate.tags);
  score += weights.genreMoods * countShared(sets.targetGenreMoods, candidate.genreMoods);
  score += weights.people * countShared(sets.targetPeople, candidate.people);
  score += weights.groups * countShared(sets.targetGroups, candidate.groups);
  if (target.categoryId === candidate.categoryId) score += weights.category;
  if (scalarMatches(target.mediaType?.id, candidate.mediaType?.id)) score += weights.mediaType;
  if (scalarMatches(target.website?.id, candidate.website?.id)) score += weights.website;
  if (scalarMatches(target.youtubeChannel?.id, candidate.youtubeChannel?.id)) score += weights.youtubeChannel;
  return score;
}

/** Count how many of `candidateItems` (by id) appear in the target's id set. */
function countShared(targetIds: Set<string>, candidateItems: { id: string }[]): number {
  let shared = 0;
  for (const item of candidateItems) {
    if (targetIds.has(item.id)) shared += 1;
  }
  return shared;
}

/** True when both scalar ids are present and equal (a shared null/undefined is not a match). */
function scalarMatches(a: string | undefined, b: string | undefined): boolean {
  return a !== undefined && a === b;
}
