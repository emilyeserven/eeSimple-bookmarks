import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, CustomProperty, TagNode } from "@eesimple/types";
import type { ReactNode } from "react";

import { useState } from "react";

import { BookmarkCard } from "./BookmarkCard";
import { BookmarkForm } from "./BookmarkForm";
import { ColumnsSwitcher } from "./ColumnsSwitcher";
import { FilterSidebar } from "./FilterSidebar";
import { useDeleteBookmark } from "../hooks/useBookmarks";
import { COLUMN_CLASS, useBookmarkColumns } from "../lib/bookmarkColumns";
import { bookmarkMatchesSearch } from "../lib/bookmarkSearch";

import { Card } from "@/components/ui/card";

interface BookmarkSearchViewProps {
  /** Page heading area rendered above the two-column body. */
  header: ReactNode;
  /** Stable key identifying the page, so each listing remembers its own column count. */
  pageKey: string;
  tree: TagNode[];
  /** Properties offered as filters and used to render bookmark cards. */
  properties: CustomProperty[];
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
  bookmarks,
  search,
  onSearchChange,
  isLoading,
  error,
  emptyMessage,
  noMatchMessage,
}: BookmarkSearchViewProps) {
  const deleteBookmark = useDeleteBookmark();
  const [editingId, setEditingId] = useState<string | null>(null);
  const columns = useBookmarkColumns(pageKey);

  const visibleBookmarks = bookmarks.filter(bookmark => bookmarkMatchesSearch(bookmark, search));
  const hasActiveFilters = search.tag !== undefined
    || Object.keys(search.num ?? {}).length > 0
    || Object.keys(search.bool ?? {}).length > 0;

  return (
    <section className="space-y-8">
      {header}

      <div
        className="
          grid gap-8
          lg:grid-cols-[16rem_1fr]
        "
      >
        <FilterSidebar
          tree={tree}
          properties={properties}
          bookmarks={bookmarks}
          search={search}
          onSearchChange={onSearchChange}
        />

        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <BookmarkForm />
          </div>

          <div className="flex justify-end">
            <ColumnsSwitcher pageKey={pageKey} />
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
            {visibleBookmarks.map(bookmark =>
              editingId === bookmark.id
                ? (
                  <div
                    key={bookmark.id}
                    className="rounded-lg border bg-card p-4"
                  >
                    <BookmarkForm
                      bookmark={bookmark}
                      onDone={() => setEditingId(null)}
                    />
                  </div>
                )
                : (
                  <Card
                    key={bookmark.id}
                    className="p-4"
                  >
                    <BookmarkCard
                      bookmark={bookmark}
                      properties={properties}
                      onEdit={id => setEditingId(id)}
                      onDelete={id => deleteBookmark.mutate(id)}
                    />
                  </Card>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
