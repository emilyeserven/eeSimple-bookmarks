import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { usePodcastBySlug } from "../hooks/usePodcasts";
import { tagsForServerQuery } from "../lib/bookmarkSearch";

interface Props {
  podcastSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery" | "media";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The podcast-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function PodcastListing({
  podcastSlug, activeView, search, onSearchChange,
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
      activeView={activeView}
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
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this podcast yet.")}
      noMatchMessage={t("No bookmarks for this podcast match these filters.")}
    />
  );
}
