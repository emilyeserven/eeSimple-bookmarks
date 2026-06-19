import type { BookmarkImageVisibility } from "../lib/bookmarkColumns";
import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, CustomProperty } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { AddBookmarkCollapsible } from "./AddBookmarkCollapsible";
import { BookmarkCard } from "./BookmarkCard";
import { useBookmarkTableColumns } from "./tables/bookmarkColumns";
import { useTableRowNav } from "./tables/useTableRowNav";
import { useDeleteBookmark } from "../hooks/useBookmarks";
import { COLUMN_CLASS, useViewMode } from "../lib/bookmarkColumns";
import { bookmarkMatchesSearch, hasAnyActiveFilter } from "../lib/bookmarkSearch";

import { RowCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

interface BookmarkListPaneProps {
  /** Stable listing-page key, so cards can honor that page's Card Options field toggles. */
  pageKey: string;
  columns: number;
  imageVisibility: BookmarkImageVisibility;
  imageLeft: boolean;
  imageMode: string;
  bookmarks: Bookmark[];
  properties: CustomProperty[];
  search: BookmarkSearch;
  /** True when the header text search is non-empty, so the "no results" message is correct. */
  textSearchActive?: boolean;
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
  noMatchMessage: string;
  addFormCategoryId?: string;
}

/** Right column of the search view: the add form and the matching bookmark grid. */
export function BookmarkListPane({
  pageKey,
  columns,
  imageVisibility,
  imageLeft,
  imageMode,
  bookmarks,
  properties,
  search,
  textSearchActive = false,
  isLoading,
  error,
  emptyMessage,
  noMatchMessage,
  addFormCategoryId,
}: BookmarkListPaneProps) {
  const deleteBookmark = useDeleteBookmark();
  const viewMode = useViewMode(pageKey);
  const tableColumns = useBookmarkTableColumns({
    properties,
    pageKey,
    categoryId: addFormCategoryId,
  });
  const rowNav = useTableRowNav();
  const navigate = useNavigate();
  const visibleBookmarks = bookmarks.filter(bookmark => bookmarkMatchesSearch(bookmark, search));
  const hasActiveFilters = hasAnyActiveFilter(search) || textSearchActive;

  return (
    <div className="space-y-6">
      <AddBookmarkCollapsible lockedCategoryId={addFormCategoryId} />

      {isLoading ? <p className="text-muted-foreground">Loading bookmarks…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && visibleBookmarks.length === 0
        ? (
          <p className="text-muted-foreground">
            {hasActiveFilters ? noMatchMessage : emptyMessage}
          </p>
        )
        : null}

      {visibleBookmarks.length > 0 && viewMode === "table"
        ? (
          <DataTable
            columns={tableColumns}
            data={visibleBookmarks}
            sortable
            onRowClick={(bookmark, event) =>
              rowNav(event, "bookmark", bookmark.id, () => {
                void navigate({
                  to: "/bookmarks/$bookmarkId",
                  params: {
                    bookmarkId: bookmark.id,
                  },
                });
              })}
          />
        )
        : null}

      {visibleBookmarks.length > 0 && viewMode !== "table"
        ? (
          <div
            className={`
              grid gap-3
              ${COLUMN_CLASS[columns]}
            `}
          >
            {visibleBookmarks.map(bookmark => (
              <RowCard
                key={bookmark.id}
                className="p-4"
                data-bookmark-card-sample
              >
                <BookmarkCard
                  pageKey={pageKey}
                  bookmark={bookmark}
                  properties={properties}
                  onDelete={id => deleteBookmark.mutate(id)}
                  imageLeft={imageLeft}
                  imageMode={imageMode}
                  imageVisibility={imageVisibility}
                />
              </RowCard>
            ))}
          </div>
        )
        : null}
    </div>
  );
}
