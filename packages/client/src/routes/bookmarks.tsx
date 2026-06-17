import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { BookmarkCard } from "../components/BookmarkCard";
import { BookmarkForm } from "../components/BookmarkForm";
import { CustomPropertyFilters } from "../components/CustomPropertyFilters";
import { TagTreeFilter } from "../components/TagTreeFilter";
import { useBookmarks, useDeleteBookmark } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useCustomPropertyFilters } from "../hooks/useCustomPropertyFilters";
import { useTagTree } from "../hooks/useTags";

interface BookmarksSearch {
  tag?: string;
}

export const Route = createFileRoute("/bookmarks")({
  validateSearch: (search: Record<string, unknown>): BookmarksSearch =>
    (typeof search.tag === "string"
      ? {
        tag: search.tag,
      }
      : {}),
  component: BookmarksPage,
});

function BookmarksPage() {
  const {
    tag,
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    data: bookmarks, isLoading, error,
  } = useBookmarks(tag);
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: customProperties,
  } = useCustomProperties();
  const deleteBookmark = useDeleteBookmark();
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    onNumberFilterChange, onBooleanFilterChange, matches,
  } = useCustomPropertyFilters();

  const allBookmarks = bookmarks ?? [];
  const visibleBookmarks = allBookmarks.filter(matches);

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
      </div>

      <TagTreeFilter
        tree={tagTree ?? []}
        activeId={tag}
        onSelect={nextTag => navigate({
          search: nextTag
            ? {
              tag: nextTag,
            }
            : {},
        })}
      />

      <CustomPropertyFilters
        properties={customProperties ?? []}
        bookmarks={allBookmarks}
        onNumberFilterChange={onNumberFilterChange}
        onBooleanFilterChange={onBooleanFilterChange}
      />

      <BookmarkForm />

      <div className="space-y-3">
        {isLoading ? <p className="text-muted-foreground">Loading bookmarks…</p> : null}
        {error ? <p className="text-destructive">{error.message}</p> : null}
        {!isLoading && visibleBookmarks.length === 0
          ? (
            <p
              className="text-muted-foreground"
            >No bookmarks yet. Add one above.
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
                properties={customProperties ?? []}
                onEdit={id => setEditingId(id)}
                onDelete={id => deleteBookmark.mutate(id)}
              />
            ))}
      </div>
    </section>
  );
}
