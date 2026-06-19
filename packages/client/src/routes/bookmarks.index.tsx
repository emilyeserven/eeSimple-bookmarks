import { createFileRoute } from "@tanstack/react-router";

import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { usePropertyGroups } from "../hooks/usePropertyGroups";
import { useTagTree } from "../hooks/useTags";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
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
  } = useBookmarks(search.tags);
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: customProperties,
  } = useCustomProperties();
  const {
    data: propertyGroups,
  } = usePropertyGroups();
  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const {
    data: youtubeChannels,
  } = useYouTubeChannels();

  return (
    <BookmarkSearchView
      header={<h1 className="text-2xl font-bold">Bookmarks</h1>}
      pageKey="bookmarks"
      tree={tagTree ?? []}
      properties={customProperties ?? []}
      propertyGroups={propertyGroups ?? []}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      youtubeChannels={youtubeChannels ?? []}
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
