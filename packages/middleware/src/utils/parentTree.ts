/**
 * Pure helpers over flat `parentId`-linked taxonomy lists (tags, locations). All operate on
 * in-memory data so they can be unit-tested without a database.
 */

interface ParentLinked {
  id: string;
  parentId: string | null;
}

/** Distinct bookmark counts for one node: its whole subtree and its "own" (no-descendant) share. */
export interface SubtreeBookmarkCounts {
  subtree: number;
  own: number;
}

/** Build a parent→children id map from a flat node list. */
export function buildChildrenByParent(all: ParentLinked[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const node of all) {
    if (!node.parentId) continue;
    const siblings = map.get(node.parentId) ?? [];
    siblings.push(node.id);
    map.set(node.parentId, siblings);
  }
  return map;
}

/** Resolve a node id to the set of ids in its subtree (inclusive). */
export function collectSubtreeIds(all: ParentLinked[], rootId: string): Set<string> {
  const childrenByParent = buildChildrenByParent(all);
  const result = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    for (const child of childrenByParent.get(id) ?? []) stack.push(child);
  }
  return result;
}

/**
 * Compute each node's distinct subtree bookmark count and its "own" (no-descendant) count from a
 * flat node list and node→bookmark links. Distinct counting dedupes bookmarks linked to both a
 * node and one of its descendants.
 */
export function computeSubtreeBookmarkCounts(
  all: ParentLinked[],
  links: { nodeId: string;
    bookmarkId: string; }[],
): Map<string, SubtreeBookmarkCounts> {
  const directSets = new Map<string, Set<string>>(all.map(node => [node.id, new Set<string>()]));
  for (const link of links) directSets.get(link.nodeId)?.add(link.bookmarkId);

  const childrenByParent = buildChildrenByParent(all);

  const result = new Map<string, SubtreeBookmarkCounts>();
  for (const node of all) {
    const ownDirect = directSets.get(node.id) ?? new Set<string>();
    const subtree = new Set<string>(ownDirect);
    const descendants = new Set<string>();
    const stack = [...(childrenByParent.get(node.id) ?? [])];
    while (stack.length > 0) {
      const id = stack.pop()!;
      for (const bookmarkId of directSets.get(id) ?? []) {
        subtree.add(bookmarkId);
        descendants.add(bookmarkId);
      }
      for (const child of childrenByParent.get(id) ?? []) stack.push(child);
    }
    let own = 0;
    for (const bookmarkId of ownDirect) if (!descendants.has(bookmarkId)) own += 1;
    result.set(node.id, {
      subtree: subtree.size,
      own,
    });
  }
  return result;
}
