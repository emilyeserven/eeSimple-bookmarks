import { createFileRoute } from "@tanstack/react-router";

import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/bookmarks/")({
  validateSearch: validateBookmarkSearch,
  component: BookmarksPage,
});

function BookmarksPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    data: bookmarks, isLoading, error,
  } = useBookmarks(search.tag);
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: customProperties,
  } = useCustomProperties();

  return (
    <BookmarkSearchView
      header={<h1 className="text-2xl font-bold">Bookmarks</h1>}
      pageKey="bookmarks"
      tree={tagTree ?? []}
      properties={customProperties ?? []}
      bookmarks={bookmarks ?? []}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
      })}
      isLoading={isLoading}
      error={error}
      emptyMessage="No bookmarks yet."
      noMatchMessage="No bookmarks match these filters."
    />
  );
}
