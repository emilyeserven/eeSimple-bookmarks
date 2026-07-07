import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Person, Bookmark, Category, CustomProperty, GenreMood, MediaType, PlaceType, PropertyGroup, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";

import { useEffect } from "react";

import { useSetListingPage } from "../hooks/useListingPage";
import { useBookmarkColumns } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

/** The filter-context payload shared with the sort control + CMD+K palette via the UI store. */
export interface BookmarkSearchViewData {
  pageKey: string;
  tree: TagNode[];
  properties: CustomProperty[];
  propertyGroups?: PropertyGroup[];
  categories?: Category[];
  mediaTypes?: MediaType[];
  youtubeChannels?: YouTubeChannel[];
  websites?: Website[];
  relationshipTypes?: RelationshipType[];
  people?: Person[];
  placeTypes?: PlaceType[];
  genreMoods?: GenreMood[];
  bookmarks: Bookmark[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  /** When set, the header Add Bookmark modal locks new bookmarks to this category (category pages). */
  addFormCategoryId?: string;
}

export interface BookmarkSearchViewState {
  /** Per-page column count for the listing grid. */
  columns: number;
  /** Bookmarks after applying the header quick-search text filter. */
  textFilteredBookmarks: Bookmark[];
  /** True when the header quick-search has a non-empty query. */
  textSearchActive: boolean;
}

/**
 * Owns the hook-dense state orchestration for {@link BookmarkSearchView}: the listing-page
 * registration, header search wiring, the sort filter-context publish/cleanup effect, and the header
 * text filter — leaving the view component a thin render shell.
 */
export function useBookmarkSearchView(data: BookmarkSearchViewData): BookmarkSearchViewState {
  const {
    pageKey, tree, properties, propertyGroups, categories, mediaTypes, youtubeChannels,
    websites, relationshipTypes, people, placeTypes, genreMoods, bookmarks, search, onSearchChange,
    addFormCategoryId,
  } = data;

  useSetListingPage(pageKey, {
    showsImages: true,
    hasFilters: true,
    showsCards: true,
    hasSort: true,
    addBookmark: {
      categoryId: addFormCategoryId,
    },
  });
  const columns = useBookmarkColumns(pageKey);
  const setFilterContext = useUiStore(state => state.setFilterContext);
  const headerSearchQuery = useUiStore(state => state.headerSearchQuery);

  useEffect(() => {
    setFilterContext({
      tree,
      properties,
      propertyGroups,
      categories,
      mediaTypes,
      youtubeChannels,
      websites,
      relationshipTypes,
      people,
      placeTypes,
      genreMoods,
      bookmarks,
      search,
      onSearchChange,
    });
    return () => setFilterContext(null);
    // onSearchChange is a new arrow fn each render from the page; stable deps are the data arrays
  }, [tree, properties, propertyGroups, categories, mediaTypes, youtubeChannels, websites, relationshipTypes, people, placeTypes, genreMoods, bookmarks, search, onSearchChange, setFilterContext]);

  const q = headerSearchQuery.trim().toLowerCase();
  const textFilteredBookmarks = q
    ? bookmarks.filter(b =>
      b.title.toLowerCase().includes(q)
      || b.names.some(name => name.value.toLowerCase().includes(q))
      || (b.url?.toLowerCase() ?? "").includes(q)
      || (b.description ?? "").toLowerCase().includes(q))
    : bookmarks;

  return {
    columns,
    textFilteredBookmarks,
    textSearchActive: Boolean(q),
  };
}
