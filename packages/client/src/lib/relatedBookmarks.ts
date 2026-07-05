import type { Bookmark, BookmarkGraphSettings, BookmarkGraphWeights } from "@eesimple/types";

/**
 * Compute the "Related bookmarks" list shown on a bookmark's View page. Pure and O(n) over the
 * already-cached bookmark list (a sanctioned client-side derivation — see the "Data shaping" section
 * in CLAUDE.md). Each candidate's relatedness score = Σ (weight × overlap) across the configured
 * dimensions: set dimensions (tags, genres & moods, people, groups) score by the number of shared
 * ids; scalar dimensions (category, media type, website, YouTube channel) score 1 on an exact match.
 * Candidates that share nothing weighted are dropped; the rest are ranked by score (desc), then by
 * priority (desc), then recency (desc), and truncated to `settings.maxRelated`.
 */
export function computeRelatedBookmarks(
  target: Bookmark,
  all: Bookmark[],
  settings: BookmarkGraphSettings,
): Bookmark[] {
  const {
    weights,
  } = settings;
  const targetTags = new Set(target.tags.map(t => t.id));
  const targetGenreMoods = new Set(target.genreMoods.map(g => g.id));
  const targetPeople = new Set(target.people.map(p => p.id));
  const targetGroups = new Set(target.groups.map(g => g.id));

  const scored: { bookmark: Bookmark;
    score: number; }[] = [];
  for (const candidate of all) {
    if (candidate.id === target.id) continue;
    const score = scoreBookmark(target, candidate, weights, {
      targetTags,
      targetGenreMoods,
      targetPeople,
      targetGroups,
    });
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

  return scored.slice(0, Math.max(0, settings.maxRelated)).map(entry => entry.bookmark);
}

interface TargetSets {
  targetTags: Set<string>;
  targetGenreMoods: Set<string>;
  targetPeople: Set<string>;
  targetGroups: Set<string>;
}

/** Sum the weighted overlap across every relatedness dimension for one candidate. */
function scoreBookmark(
  target: Bookmark,
  candidate: Bookmark,
  weights: BookmarkGraphWeights,
  sets: TargetSets,
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
