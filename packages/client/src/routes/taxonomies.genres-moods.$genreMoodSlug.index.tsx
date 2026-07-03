import { createFileRoute } from "@tanstack/react-router";
import { Drama } from "lucide-react";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useGenreMoodBySlug } from "../hooks/useGenreMoods";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/")({
  validateSearch: validateBookmarkSearch,
  component: GenreMoodBookmarksPage,
});

function GenreMoodBookmarksPage() {
  const {
    genreMoodSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    categories,
    properties,
    propertyGroups,
    bookmarks,
    bookmarksLoading,
    error,
    tagTree,
    youtubeChannels,
    relationshipTypes,
    people,
    placeTypes,
  } = useCategoryPageData(tagsForServerQuery(search));

  const {
    genreMood, isLoading: genreMoodLoading,
  } = useGenreMoodBySlug(genreMoodSlug);

  if (genreMoodLoading) {
    return <p className="text-muted-foreground">Loading entry…</p>;
  }

  if (!genreMood) {
    return <p className="text-destructive">Entry not found.</p>;
  }

  const genreMoodBookmarks = (bookmarks ?? []).filter(b =>
    b.genreMoods?.some(entry => entry.id === genreMood.id));

  return (
    <BookmarkSearchView
      header={(
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Drama className="size-6 shrink-0" />
            {genreMood.name}
          </h1>
        </div>
      )}
      pageKey={`genre-mood:${genreMoodSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      categories={categories ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      bookmarks={genreMoodBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage="No bookmarks with this entry yet."
      noMatchMessage="No bookmarks with this entry match these filters."
    />
  );
}
