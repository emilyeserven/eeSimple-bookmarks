import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, CustomProperty, TagNode } from "@eesimple/types";
import type { ReactNode } from "react";

import { useState } from "react";

import { BookmarkCard } from "./BookmarkCard";
import { BookmarkForm } from "./BookmarkForm";
import { FilterSidebar } from "./FilterSidebar";
import { useDeleteBookmark } from "../hooks/useBookmarks";
import { bookmarkMatchesSearch } from "../lib/bookmarkSearch";

interface BookmarkSearchViewProps {
  /** Page heading area rendered above the two-column body. */
  header: ReactNode;
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
          <BookmarkForm />

          <div className="space-y-3">
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
                  <BookmarkForm
                    key={bookmark.id}
                    bookmark={bookmark}
                    onDone={() => setEditingId(null)}
                  />
                )
                : (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    properties={properties}
                    onEdit={id => setEditingId(id)}
                    onDelete={id => deleteBookmark.mutate(id)}
                  />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
