import type { BookmarkImageVisibility, HomepageSectionImageLayout } from "../lib/bookmarkColumns";
import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, Category, CustomProperty, MediaType, TagNode, YouTubeChannel } from "@eesimple/types";
import type { ReactNode } from "react";

import { TriangleAlert } from "lucide-react";

import { AddBookmarkCollapsible } from "./AddBookmarkCollapsible";
import { BookmarkCard } from "./BookmarkCard";
import { ColumnsSwitcher } from "./ColumnsSwitcher";
import { FilterSidebar } from "./FilterSidebar";
import { ImageLayoutSwitcher } from "./ImageLayoutSwitcher";
import { ImageModeSwitcher } from "./ImageModeSwitcher";
import { useIsMobile } from "../hooks/use-mobile";
import { useDeleteBookmark } from "../hooks/useBookmarks";
import { COLUMN_CLASS, DEFAULT_BOOKMARK_IMAGE_LAYOUT, useBookmarkColumns, useBookmarkImageMode, useBookmarkImageVisibility } from "../lib/bookmarkColumns";
import { bookmarkMatchesSearch, hasAnyActiveFilter } from "../lib/bookmarkSearch";
import { useUiStore } from "../stores/uiStore";

import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BookmarkSearchViewProps {
  /** Page heading area rendered above the two-column body. */
  header: ReactNode;
  /** Stable key identifying the page, so each listing remembers its own column count. */
  pageKey: string;
  tree: TagNode[];
  /** Properties offered as filters and used to render bookmark cards. */
  properties: CustomProperty[];
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
  const deleteBookmark = useDeleteBookmark();
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

  const visibleBookmarks = bookmarks.filter(bookmark => bookmarkMatchesSearch(bookmark, search));
  const hasActiveFilters = hasAnyActiveFilter(search);

  const unassignedProperties = categories
    ? properties.filter(property => property.categoryIds.length === 0)
    : [];

  return (
    <section className="space-y-8">
      {header}

      {unassignedProperties.length > 0
        ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="
                  inline-flex items-center gap-1.5 text-xs text-destructive
                "
              >
                <TriangleAlert className="size-4 shrink-0" />
                {unassignedProperties.length === 1
                  ? "1 property without a category"
                  : `${unassignedProperties.length} properties without a category`}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {unassignedProperties.map(property => property.name).join(", ")}
            </TooltipContent>
          </Tooltip>
        )
        : null}

      <div
        className="
          grid gap-8
          lg:grid-cols-[16rem_1fr] lg:gap-x-12
        "
      >
        <FilterSidebar
          tree={tree}
          properties={properties}
          categories={categories}
          mediaTypes={mediaTypes}
          youtubeChannels={youtubeChannels}
          bookmarks={bookmarks}
          search={search}
          onSearchChange={onSearchChange}
        />

        <div className="space-y-6">
          <AddBookmarkCollapsible lockedCategoryId={addFormCategoryId} />

          <BookmarkListControls
            pageKey={pageKey}
            columns={columns}
            imageVisibility={imageVisibility}
            imageLayout={imageLayout}
            onImageLayoutChange={layout => setBookmarkImageLayout(pageKey, layout)}
          />

          <div
            className={`
              grid gap-3
              ${COLUMN_CLASS[columns]}
            `}
          >
            {isLoading ? <p className="text-muted-foreground">Loading bookmarks…</p> : null}
            {error ? <p className="text-destructive">{error.message}</p> : null}
            {!isLoading && visibleBookmarks.length === 0
              ? (
                <p className="text-muted-foreground">
                  {hasActiveFilters ? noMatchMessage : emptyMessage}
                </p>
              )
              : null}
            {visibleBookmarks.map(bookmark => (
              <Card
                key={bookmark.id}
                className="p-4"
              >
                <BookmarkCard
                  bookmark={bookmark}
                  properties={properties}
                  onDelete={id => deleteBookmark.mutate(id)}
                  imageLeft={imageLeft}
                  maintainImageAspectRatio={imageMode}
                  imageVisibility={imageVisibility}
                />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface BookmarkListControlsProps {
  pageKey: string;
  columns: number;
  imageVisibility: BookmarkImageVisibility;
  imageLayout: HomepageSectionImageLayout;
  onImageLayoutChange: (layout: HomepageSectionImageLayout) => void;
}

function BookmarkListControls({
  pageKey, columns, imageVisibility, imageLayout, onImageLayoutChange,
}: BookmarkListControlsProps) {
  return (
    <div className="flex justify-end gap-4">
      <ColumnsSwitcher pageKey={pageKey} />
      {imageVisibility === "shown" && (columns === 1 || columns === 2) && (
        <ImageLayoutSwitcher
          layout={imageLayout}
          onLayoutChange={onImageLayoutChange}
        />
      )}
      <ImageModeSwitcher pageKey={pageKey} />
    </div>
  );
}
