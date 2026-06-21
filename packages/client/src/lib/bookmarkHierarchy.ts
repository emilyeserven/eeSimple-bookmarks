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
      // role names the OTHER bookmark relative to `b`.
      if (rel.role === "child") addEdge(b.id, rel.bookmark.id);
      else if (rel.role === "parent") addEdge(rel.bookmark.id, b.id);
    }
  }

  if (!summaryById.has(targetId)) return [];

  // Collect strict ancestors (walk up) and strict descendants (walk down).
  const ancestors = new Set<string>();
  const up = [...(parentsByChild.get(targetId) ?? [])];
  for (let id = up.pop(); id !== undefined; id = up.pop()) {
    if (id === targetId || ancestors.has(id)) continue;
    ancestors.add(id);
    for (const p of parentsByChild.get(id) ?? []) up.push(p);
  }

  const descendants = new Set<string>();
  const down = [...(childrenByParent.get(targetId) ?? [])];
  for (let id = down.pop(); id !== undefined; id = down.pop()) {
    if (id === targetId || descendants.has(id)) continue;
    descendants.add(id);
    for (const c of childrenByParent.get(id) ?? []) down.push(c);
  }

  const relevant = new Set<string>([...ancestors, targetId, ...descendants]);
  if (relevant.size <= 1) return [];

  // Roots are relevant nodes with no parent inside the lineage.
  const roots: string[] = [];
  for (const id of relevant) {
    const hasRelevantParent = [...(parentsByChild.get(id) ?? [])].some(p => relevant.has(p));
    if (!hasRelevantParent) roots.push(id);
  }

  const visited = new Set<string>();
  const build = (id: string): BookmarkHierarchyNode | null => {
    const summary = summaryById.get(id);
    if (!summary || visited.has(id)) return null;
    visited.add(id);
    const children = [...(childrenByParent.get(id) ?? [])]
      .filter(c => relevant.has(c))
      .map(build)
      .filter((n): n is BookmarkHierarchyNode => n !== null)
      .sort((a, b) => a.bookmark.title.localeCompare(b.bookmark.title));
    return {
      bookmark: summary,
      isTarget: id === targetId,
      children,
    };
  };

  return roots
    .map(build)
    .filter((n): n is BookmarkHierarchyNode => n !== null)
    .sort((a, b) => a.bookmark.title.localeCompare(b.bookmark.title));
}
