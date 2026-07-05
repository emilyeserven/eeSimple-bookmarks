import { createFileRoute } from "@tanstack/react-router";
import { Podcast } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { usePodcastBySlug } from "../hooks/usePodcasts";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/podcasts/$podcastSlug/")({
  validateSearch: validateBookmarkSearch,
  component: PodcastBookmarksPage,
});

function PodcastBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    podcastSlug,
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
    podcast, isLoading: podcastLoading,
  } = usePodcastBySlug(podcastSlug);

  if (podcastLoading) {
    return <p className="text-muted-foreground">{t("Loading podcast…")}</p>;
  }

  if (!podcast) {
    return <p className="text-destructive">{t("Podcast not found.")}</p>;
  }

  const podcastBookmarks = (bookmarks ?? []).filter(b => b.podcastId === podcast.id);

  return (
    <BookmarkSearchView
      header={(
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Podcast className="size-6 shrink-0" />
          {podcast.name}
        </h1>
      )}
      pageKey={`podcast:${podcastSlug}`}
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
      bookmarks={podcastBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this podcast yet.")}
      noMatchMessage={t("No bookmarks for this podcast match these filters.")}
    />
  );
}
