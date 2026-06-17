import { createFileRoute } from "@tanstack/react-router";

import { BookmarkCard } from "../components/BookmarkCard";
import { BookmarkForm } from "../components/BookmarkForm";
import { TagTreeFilter } from "../components/TagTreeFilter";
import { useBookmarks, useDeleteBookmark } from "../hooks/useBookmarks";
import { useTagTree } from "../hooks/useTags";
import { useUiStore } from "../stores/uiStore";

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
  const deleteBookmark = useDeleteBookmark();
  const showFavoritesOnly = useUiStore(state => state.showFavoritesOnly);
  const toggleShowFavoritesOnly = useUiStore(state => state.toggleShowFavoritesOnly);

  const visibleBookmarks = (bookmarks ?? []).filter(bookmark => !showFavoritesOnly || bookmark.favorite);

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={toggleShowFavoritesOnly}
          />
          Show favorites only
        </label>
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

      <BookmarkForm />

      <div className="space-y-3">
        {isLoading ? <p className="text-slate-500">Loading bookmarks…</p> : null}
        {error ? <p className="text-red-600">{error.message}</p> : null}
        {!isLoading && visibleBookmarks.length === 0
          ? (
            <p
              className="text-slate-500"
            >No bookmarks yet. Add one above.
            </p>
          )
          : null}
        {visibleBookmarks.map(bookmark => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onDelete={id => deleteBookmark.mutate(id)}
          />
        ))}
      </div>
    </section>
  );
}
