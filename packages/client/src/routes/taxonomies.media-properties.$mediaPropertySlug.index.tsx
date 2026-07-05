import { createFileRoute } from "@tanstack/react-router";
import { Library } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useMediaPropertyPageData } from "./-mediaPropertyPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useMediaPropertyBySlug } from "../hooks/useMediaProperties";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";
import { bookmarksForMediaProperty, memberItemIdsByType } from "../lib/mediaPropertyMembership";

export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/")({
  validateSearch: validateBookmarkSearch,
  component: MediaPropertyBookmarksPage,
});

function MediaPropertyBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    mediaPropertySlug,
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
      header={(
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Library className="size-6 shrink-0" />
          {mediaProperty.name}
        </h1>
      )}
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
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks in this media property yet.")}
      noMatchMessage={t("No bookmarks in this media property match these filters.")}
    />
  );
}
