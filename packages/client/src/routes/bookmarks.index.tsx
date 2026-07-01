import { createFileRoute } from "@tanstack/react-router";

import { useBookmarksPageData } from "./-bookmarksPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/bookmarks/")({
  validateSearch: validateBookmarkSearch,
  component: BookmarksPage,
});

function BookmarksPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    bookmarks, isLoading, error,
    tagTree,
    customProperties,
    propertyGroups,
    categories,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    authors,
    placeTypes,
  } = useBookmarksPageData(tagsForServerQuery(search));

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
      websites={websites ?? []}
      relationshipTypes={relationshipTypes ?? []}
      authors={authors ?? []}
      placeTypes={placeTypes ?? []}
      bookmarks={bookmarks ?? []}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={isLoading}
      error={error}
      emptyMessage="No bookmarks yet."
      noMatchMessage="No bookmarks match these filters."
    />
  );
}
