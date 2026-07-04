import { createFileRoute } from "@tanstack/react-router";
import { Tv2 } from "lucide-react";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useEpisodeBySlug } from "../hooks/useEpisodes";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/episodes/$episodeSlug/")({
  validateSearch: validateBookmarkSearch,
  component: EpisodeBookmarksPage,
});

function EpisodeBookmarksPage() {
  const {
    episodeSlug,
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
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useCategoryPageData(tagsForServerQuery(search));

  const {
    episode, isLoading: episodeLoading,
  } = useEpisodeBySlug(episodeSlug);

  if (episodeLoading) {
    return <p className="text-muted-foreground">Loading episode…</p>;
  }

  if (!episode) {
    return <p className="text-destructive">Episode not found.</p>;
  }

  const episodeBookmarks = (bookmarks ?? []).filter(b => b.episodeId === episode.id);

  return (
    <BookmarkSearchView
      header={(
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Tv2 className="size-6 shrink-0" />
          {episode.name}
        </h1>
      )}
      pageKey={`episode:${episodeSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      youtubeChannels={youtubeChannels ?? []}
      websites={websites ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      genreMoods={genreMoods ?? []}
      bookmarks={episodeBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage="No bookmarks for this episode yet."
      noMatchMessage="No bookmarks for this episode match these filters."
    />
  );
}
