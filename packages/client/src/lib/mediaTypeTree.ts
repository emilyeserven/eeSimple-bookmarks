import type { MediaType, MediaTypeNode } from "@eesimple/types";

/**
 * Nest a flat `MediaType[]` into a `MediaTypeNode[]` tree by `parentId`, ordering siblings by
 * `sortOrder` at every level. Recurses to arbitrary depth (don't hard-assume single nesting). Used
 * where only the flat list is threaded to a picker (the bookmarks filter facet); most pickers get
 * the tree straight from `useMediaTypeTree()`. Pure — unit-tested directly.
 */
export function buildMediaTypeTree(flat: MediaType[]): MediaTypeNode[] {
  const childrenOf = (parentId: string | null): MediaTypeNode[] =>
    flat
      .filter(m => m.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(m => ({
        ...m,
        children: childrenOf(m.id),
      }));

  return childrenOf(null);
}
