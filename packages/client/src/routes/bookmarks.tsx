import { createFileRoute } from "@tanstack/react-router";

import { BookmarkCard } from "../components/BookmarkCard";
import { BookmarkForm } from "../components/BookmarkForm";
import { TagTreeFilter } from "../components/TagTreeFilter";
import { useBookmarks, useDeleteBookmark } from "../hooks/useBookmarks";
import { useTagTree } from "../hooks/useTags";
import { useUiStore } from "../stores/uiStore";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
        <div className="flex items-center gap-2">
          <Checkbox
            id="favorites-only"
            checked={showFavoritesOnly}
            onCheckedChange={toggleShowFavoritesOnly}
          />
          <Label
            htmlFor="favorites-only"
            className="text-muted-foreground"
          >
            Show favorites only
          </Label>
        </div>
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
