import { createFileRoute } from "@tanstack/react-router";
import { Music } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useTrackBySlug } from "../hooks/useTracks";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/tracks/$trackSlug/")({
  validateSearch: validateBookmarkSearch,
  component: TrackBookmarksPage,
});

function TrackBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    trackSlug,
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
    track, isLoading: trackLoading,
  } = useTrackBySlug(trackSlug);

  if (trackLoading) {
    return <p className="text-muted-foreground">{t("Loading track…")}</p>;
  }

  if (!track) {
    return <p className="text-destructive">{t("Track not found.")}</p>;
  }

  const trackBookmarks = (bookmarks ?? []).filter(b => b.trackId === track.id);

  return (
    <BookmarkSearchView
      header={(
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Music className="size-6 shrink-0" />
          {track.name}
        </h1>
      )}
      pageKey={`track:${trackSlug}`}
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
      bookmarks={trackBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this track yet.")}
      noMatchMessage={t("No bookmarks for this track match these filters.")}
    />
  );
}
