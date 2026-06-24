import type { Author, Bookmark, Category, MediaType, TagNode } from "@eesimple/types";

import { useMemo } from "react";

import { useRouterState } from "@tanstack/react-router";

import { useAuthors } from "@/hooks/useAuthors";
import { useBookmark, useUpdateBookmark } from "@/hooks/useBookmarks";
import { useCategories } from "@/hooks/useCategories";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import { flattenTree } from "@/lib/tagTree";

export interface BookmarkTaxonomyContext {
  bookmarkId: string | null;
  bookmark: Bookmark | undefined;
  categories: Category[];
  flatMediaTypes: MediaType[];
  flatTags: TagNode[];
  authors: Author[];
  updateBookmark: ReturnType<typeof useUpdateBookmark>;
}

/** Detects whether the user is on a bookmark page and loads all data needed for taxonomy quick-edit. */
export function useBookmarkTaxonomyContext(): BookmarkTaxonomyContext {
  const bookmarkId = useRouterState({
    select: (state) => {
      const match = /^\/bookmarks\/([^/]+)/.exec(state.location.pathname);
      return match?.[1] ?? null;
    },
  });

  const {
    data: bookmark,
  } = useBookmark(bookmarkId ?? "");
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: mediaTypeTree = [],
  } = useMediaTypeTree();
  const {
    data: tagTree = [],
  } = useTagTree();
  const {
    data: authors = [],
  } = useAuthors();
  const updateBookmark = useUpdateBookmark();

  const flatMediaTypes = useMemo(
    () => flattenTree(mediaTypeTree).map(f => f.node),
    [mediaTypeTree],
  );

  const flatTags = useMemo(
    () => flattenTree(tagTree).map(f => f.node),
    [tagTree],
  );

  return {
    bookmarkId,
    bookmark,
    categories,
    flatMediaTypes,
    flatTags,
    authors,
    updateBookmark,
  };
}
