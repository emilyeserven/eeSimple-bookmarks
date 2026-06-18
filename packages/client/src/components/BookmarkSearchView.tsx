import type { HomepageSectionImageLayout } from "../lib/bookmarkColumns";
import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, Category, CustomProperty, MediaType, PropertyGroup, TagNode, YouTubeChannel } from "@eesimple/types";
import type { ReactNode } from "react";

import { BookmarkListPane } from "./BookmarkListPane";
import { FilterSidebar } from "./FilterSidebar";
import { UnassignedPropertiesWarning } from "./UnassignedPropertiesWarning";
import { useIsMobile } from "../hooks/use-mobile";
import { DEFAULT_BOOKMARK_IMAGE_LAYOUT, useBookmarkColumns, useBookmarkImageMode, useBookmarkImageVisibility } from "../lib/bookmarkColumns";
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
  bookmarks,
  search,
  onSearchChange,
  isLoading,
  error,
  emptyMessage,
  noMatchMessage,
  addFormCategoryId,
}: BookmarkSearchViewProps) {
  const columns = useBookmarkColumns(pageKey);
  const imageMode = useBookmarkImageMode(pageKey);
  const imageVisibility = useBookmarkImageVisibility(pageKey);
  const isMobile = useIsMobile();
  // Raw stored value (may be undefined) so we can tell "unset" from an explicit "above".
  const storedImageLayout = useUiStore(state => state.bookmarkImageLayout[pageKey]);
  // At 1 column the default is responsive — image above on mobile, side on desktop — until the
  // user makes an explicit pick; 2 columns keeps the "above" default and 3–4 always stack.
  const imageLayout: HomepageSectionImageLayout = storedImageLayout
    ?? (columns === 1 && !isMobile ? "side" : DEFAULT_BOOKMARK_IMAGE_LAYOUT);
  const imageLeft = (columns === 1 || columns === 2) && imageLayout === "side";
  const setBookmarkImageLayout = useUiStore(state => state.setBookmarkImageLayout);

  const unassignedProperties = categories
    ? properties.filter(property => property.categoryIds.length === 0)
    : [];

  return (
    <section className="space-y-8">
      {header}

      <UnassignedPropertiesWarning properties={unassignedProperties} />

      <div
        className="
          grid gap-8
          lg:grid-cols-[16rem_1fr] lg:gap-x-12
        "
      >
        <FilterSidebar
          tree={tree}
          properties={properties}
          propertyGroups={propertyGroups}
          categories={categories}
          mediaTypes={mediaTypes}
          youtubeChannels={youtubeChannels}
          bookmarks={bookmarks}
          search={search}
          onSearchChange={onSearchChange}
        />

        <BookmarkListPane
          pageKey={pageKey}
          columns={columns}
          imageVisibility={imageVisibility}
          imageLayout={imageLayout}
          onImageLayoutChange={layout => setBookmarkImageLayout(pageKey, layout)}
          imageLeft={imageLeft}
          imageMode={imageMode}
          bookmarks={bookmarks}
          properties={properties}
          search={search}
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
