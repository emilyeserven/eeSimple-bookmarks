import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";

interface Props {
  mediaTypeSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The media-type-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function MediaTypeListing({
  mediaTypeSlug, activeView, search, onSearchChange,
}: Props) {
  const {
    t,
  } = useTranslation();

  const {
    categories,
    properties,
    tagTree,
    youtubeChannels,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useCategoryPageData();

  const {
    mediaType, isLoading: mediaTypeLoading,
  } = useMediaTypeBySlug(mediaTypeSlug);

  if (mediaTypeLoading) {
    return <p className="text-muted-foreground">{t("Loading media type…")}</p>;
  }

  if (!mediaType) {
    return <p className="text-destructive">{t("Media type not found.")}</p>;
  }

  return (
    <BookmarkSearchView
      activeView={activeView}
      pageKey={`media-type:${mediaTypeSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      categories={categories ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      genreMoods={genreMoods ?? []}
      scope={{
        kind: "mediaType",
        id: mediaType.id,
      }}
      search={search}
      onSearchChange={onSearchChange}
      emptyMessage={t("No bookmarks of this media type yet.")}
      noMatchMessage={t("No bookmarks of this media type match these filters.")}
    />
  );
}
