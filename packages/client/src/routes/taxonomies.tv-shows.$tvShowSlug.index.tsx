import { createFileRoute } from "@tanstack/react-router";
import { Tv } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useTvShowBySlug } from "../hooks/useTvShows";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/tv-shows/$tvShowSlug/")({
  validateSearch: validateBookmarkSearch,
  component: TvShowBookmarksPage,
});

function TvShowBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    tvShowSlug,
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
    tvShow, isLoading: tvShowLoading,
  } = useTvShowBySlug(tvShowSlug);

  if (tvShowLoading) {
    return <p className="text-muted-foreground">{t("Loading TV show…")}</p>;
  }

  if (!tvShow) {
    return <p className="text-destructive">{t("TV show not found.")}</p>;
  }

  const tvShowBookmarks = (bookmarks ?? []).filter(b => b.tvShowId === tvShow.id);

  return (
    <BookmarkSearchView
      header={(
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Tv className="size-6 shrink-0" />
          {tvShow.name}
        </h1>
      )}
      pageKey={`tv-show:${tvShowSlug}`}
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
      bookmarks={tvShowBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this TV show yet.")}
      noMatchMessage={t("No bookmarks for this TV show match these filters.")}
    />
  );
}
