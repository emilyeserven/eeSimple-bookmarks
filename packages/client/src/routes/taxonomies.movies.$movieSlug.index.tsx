import { createFileRoute } from "@tanstack/react-router";
import { Film } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useMovieBySlug } from "../hooks/useMovies";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/movies/$movieSlug/")({
  validateSearch: validateBookmarkSearch,
  component: MovieBookmarksPage,
});

function MovieBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    movieSlug,
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
    movie, isLoading: movieLoading,
  } = useMovieBySlug(movieSlug);

  if (movieLoading) {
    return <p className="text-muted-foreground">{t("Loading movie…")}</p>;
  }

  if (!movie) {
    return <p className="text-destructive">{t("Movie not found.")}</p>;
  }

  const movieBookmarks = (bookmarks ?? []).filter(b => b.movieId === movie.id);

  return (
    <BookmarkSearchView
      header={(
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Film className="size-6 shrink-0" />
          {movie.name}
        </h1>
      )}
      pageKey={`movie:${movieSlug}`}
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
      bookmarks={movieBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this movie yet.")}
      noMatchMessage={t("No bookmarks for this movie match these filters.")}
    />
  );
}
