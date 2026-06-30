import type { Bookmark, Category, LocationNode, MediaTypeNode, TagNode } from "@eesimple/types";

import { useBookmarks } from "@/hooks/useBookmarks";
import { useCategories } from "@/hooks/useCategories";
import { useLocationTree } from "@/hooks/useLocations";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";

export interface CategoryBookmarkData {
  categories: Category[] | undefined;
  categoriesLoading: boolean;
  bookmarks: Bookmark[] | undefined;
  bookmarksLoading: boolean;
}

/** Categories + bookmarks lists (already cached app-wide), for the category/bookmark switcher specs. */
export function useCategoryBookmarkData(): CategoryBookmarkData {
  const categories = useCategories();
  const bookmarks = useBookmarks();
  return {
    categories: categories.data,
    categoriesLoading: categories.isLoading,
    bookmarks: bookmarks.data,
    bookmarksLoading: bookmarks.isLoading,
  };
}

export interface TreeData {
  roots: (TagNode | MediaTypeNode | LocationNode)[] | undefined;
  isLoading: boolean;
}

/** The tag/media-type/location tree roots for a tree-siblings switcher spec (already cached). */
export function useTreeSwitcherData(tree: "tag" | "media-type" | "location"): TreeData {
  const tagTree = useTagTree();
  const mediaTypeTree = useMediaTypeTree();
  const locationTree = useLocationTree();
  const treeQuery = tree === "tag"
    ? tagTree
    : tree === "location" ? locationTree : mediaTypeTree;
  return {
    roots: treeQuery.data,
    isLoading: treeQuery.isLoading,
  };
}
