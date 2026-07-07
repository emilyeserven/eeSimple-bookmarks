import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useMediaPropertyPageData } from "./-mediaPropertyPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useMediaPropertyBySlug } from "../hooks/useMediaProperties";
import { tagsForServerQuery } from "../lib/bookmarkSearch";
import { bookmarksForMediaProperty, memberItemIdsByType } from "../lib/mediaPropertyMembership";

interface Props {
  mediaPropertySlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The media-property-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` /
 * `_hub.media` routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub`
 * layout, so this passes none to `BookmarkSearchView`.
 */
export function MediaPropertyListing({
  mediaPropertySlug, activeView, search, onSearchChange,
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
    mediaLists,
  } = useMediaPropertyPageData(tagsForServerQuery(search));

  const {
    mediaProperty, isLoading: mediaPropertyLoading,
  } = useMediaPropertyBySlug(mediaPropertySlug);

  if (mediaPropertyLoading) {
    return <p className="text-muted-foreground">{t("Loading media property…")}</p>;
  }

  if (!mediaProperty) {
    return <p className="text-destructive">{t("Media property not found.")}</p>;
  }

  const members = memberItemIdsByType(mediaProperty.id, mediaLists);
  const mediaPropertyBookmarks = bookmarksForMediaProperty(bookmarks ?? [], members);

  return (
    <BookmarkSearchView
      activeView={activeView}
      pageKey={`media-property:${mediaPropertySlug}`}
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
      bookmarks={mediaPropertyBookmarks}
      search={search}
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks in this media property yet.")}
      noMatchMessage={t("No bookmarks in this media property match these filters.")}
    />
  );
}
