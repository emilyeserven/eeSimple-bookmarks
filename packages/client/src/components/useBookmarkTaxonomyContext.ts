import type { FlatNode } from "@/lib/tagTree";
import type { Author, Bookmark, Category, CustomProperty, MediaTypeNode, TagNode } from "@eesimple/types";

import { useMemo } from "react";

import { useRouterState } from "@tanstack/react-router";

import { useAuthors } from "@/hooks/useAuthors";
import { useBookmark, useUpdateBookmark } from "@/hooks/useBookmarks";
import { useCategories } from "@/hooks/useCategories";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import { flattenTree } from "@/lib/tagTree";

export interface BookmarkTaxonomyContext {
  bookmarkId: string | null;
  /** True when on the bookmark detail view page (not the edit page). */
  isBookmarkViewPage: boolean;
  bookmark: Bookmark | undefined;
  categories: Category[];
  flatMediaTypes: FlatNode<MediaTypeNode>[];
  flatTags: FlatNode<TagNode>[];
  authors: Author[];
  customProperties: CustomProperty[];
  updateBookmark: ReturnType<typeof useUpdateBookmark>;
}

/**
 * Detects whether the user is on a bookmark page and loads all data needed for taxonomy quick-edit.
 * `fallbackBookmarkId` (e.g. the hovered card's id) is used only when the URL has no bookmark id, so
 * the URL always wins on a detail/edit page.
 */
export function useBookmarkTaxonomyContext(fallbackBookmarkId: string | null = null): BookmarkTaxonomyContext {
  const urlBookmarkId = useRouterState({
    select: (state) => {
      const match = /^\/bookmarks\/([^/]+)/.exec(state.location.pathname);
      return match?.[1] ?? null;
    },
  });
  const bookmarkId = urlBookmarkId ?? fallbackBookmarkId;

  const isBookmarkViewPage = useRouterState({
    select: (state) => {
      const pathname = state.location.pathname;
      return pathname.startsWith("/bookmarks/") && !pathname.includes("/edit");
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
  const {
    data: customProperties = [],
  } = useCustomProperties();
  const updateBookmark = useUpdateBookmark();

  const flatMediaTypes = useMemo(
    () => flattenTree(mediaTypeTree),
    [mediaTypeTree],
  );

  const flatTags = useMemo(
    () => flattenTree(tagTree),
    [tagTree],
  );

  return {
    bookmarkId,
    isBookmarkViewPage,
    bookmark,
    categories,
    flatMediaTypes,
    flatTags,
    authors,
    customProperties,
    updateBookmark,
  };
}
