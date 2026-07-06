import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useTvShowBySlug } from "../hooks/useTvShows";
import { tagsForServerQuery } from "../lib/bookmarkSearch";

interface Props {
  tvShowSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery" | "media";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The TV-show-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function TvShowListing({
  tvShowSlug, activeView, search, onSearchChange,
}: Props) {
  const {
    t,
  } = useTranslation();

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
      activeView={activeView}
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
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this TV show yet.")}
      noMatchMessage={t("No bookmarks for this TV show match these filters.")}
    />
  );
}
