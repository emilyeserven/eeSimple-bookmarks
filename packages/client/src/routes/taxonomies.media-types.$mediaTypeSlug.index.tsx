import { createFileRoute } from "@tanstack/react-router";
import { Film } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/")({
  validateSearch: validateBookmarkSearch,
  component: MediaTypeBookmarksPage,
});

function MediaTypeBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    mediaTypeSlug,
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
    youtubeChannels,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useCategoryPageData(tagsForServerQuery(search));

  const {
    mediaType, isLoading: mediaTypeLoading,
  } = useMediaTypeBySlug(mediaTypeSlug);

  if (mediaTypeLoading) {
    return <p className="text-muted-foreground">{t("Loading media type…")}</p>;
  }

  if (!mediaType) {
    return <p className="text-destructive">{t("Media type not found.")}</p>;
  }

  // The media-type filter is omitted below since this listing is already scoped to one media type.
  const mediaTypeBookmarks = (bookmarks ?? []).filter(b => b.mediaType?.id === mediaType.id);

  return (
    <BookmarkSearchView
      header={(
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Film className="size-6 shrink-0" />
            {mediaType.name}
          </h1>
        </div>
      )}
      pageKey={`media-type:${mediaTypeSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      categories={categories ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      genreMoods={genreMoods ?? []}
      bookmarks={mediaTypeBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks of this media type yet.")}
      noMatchMessage={t("No bookmarks of this media type match these filters.")}
    />
  );
}
