import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, Category, CustomProperty, MediaType, PropertyGroup, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";
import type { ReactNode } from "react";

import { BookmarkListPane } from "./BookmarkListPane";
import { FilterSidebar } from "./FilterSidebar";
import { useBookmarkSearchView } from "./useBookmarkSearchView";

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
  /** Relationship types offered as a multi-select filter in the rail. */
  relationshipTypes?: RelationshipType[];
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
  relationshipTypes,
  bookmarks,
  search,
  onSearchChange,
  isLoading,
  error,
  emptyMessage,
  noMatchMessage,
  addFormCategoryId,
}: BookmarkSearchViewProps) {
  const {
    columns, hideSidebar, textFilteredBookmarks, textSearchActive,
  } = useBookmarkSearchView({
    pageKey,
    tree,
    properties,
    propertyGroups,
    categories,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    bookmarks,
    search,
    onSearchChange,
  });

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
            relationshipTypes={relationshipTypes}
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
          textSearchActive={textSearchActive}
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
