import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, Category, CustomProperty, MediaType, PropertyGroup, TagNode, Website, YouTubeChannel } from "@eesimple/types";
import type { ReactNode } from "react";

import { useEffect } from "react";

import { BookmarkListPane } from "./BookmarkListPane";
import { FilterSidebar } from "./FilterSidebar";
import { usePanelControls } from "./panel/usePanelControls";
import { useSetListingPage } from "../hooks/useListingPage";
import { useRegisterHeaderSearch } from "../hooks/useRegisterHeaderSearch";
import { useBookmarkColumns } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

interface BookmarkSearchViewProps {
  /** Page heading area rendered above the two-column body. */
  header: ReactNode;
  /** Stable key identifying the page, so each listing remembers its own column count. */
  pageKey: string;
  tree: TagNode[];
  /** Properties offered as filters and used to render bookmark cards. */
  properties: CustomProperty[];
  /** Property groups; grouped property filters render under their group's heading. */
  propertyGroups?: PropertyGroup[];
  /** When provided, groups category-specific property filters under collapsible sections. */
  categories?: Category[];
  /** Media types offered as a multi-select filter in the rail. */
  mediaTypes?: MediaType[];
  /** YouTube channels offered as a multi-select filter in the rail. */
  youtubeChannels?: YouTubeChannel[];
  /** Websites offered as a multi-select filter in the rail. */
  websites?: Website[];
  /** Bookmarks already narrowed by tag (and category, on category pages). */
  bookmarks: Bookmark[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  isLoading: boolean;
  error: Error | null;
  /** Message shown when there are no bookmarks and no filter is active. */
  emptyMessage: string;
  /** Message shown when a filter is active but nothing matches it. */
  noMatchMessage: string;
  /**
   * When set, the add form is locked to this category and hides its Category picker — used on
   * category pages, where new bookmarks belong to the current category.
   */
  addFormCategoryId?: string;
}

/**
 * Shared layout for the search pages (Bookmarks and each category): a left filter rail
 * and a right column with the add form and the matching bookmark list. Tag filtering is
 * applied upstream (server-side); this view applies the custom-property filters.
 */
export function BookmarkSearchView({
  header,
  pageKey,
  tree,
  properties,
  propertyGroups,
  categories,
  mediaTypes,
  youtubeChannels,
  websites,
  bookmarks,
  search,
  onSearchChange,
  isLoading,
  error,
  emptyMessage,
  noMatchMessage,
  addFormCategoryId,
}: BookmarkSearchViewProps) {
  useSetListingPage(pageKey, true, true, true);
  useRegisterHeaderSearch();
  const columns = useBookmarkColumns(pageKey);
  const filtersInDrawer = useUiStore(state => state.filtersInDrawer);
  const filtersHidden = useUiStore(state => state.filtersHidden);
  const setFilterContext = useUiStore(state => state.setFilterContext);
  const headerSearchQuery = useUiStore(state => state.headerSearchQuery);
  const {
    isOpen, dCT, openType,
  } = usePanelControls();
  const filtersActiveInDrawer = isOpen && dCT === "filters";
  const hideSidebar = filtersActiveInDrawer || filtersHidden;

  useEffect(() => {
    setFilterContext({
      tree,
      properties,
      propertyGroups,
      categories,
      mediaTypes,
      youtubeChannels,
      websites,
      bookmarks,
      search,
      onSearchChange,
    });
    return () => setFilterContext(null);
    // onSearchChange is a new arrow fn each render from the page; stable deps are the data arrays
  }, [tree, properties, propertyGroups, categories, mediaTypes, youtubeChannels, websites, bookmarks, search, onSearchChange, setFilterContext]);

  useEffect(() => {
    if (filtersInDrawer && !isOpen) {
      openType("filters");
    }
  // Only on mount — intentionally omit filtersInDrawer/isOpen/openType to avoid re-running
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = headerSearchQuery.trim().toLowerCase();
  const textFilteredBookmarks = q
    ? bookmarks.filter(b =>
      b.title.toLowerCase().includes(q)
      || b.url.toLowerCase().includes(q)
      || (b.description ?? "").toLowerCase().includes(q))
    : bookmarks;

  return (
    <section className="space-y-8">
      {header}

      <div
        className={hideSidebar
          ? "grid gap-8"
          : `
            grid gap-8
            lg:grid-cols-[16rem_1fr] lg:gap-x-12
          `}
      >
        {!hideSidebar && (
          <FilterSidebar
            tree={tree}
            properties={properties}
            propertyGroups={propertyGroups}
            categories={categories}
            mediaTypes={mediaTypes}
            youtubeChannels={youtubeChannels}
            websites={websites}
            bookmarks={bookmarks}
            search={search}
            onSearchChange={onSearchChange}
          />
        )}

        <BookmarkListPane
          pageKey={pageKey}
          columns={columns}
          bookmarks={textFilteredBookmarks}
          properties={properties}
          search={search}
          textSearchActive={!!q}
          isLoading={isLoading}
          error={error}
          emptyMessage={emptyMessage}
          noMatchMessage={noMatchMessage}
          addFormCategoryId={addFormCategoryId}
        />
      </div>
    </section>
  );
}
