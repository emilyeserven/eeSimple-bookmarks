import type { Bookmark, BookmarkGraphSettings } from "@eesimple/types";

import { buildRelatednessSets, computeRelatedBookmarks, scoreBookmarkPair } from "./relatedBookmarks";

/** One displayed bookmark — the pinned center or a related peer. */
export interface BookmarkGraphNode {
  bookmark: Bookmark;
  isCenter: boolean;
  /** Σ scores of the node's kept incident edges — drives the node radius (bigger = more related). */
  weight: number;
}

/** An undirected commonality edge between two displayed bookmarks. */
export interface BookmarkGraphEdge {
  sourceId: string;
  targetId: string;
  /** The pairwise relatedness score — drives spring strength, stroke width, and opacity. */
  score: number;
  /** True when the pair has an explicit `bookmark_relationships` edge (always kept, score ≥ 1). */
  explicit: boolean;
}

export interface BookmarkGraphModel {
  nodes: BookmarkGraphNode[];
  edges: BookmarkGraphEdge[];
  maxScore: number;
  maxWeight: number;
}

/**
 * A non-explicit peer↔peer edge survives only when it ranks among each side's strongest few —
 * keeps a dense cluster readable at high `maxRelated` without ever dropping center or explicit edges.
 */
const MAX_PEER_EDGES_PER_NODE = 4;

/**
 * Build the one-layer bookmark graph model: the target pinned at the center plus exactly the
 * bookmarks {@link computeRelatedBookmarks} returns (so the graph honors the Bookmark Graph weights,
 * relationship pinning, and `maxRelated`), with commonality edges between every displayed pair —
 * peer↔peer included, not just center spokes. Pure and O(nodes²) over the already-truncated node set
 * (a sanctioned client-side derivation — see the "Data shaping" section in CLAUDE.md).
 */
export function buildBookmarkGraph(
  target: Bookmark,
  all: Bookmark[],
  settings: BookmarkGraphSettings,
): BookmarkGraphModel {
  const related = computeRelatedBookmarks(target, all, settings);
  const bookmarks = [target, ...related.map(entry => entry.bookmark)];
  const displayedIds = new Set(bookmarks.map(b => b.id));
  const sets = bookmarks.map(buildRelatednessSets);

  const explicitPairs = collectExplicitPairs(bookmarks, displayedIds);
  const edges = scorePairs(bookmarks, sets, settings, explicitPairs);
  const kept = pruneEdges(edges, target.id);

  const weightById = new Map<string, number>();
  for (const edge of kept) {
    weightById.set(edge.sourceId, (weightById.get(edge.sourceId) ?? 0) + edge.score);
    weightById.set(edge.targetId, (weightById.get(edge.targetId) ?? 0) + edge.score);
  }

  const nodes: BookmarkGraphNode[] = bookmarks.map(bookmark => ({
    bookmark,
    isCenter: bookmark.id === target.id,
    weight: weightById.get(bookmark.id) ?? 0,
  }));

  return {
    nodes,
    edges: kept,
    maxScore: kept.reduce((max, edge) => Math.max(max, edge.score), 0),
    maxWeight: nodes.reduce((max, node) => Math.max(max, node.weight), 0),
  };
}

/** Canonical undirected pair key, so both hydrated sides of a relationship dedupe to one edge. */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/** The pair keys of every explicit relationship whose both ends are displayed. */
function collectExplicitPairs(bookmarks: Bookmark[], displayedIds: Set<string>): Set<string> {
  const pairs = new Set<string>();
  for (const bookmark of bookmarks) {
    for (const rel of bookmark.relationships) {
      if (displayedIds.has(rel.bookmark.id) && rel.bookmark.id !== bookmark.id) {
        pairs.add(pairKey(bookmark.id, rel.bookmark.id));
      }
    }
  }
  return pairs;
}

/**
 * Score every displayed pair. Non-explicit zero-score pairs are dropped; explicit pairs are always
 * kept with their score floored to ≥ 1 so a relationship with zero taxonomy overlap still draws.
 */
function scorePairs(
  bookmarks: Bookmark[],
  sets: ReturnType<typeof buildRelatednessSets>[],
  settings: BookmarkGraphSettings,
  explicitPairs: Set<string>,
): BookmarkGraphEdge[] {
  const edges: BookmarkGraphEdge[] = [];
  for (let i = 0; i < bookmarks.length; i += 1) {
    for (let j = i + 1; j < bookmarks.length; j += 1) {
      const score = scoreBookmarkPair(bookmarks[i], bookmarks[j], settings.weights, sets[i]);
      const explicit = explicitPairs.has(pairKey(bookmarks[i].id, bookmarks[j].id));
      if (score === 0 && !explicit) continue;
      edges.push({
        sourceId: bookmarks[i].id,
        targetId: bookmarks[j].id,
        score: explicit ? Math.max(1, score) : score,
        explicit,
      });
    }
  }
  return edges;
}

/**
 * Keep every center and explicit edge; keep a non-explicit peer↔peer edge only while it ranks in the
 * top {@link MAX_PEER_EDGES_PER_NODE} strongest of at least one endpoint (score desc, then pair key
 * for a deterministic tiebreak).
 */
function pruneEdges(edges: BookmarkGraphEdge[], centerId: string): BookmarkGraphEdge[] {
  const rankById = new Map<string, number>();
  const rankOf = (id: string): number => {
    const next = (rankById.get(id) ?? 0) + 1;
    rankById.set(id, next);
    return next;
  };

  return [...edges]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return pairKey(a.sourceId, a.targetId).localeCompare(pairKey(b.sourceId, b.targetId));
    })
    .filter((edge) => {
      if (edge.explicit || edge.sourceId === centerId || edge.targetId === centerId) return true;
      const sourceRank = rankOf(edge.sourceId);
      const targetRank = rankOf(edge.targetId);
      return sourceRank <= MAX_PEER_EDGES_PER_NODE || targetRank <= MAX_PEER_EDGES_PER_NODE;
    });
}

/** Node radius in viewBox units — area-proportional (sqrt) scaling so big nodes don't dwarf the rest. */
export function nodeRadius(weight: number, maxWeight: number): number {
  const MIN = 6;
  const MAX = 16;
  if (maxWeight <= 0) return MIN;
  return MIN + (MAX - MIN) * Math.sqrt(Math.max(0, weight) / maxWeight);
}

/** Edge stroke width in viewBox units, 1–3, proportional to the pair's share of the max score. */
export function edgeStrokeWidth(score: number, maxScore: number): number {
  if (maxScore <= 0) return 1;
  return 1 + 2 * (Math.max(0, score) / maxScore);
}

/** Edge stroke opacity, 0.25–0.85, proportional to the pair's share of the max score. */
export function edgeOpacity(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0.25;
  return 0.25 + 0.6 * (Math.max(0, score) / maxScore);
}

/** Truncate a node label to `max` characters with an ellipsis. */
export function truncateLabel(title: string, max = 18): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1)}…`;
}
