import type { FlatNode } from "@/lib/tagTree";
import type { Author, Bookmark, Category, CustomProperty, LocationNode, MediaTypeNode, Newsletter, TagNode } from "@eesimple/types";

import { useRouterState } from "@tanstack/react-router";

import { useBookmarkTaxonomyTrees } from "./useBookmarkTaxonomyTrees";

import { useAuthors } from "@/hooks/useAuthors";
import { useBookmark, useUpdateBookmark } from "@/hooks/useBookmarks";
import { useCategories } from "@/hooks/useCategories";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { useNewsletters } from "@/hooks/useNewsletters";

export interface BookmarkTaxonomyContext {
  bookmarkId: string | null;
  /** True when on the bookmark detail view page (not the edit page). */
  isBookmarkViewPage: boolean;
  /**
   * True when `bookmarkId` came from the hovered-card fallback rather than the URL — i.e. the user
   * is on a listing page and hovered a card. Used to surface the card's quick-edit commands at the
   * top of the command palette.
   */
  bookmarkFromHover: boolean;
  bookmark: Bookmark | undefined;
  categories: Category[];
  flatMediaTypes: FlatNode<MediaTypeNode>[];
  flatTags: FlatNode<TagNode>[];
  flatLocations: FlatNode<LocationNode>[];
  authors: Author[];
  newsletters: Newsletter[];
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
  const bookmarkFromHover = urlBookmarkId === null && fallbackBookmarkId !== null;

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
    data: authors = [],
  } = useAuthors();
  const {
    data: newsletters = [],
  } = useNewsletters();
  const {
    data: customProperties = [],
  } = useCustomProperties();
  const updateBookmark = useUpdateBookmark();

  const {
    flatMediaTypes, flatTags, flatLocations,
  } = useBookmarkTaxonomyTrees();

  return {
    bookmarkId,
    isBookmarkViewPage,
    bookmarkFromHover,
    bookmark,
    categories,
    flatMediaTypes,
    flatTags,
    flatLocations,
    authors,
    newsletters,
    customProperties,
    updateBookmark,
  };
}
