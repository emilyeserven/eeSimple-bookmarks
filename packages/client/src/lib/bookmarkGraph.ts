import type { Bookmark, BookmarkGraphSettings } from "@eesimple/types";

import { buildRelatednessSets, computeRelatedBookmarks, scoreBookmarkPair } from "./relatedBookmarks";

/** One displayed bookmark — the pinned center or a related peer. */
export interface BookmarkGraphNode {
  bookmark: Bookmark;
  isCenter: boolean;
  /** Σ scores of the node's kept incident edges — drives the node radius (bigger = more related). */
  weight: number;
  /** BFS hop count from the center along kept edges: 0 = center, 1 = layer-1 peer, 2 = expanded child… */
  distance: number;
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

/** Options for {@link buildBookmarkGraph}. */
export interface BuildBookmarkGraphOptions {
  /**
   * Ids of displayed peers the user has expanded — each unions its own related set as the next ring.
   * Flat (not a tree): an expanded child that is itself expanded is just another member here, so
   * nesting falls out for free. Ids not in the displayed set are ignored.
   */
  expandedIds?: ReadonlySet<string>;
}

/**
 * A non-explicit peer↔peer edge survives only when it ranks among each side's strongest few —
 * keeps a dense cluster readable at high `maxRelated` without ever dropping a focus node's edges.
 */
const MAX_PEER_EDGES_PER_NODE = 4;

/**
 * Build the bookmark graph model: the target pinned at the center plus the bookmarks
 * {@link computeRelatedBookmarks} returns (so the graph honors the Bookmark Graph weights,
 * relationship pinning, and `maxRelated`), optionally growing each `expandedIds` peer's own related
 * set as a further ring. Commonality edges connect every displayed pair — peer↔peer included, not
 * just center spokes. Pure and O(nodes²) over the (still `maxRelated`-bounded per layer) node set —
 * a sanctioned client-side derivation (see the "Data shaping" section in CLAUDE.md).
 */
export function buildBookmarkGraph(
  target: Bookmark,
  all: Bookmark[],
  settings: BookmarkGraphSettings,
  options: BuildBookmarkGraphOptions = {},
): BookmarkGraphModel {
  const bookmarks = collectDisplayedBookmarks(target, all, settings, options.expandedIds);
  const displayedIds = new Set(bookmarks.map(b => b.id));
  const sets = bookmarks.map(buildRelatednessSets);

  // An expanded node behaves like the center for edge retention, so all its spokes stay drawn.
  const focusIds = new Set<string>([target.id]);
  for (const id of options.expandedIds ?? []) {
    if (displayedIds.has(id)) focusIds.add(id);
  }

  const explicitPairs = collectExplicitPairs(bookmarks, displayedIds);
  const edges = scorePairs(bookmarks, sets, settings, explicitPairs);
  const kept = pruneEdges(edges, focusIds);

  const weightById = new Map<string, number>();
  for (const edge of kept) {
    weightById.set(edge.sourceId, (weightById.get(edge.sourceId) ?? 0) + edge.score);
    weightById.set(edge.targetId, (weightById.get(edge.targetId) ?? 0) + edge.score);
  }
  const distanceById = computeDistances(bookmarks, kept, target.id);

  const nodes: BookmarkGraphNode[] = bookmarks.map(bookmark => ({
    bookmark,
    isCenter: bookmark.id === target.id,
    weight: weightById.get(bookmark.id) ?? 0,
    distance: distanceById.get(bookmark.id) ?? 1,
  }));

  return {
    nodes,
    edges: kept,
    maxScore: kept.reduce((max, edge) => Math.max(max, edge.score), 0),
    maxWeight: nodes.reduce((max, node) => Math.max(max, node.weight), 0),
  };
}

/**
 * The displayed bookmark set, target first: layer-1 = the target's related set, then each expanded
 * (and already-displayed) peer unions its own related set. Deduped by id, so a bookmark reachable
 * two ways is one node.
 */
function collectDisplayedBookmarks(
  target: Bookmark,
  all: Bookmark[],
  settings: BookmarkGraphSettings,
  expandedIds: ReadonlySet<string> | undefined,
): Bookmark[] {
  const byId = new Map<string, Bookmark>([[target.id, target]]);
  for (const entry of computeRelatedBookmarks(target, all, settings)) {
    byId.set(entry.bookmark.id, entry.bookmark);
  }
  if (expandedIds) {
    const allById = new Map(all.map(bookmark => [bookmark.id, bookmark]));
    for (const id of expandedIds) {
      const parent = byId.get(id) ? allById.get(id) : undefined;
      if (!parent) continue;
      for (const entry of computeRelatedBookmarks(parent, all, settings)) {
        byId.set(entry.bookmark.id, entry.bookmark);
      }
    }
  }
  return [target, ...[...byId.values()].filter(bookmark => bookmark.id !== target.id)];
}

/** BFS the kept-edge graph from the center, returning each displayed node's hop count (center = 0). */
function computeDistances(
  bookmarks: Bookmark[],
  edges: BookmarkGraphEdge[],
  centerId: string,
): Map<string, number> {
  const adjacency = new Map<string, string[]>();
  const link = (a: string, b: string): void => {
    const list = adjacency.get(a);
    if (list) list.push(b);
    else adjacency.set(a, [b]);
  };
  for (const edge of edges) {
    link(edge.sourceId, edge.targetId);
    link(edge.targetId, edge.sourceId);
  }

  const distance = new Map<string, number>([[centerId, 0]]);
  let frontier = [centerId];
  let hop = 0;
  while (frontier.length > 0) {
    hop += 1;
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbor of adjacency.get(id) ?? []) {
        if (!distance.has(neighbor)) {
          distance.set(neighbor, hop);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }
  // A node with no kept edge (shouldn't happen — every node ties to center or a parent) reads as 1.
  for (const bookmark of bookmarks) {
    if (!distance.has(bookmark.id)) distance.set(bookmark.id, 1);
  }
  return distance;
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
 * Keep every explicit edge and every edge incident to a focus node (the center or an expanded peer);
 * keep a non-explicit, non-focus peer↔peer edge only while it ranks in the top
 * {@link MAX_PEER_EDGES_PER_NODE} strongest of at least one endpoint (score desc, then pair key for a
 * deterministic tiebreak).
 */
function pruneEdges(edges: BookmarkGraphEdge[], focusIds: ReadonlySet<string>): BookmarkGraphEdge[] {
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
      if (edge.explicit || focusIds.has(edge.sourceId) || focusIds.has(edge.targetId)) return true;
      const sourceRank = rankOf(edge.sourceId);
      const targetRank = rankOf(edge.targetId);
      return sourceRank <= MAX_PEER_EDGES_PER_NODE || targetRank <= MAX_PEER_EDGES_PER_NODE;
    });
}

/** The ids directly edge-adjacent to `id` in the model (excludes `id` itself). */
export function neighborsOf(model: BookmarkGraphModel, id: string): Set<string> {
  const neighbors = new Set<string>();
  for (const edge of model.edges) {
    if (edge.sourceId === id) neighbors.add(edge.targetId);
    else if (edge.targetId === id) neighbors.add(edge.sourceId);
  }
  return neighbors;
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

/**
 * Fade deeper rings so an expanded graph reads by layer. Opacity only — the radius still encodes
 * `weight`, and shrinking deep nodes would hurt their drag/tap target. Center + layer-1 stay full;
 * each further hop dims by 0.15, floored at 0.55.
 */
export function nodeOpacityForDistance(distance: number): number {
  if (distance <= 1) return 1;
  return Math.max(0.55, 1 - 0.15 * (distance - 1));
}

/** Truncate a node label to `max` characters with an ellipsis. */
export function truncateLabel(title: string, max = 18): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1)}…`;
}
