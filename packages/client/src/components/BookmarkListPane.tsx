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
import { useResolveCardDisplay } from "../lib/cardDisplayRules";

import { RowCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useUiStore } from "@/stores/uiStore";

/**
 * Stable empty default for a page with no saved column widths. Returning a fresh `{}` from the
 * zustand selector would make `useSyncExternalStore` see a new snapshot every render and loop
 * ("Maximum update depth exceeded"), so the fallback must be a shared constant.
 */
const EMPTY_COLUMN_SIZING: Record<string, number> = {};

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

/** Right column of the search view: the add form and the matching bookmark grid. */
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
  const deleteBookmark = useDeleteBookmark();
  const viewMode = useViewMode(pageKey);
  const resolveDisplay = useResolveCardDisplay();
  const tableColumnWidths = useUiStore(state => state.tableColumnWidths[pageKey]) ?? EMPTY_COLUMN_SIZING;
  const setTableColumnWidths = useUiStore(state => state.setTableColumnWidths);
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
          <DataTable
            resizable
            columnSizing={tableColumnWidths}
            onColumnSizingChange={widths => setTableColumnWidths(pageKey, widths)}
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
            {visibleBookmarks.map((bookmark) => {
              // Per-card display comes from the prioritized Card Display Rules (merged over the
              // Default rule). Column count stays page-level, so "side" image layout only applies at
              // 1–2 columns.
              const display = resolveDisplay(bookmark);
              return (
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
                    hiddenFields={new Set(display.hiddenCardFields)}
                    imageLeft={(columns === 1 || columns === 2) && display.imageLayout === "side"}
                    imageMode={display.imageMode}
                    imageVisibility={display.imageVisibility}
                    cornerOverlays={display.cornerOverlays}
                    hideWebsiteForYouTube={display.hideWebsiteForYouTube}
                  />
                </RowCard>
              );
            })}
          </div>
        )
        : null}
    </div>
  );
}
