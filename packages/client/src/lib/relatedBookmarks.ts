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

/** A dimension along which two bookmarks are related, for the graph's hover explanation. */
export interface RelatednessDimension {
  /** Stable key — the UI maps it to a translated label. */
  dimension: "tags" | "genreMoods" | "people" | "groups" | "category" | "mediaType" | "website" | "youtubeChannel" | "relationship";
  /** Names of the shared items (or the single shared value / a relationship description). */
  values: string[];
}

/**
 * Explain how two bookmarks are related, mirroring {@link scoreBookmarkPair}'s dimensions but naming
 * the shared items instead of counting them — for the graph's on-hover relationship popover. A scored
 * dimension is included only when its weight is on **and** something is shared (so the popover matches
 * why the edge exists); an explicit relationship is always included. Symmetric. Pure — the category
 * name is injected (a bookmark carries only `categoryId`).
 */
export function explainRelatedness(
  a: Bookmark,
  b: Bookmark,
  weights: BookmarkGraphWeights,
  categoryName: (id: string) => string | undefined,
): RelatednessDimension[] {
  const dimensions: RelatednessDimension[] = [];
  const add = (dimension: RelatednessDimension["dimension"], values: string[]): void => {
    if (values.length > 0) dimensions.push({
      dimension,
      values,
    });
  };

  if (weights.tags > 0) add("tags", sharedNames(a.tags, b.tags));
  if (weights.genreMoods > 0) add("genreMoods", sharedNames(a.genreMoods, b.genreMoods));
  if (weights.people > 0) add("people", sharedNames(a.people, b.people));
  if (weights.groups > 0) add("groups", sharedNames(a.groups, b.groups));
  if (weights.category > 0 && a.categoryId === b.categoryId) {
    add("category", [categoryName(a.categoryId) ?? ""].filter(Boolean));
  }
  if (weights.mediaType > 0 && scalarMatches(a.mediaType?.id, b.mediaType?.id)) {
    add("mediaType", [a.mediaType?.name ?? ""].filter(Boolean));
  }
  if (weights.website > 0 && scalarMatches(a.website?.id, b.website?.id)) {
    add("website", [a.website?.siteName ?? a.website?.domain ?? ""].filter(Boolean));
  }
  if (weights.youtubeChannel > 0 && scalarMatches(a.youtubeChannel?.id, b.youtubeChannel?.id)) {
    add("youtubeChannel", [a.youtubeChannel?.name ?? ""].filter(Boolean));
  }
  const relationship = explicitRelationshipLabel(a, b);
  if (relationship) add("relationship", [relationship]);

  return dimensions;
}

/** The names present (by id) in both item lists. */
function sharedNames(aItems: { id: string;
  name: string; }[], bItems: { id: string;
  name: string; }[]): string[] {
  const bIds = new Set(bItems.map(item => item.id));
  return aItems.filter(item => bIds.has(item.id)).map(item => item.name);
}

/** A short description of an explicit relationship edge between `a` and `b`, or null if none. */
function explicitRelationshipLabel(a: Bookmark, b: Bookmark): string | null {
  const edge = a.relationships.find(rel => rel.bookmark.id === b.id)
    ?? b.relationships.find(rel => rel.bookmark.id === a.id);
  if (!edge) return null;
  return edge.label ? `${edge.relationshipTypeName} — ${edge.label}` : edge.relationshipTypeName;
}
