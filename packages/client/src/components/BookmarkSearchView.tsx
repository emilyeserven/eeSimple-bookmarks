import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, Category, CustomProperty, TagNode } from "@eesimple/types";
import type { ReactNode } from "react";

import { ChevronDown, TriangleAlert } from "lucide-react";

import { BookmarkCard } from "./BookmarkCard";
import { BookmarkForm } from "./BookmarkForm";
import { ColumnsSwitcher } from "./ColumnsSwitcher";
import { FilterSidebar } from "./FilterSidebar";
import { ImageLayoutSwitcher } from "./ImageLayoutSwitcher";
import { ImageModeSwitcher } from "./ImageModeSwitcher";
import { useDeleteBookmark } from "../hooks/useBookmarks";
import { COLUMN_CLASS, useBookmarkColumns, useBookmarkImageLayout, useBookmarkImageMode } from "../lib/bookmarkColumns";
import { bookmarkMatchesSearch } from "../lib/bookmarkSearch";
import { useUiStore } from "../stores/uiStore";

import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const imageLayout = useBookmarkImageLayout(pageKey);
  const imageLeft = columns === 1 || (columns === 2 && imageLayout === "side");
  const setBookmarkImageLayout = useUiStore(state => state.setBookmarkImageLayout);
  const addBookmarkFormOpen = useUiStore(state => state.addBookmarkFormOpen);
  const setAddBookmarkFormOpen = useUiStore(state => state.setAddBookmarkFormOpen);

  const visibleBookmarks = bookmarks.filter(bookmark => bookmarkMatchesSearch(bookmark, search));
  const hasActiveFilters = search.tag !== undefined
    || search.tagPresence !== undefined
    || (search.categories?.length ?? 0) > 0
    || Object.keys(search.num ?? {}).length > 0
    || Object.keys(search.bool ?? {}).length > 0
    || Object.keys(search.presence ?? {}).length > 0;

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
          bookmarks={bookmarks}
          search={search}
          onSearchChange={onSearchChange}
        />

        <div className="space-y-6">
          <Collapsible
            open={addBookmarkFormOpen}
            onOpenChange={setAddBookmarkFormOpen}
            className="group/add-bookmark rounded-lg border bg-card"
          >
            <CollapsibleTrigger
              className="
                flex w-full items-center justify-between p-4 text-sm font-medium
                hover:text-foreground
              "
            >
              Add Bookmark
              <ChevronDown
                className="
                  size-4 transition-transform
                  group-data-[state=open]/add-bookmark:rotate-180
                "
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <BookmarkForm lockedCategoryId={addFormCategoryId} />
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end gap-4">
            <ColumnsSwitcher pageKey={pageKey} />
            {columns === 2 && (
              <ImageLayoutSwitcher
                layout={imageLayout}
                onLayoutChange={layout => setBookmarkImageLayout(pageKey, layout)}
              />
            )}
            <ImageModeSwitcher pageKey={pageKey} />
          </div>

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
                />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
