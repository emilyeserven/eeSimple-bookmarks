import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Person, Bookmark, Category, CustomProperty, GenreMood, MediaType, PlaceType, PropertyGroup, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";

import { useEffect } from "react";

import { usePanelControls } from "./panel/usePanelControls";
import { useFilterLocation } from "../hooks/useAppSettings";
import { useSetListingPage } from "../hooks/useListingPage";
import { useBookmarkColumns } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

/** The filter-context payload shared with the drawer's FiltersPanel via the UI store. */
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
  /** True when the left filter rail should be hidden (filters live in the drawer, pills, or are off). */
  hideSidebar: boolean;
  /** True when filters render as a pill row under the search bar. */
  showPills: boolean;
  /** Bookmarks after applying the header quick-search text filter. */
  textFilteredBookmarks: Bookmark[];
  /** True when the header quick-search has a non-empty query. */
  textSearchActive: boolean;
}

/**
 * Owns the hook-dense state orchestration for {@link BookmarkSearchView}: the listing-page
 * registration, header search wiring, settings reads, the drawer filter-context publish/cleanup
 * effect, and the header text filter — leaving the view component a thin render shell.
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
  const filterLocation = useFilterLocation();
  const setFilterContext = useUiStore(state => state.setFilterContext);
  const headerSearchQuery = useUiStore(state => state.headerSearchQuery);
  const {
    isOpen, dCT, openType,
  } = usePanelControls();
  const filtersActiveInDrawer = isOpen && dCT === "filters";
  // The left rail shows only in sidebar mode (and not while the drawer is actively showing filters).
  const hideSidebar = filtersActiveInDrawer || filterLocation !== "sidebar";
  const showPills = filterLocation === "pills";

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

  // Only on mount — intentionally omit filterLocation/isOpen/openType to avoid re-running.
  useEffect(() => {
    if (filterLocation === "drawer" && !isOpen) {
      openType("filters");
    }
  }, []);

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
    hideSidebar,
    showPills,
    textFilteredBookmarks,
    textSearchActive: Boolean(q),
  };
}
