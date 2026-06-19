import type { BookmarkImageVisibility } from "../lib/bookmarkColumns";
import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, CustomProperty } from "@eesimple/types";

import { AddBookmarkCollapsible } from "./AddBookmarkCollapsible";
import { BookmarkCard } from "./BookmarkCard";
import { useDeleteBookmark } from "../hooks/useBookmarks";
import { COLUMN_CLASS } from "../lib/bookmarkColumns";
import { bookmarkMatchesSearch, hasAnyActiveFilter } from "../lib/bookmarkSearch";

import { RowCard } from "@/components/ui/card";

interface BookmarkListPaneProps {
  columns: number;
  imageVisibility: BookmarkImageVisibility;
  imageLeft: boolean;
  imageMode: boolean;
  bookmarks: Bookmark[];
  properties: CustomProperty[];
  search: BookmarkSearch;
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
  noMatchMessage: string;
  addFormCategoryId?: string;
}

/** Right column of the search view: the add form and the matching bookmark grid. */
export function BookmarkListPane({
  columns,
  imageVisibility,
  imageLeft,
  imageMode,
  bookmarks,
  properties,
  search,
  isLoading,
  error,
  emptyMessage,
  noMatchMessage,
  addFormCategoryId,
}: BookmarkListPaneProps) {
  const deleteBookmark = useDeleteBookmark();
  const visibleBookmarks = bookmarks.filter(bookmark => bookmarkMatchesSearch(bookmark, search));
  const hasActiveFilters = hasAnyActiveFilter(search);

  return (
    <div className="space-y-6">
      <AddBookmarkCollapsible lockedCategoryId={addFormCategoryId} />

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
          <RowCard
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
          </RowCard>
        ))}
      </div>
    </div>
  );
}
