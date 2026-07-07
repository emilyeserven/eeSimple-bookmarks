import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useTrackBySlug } from "../hooks/useTracks";
import { tagsForServerQuery } from "../lib/bookmarkSearch";

interface Props {
  trackSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The track-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function TrackListing({
  trackSlug, activeView, search, onSearchChange,
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
      activeView={activeView}
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
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this track yet.")}
      noMatchMessage={t("No bookmarks for this track match these filters.")}
    />
  );
}
