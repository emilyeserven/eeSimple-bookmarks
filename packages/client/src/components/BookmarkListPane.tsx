import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, CustomProperty } from "@eesimple/types";

import { AddBookmarkCollapsible } from "./AddBookmarkCollapsible";
import { BookmarkCardGrid } from "./BookmarkCardGrid";
import { BookmarkTableView } from "./BookmarkTableView";
import { useViewMode } from "../lib/bookmarkColumns";
import { bookmarkMatchesSearch, hasAnyActiveFilter } from "../lib/bookmarkSearch";

interface BookmarkListPaneProps {
  /** Stable listing-page key, used for table column widths and the table view toggle. */
  pageKey: string;
  columns: number;
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

/** Right column of the search view: the add form and the matching bookmarks, as a grid or table. */
export function BookmarkListPane({
  pageKey,
  columns,
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
  const viewMode = useViewMode(pageKey);
  const visibleBookmarks = bookmarks.filter(bookmark => bookmarkMatchesSearch(bookmark, search));
  const hasActiveFilters = hasAnyActiveFilter(search) || textSearchActive;

  return (
    <div className="min-w-0 space-y-6">
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
          <BookmarkTableView
            pageKey={pageKey}
            bookmarks={visibleBookmarks}
            properties={properties}
            categoryId={addFormCategoryId}
          />
        )
        : null}

      {visibleBookmarks.length > 0 && viewMode !== "table"
        ? (
          <BookmarkCardGrid
            bookmarks={visibleBookmarks}
            properties={properties}
            columns={columns}
          />
        )
        : null}
    </div>
  );
}
