import type { Bookmark, BookmarkUrlSummary } from "@eesimple/types";

/** A node in a bookmark parent/child hierarchy, ready for indented flat rendering. */
export interface BookmarkHierarchyNode {
  bookmark: BookmarkUrlSummary;
  /** Whether this node is the bookmark the hierarchy was built around. */
  isTarget: boolean;
  children: BookmarkHierarchyNode[];
}

/** Get-or-create a Set entry in a Map. */
function bucket(map: Map<string, Set<string>>, key: string): Set<string> {
  const existing = map.get(key);
  if (existing) return existing;
  const created = new Set<string>();
  map.set(key, created);
  return created;
}

/** The directional parent/child edges of the whole bookmark set, indexed both ways for traversal. */
interface BookmarkEdgeIndex {
  summaryById: Map<string, BookmarkUrlSummary>;
  childrenByParent: Map<string, Set<string>>;
  parentsByChild: Map<string, Set<string>>;
}

/**
 * Index every bookmark's directional relationships into parent→children / child→parents maps plus a
 * summary lookup. Non-directional (symmetric) relationships are ignored; `role` names the OTHER
 * bookmark relative to the carrying one.
 */
function indexBookmarkEdges(allBookmarks: Bookmark[]): BookmarkEdgeIndex {
  const summaryById = new Map<string, BookmarkUrlSummary>();
  const childrenByParent = new Map<string, Set<string>>();
  const parentsByChild = new Map<string, Set<string>>();

  for (const b of allBookmarks) {
    summaryById.set(b.id, {
      id: b.id,
      url: b.url,
      title: b.title,
    });
  }

  const addEdge = (parentId: string, childId: string) => {
    if (parentId === childId) return;
    bucket(childrenByParent, parentId).add(childId);
    bucket(parentsByChild, childId).add(parentId);
  };

  for (const b of allBookmarks) {
    for (const rel of b.relationships) {
      if (!rel.directional) continue;
      if (!summaryById.has(rel.bookmark.id)) summaryById.set(rel.bookmark.id, rel.bookmark);
      if (rel.role === "child") addEdge(b.id, rel.bookmark.id);
      else if (rel.role === "parent") addEdge(rel.bookmark.id, b.id);
    }
  }

  return {
    summaryById,
    childrenByParent,
    parentsByChild,
  };
}

/** Every node reachable from `seeds` by following `adjacency`, excluding `start`. Cycle-safe. */
function collectReachable(
  seeds: Iterable<string>,
  adjacency: Map<string, Set<string>>,
  start: string,
): Set<string> {
  const reached = new Set<string>();
  const stack = [...seeds];
  for (let id = stack.pop(); id !== undefined; id = stack.pop()) {
    if (id === start || reached.has(id)) continue;
    reached.add(id);
    for (const next of adjacency.get(id) ?? []) stack.push(next);
  }
  return reached;
}

/** Relevant nodes with no parent that is itself relevant — the roots to render the lineage from. */
function findLineageRoots(relevant: Set<string>, parentsByChild: Map<string, Set<string>>): string[] {
  const roots: string[] = [];
  for (const id of relevant) {
    const hasRelevantParent = [...(parentsByChild.get(id) ?? [])].some(p => relevant.has(p));
    if (!hasRelevantParent) roots.push(id);
  }
  return roots;
}

/** Recursively build a node and its relevant subtree, de-duplicating shared descendants via `visited`. */
function buildSubtree(
  id: string,
  index: BookmarkEdgeIndex,
  relevant: Set<string>,
  targetId: string,
  visited: Set<string>,
): BookmarkHierarchyNode | null {
  const summary = index.summaryById.get(id);
  if (!summary || visited.has(id)) return null;
  visited.add(id);
  const children = [...(index.childrenByParent.get(id) ?? [])]
    .filter(c => relevant.has(c))
    .map(c => buildSubtree(c, index, relevant, targetId, visited))
    .filter((n): n is BookmarkHierarchyNode => n !== null)
    .sort((a, b) => a.bookmark.title.localeCompare(b.bookmark.title));
  return {
    bookmark: summary,
    isTarget: id === targetId,
    children,
  };
}

/**
 * Build the parent/child hierarchy around `targetId` from the directional relationships carried by
 * every bookmark (already loaded in the bookmarks cache). Walks up to all root ancestors and down
 * through every descendant of the target, returning the lineage as a tree (roots first) with the
 * target flagged. Branches unrelated to the target's lineage are pruned, and cycles/DAGs are
 * de-duplicated so each bookmark renders once. Returns `[]` when the target has no parent/child
 * relationships.
 *
 * O(n) over the already-loaded bookmark list — a sanctioned client-side derivation (no endpoint).
 */
export function buildBookmarkHierarchy(
  targetId: string,
  allBookmarks: Bookmark[],
): BookmarkHierarchyNode[] {
  const index = indexBookmarkEdges(allBookmarks);
  if (!index.summaryById.has(targetId)) return [];

  const ancestors = collectReachable(
    index.parentsByChild.get(targetId) ?? [],
    index.parentsByChild,
    targetId,
  );
  const descendants = collectReachable(
    index.childrenByParent.get(targetId) ?? [],
    index.childrenByParent,
    targetId,
  );

  const relevant = new Set<string>([...ancestors, targetId, ...descendants]);
  if (relevant.size <= 1) return [];

  const visited = new Set<string>();
  return findLineageRoots(relevant, index.parentsByChild)
    .map(id => buildSubtree(id, index, relevant, targetId, visited))
    .filter((n): n is BookmarkHierarchyNode => n !== null)
    .sort((a, b) => a.bookmark.title.localeCompare(b.bookmark.title));
}
