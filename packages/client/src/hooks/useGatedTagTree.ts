import type { TagNode } from "@eesimple/types";

import { useCategoryAvailableTags } from "./useCategories";

interface GatedTagTree {
  /**
   * Category's available root ids (explicit assignment ∪ globally-unassigned tags); `undefined`
   * while loading or when no single category id is known.
   */
  availableRootIds: string[] | undefined;
  /** `tree` filtered to `availableRootIds` when a category id is known; `tree` unchanged otherwise. */
  tree: TagNode[];
}

/**
 * Gate a tag tree to a single category's available root tags. Returns the tree unfiltered when no
 * single category id is known yet (e.g. a source with no default category, or a bulk selection
 * spanning multiple categories) — pass `null`/`undefined` for that case.
 */
export function useGatedTagTree(categoryId: string | null | undefined, tree: TagNode[]): GatedTagTree {
  const {
    data: availableRootIds,
  } = useCategoryAvailableTags(categoryId ?? "");

  if (!categoryId || availableRootIds === undefined) {
    return {
      availableRootIds: categoryId ? availableRootIds : undefined,
      tree,
    };
  }

  return {
    availableRootIds,
    tree: tree.filter(root => availableRootIds.includes(root.id)),
  };
}
