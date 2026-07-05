import { createFileRoute } from "@tanstack/react-router";
import { Disc3 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useAlbumBySlug } from "../hooks/useAlbums";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/albums/$albumSlug/")({
  validateSearch: validateBookmarkSearch,
  component: AlbumBookmarksPage,
});

function AlbumBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    albumSlug,
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
    album, isLoading: albumLoading,
  } = useAlbumBySlug(albumSlug);

  if (albumLoading) {
    return <p className="text-muted-foreground">{t("Loading album…")}</p>;
  }

  if (!album) {
    return <p className="text-destructive">{t("Album not found.")}</p>;
  }

  const albumBookmarks = (bookmarks ?? []).filter(b => b.albumId === album.id);

  return (
    <BookmarkSearchView
      header={(
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Disc3 className="size-6 shrink-0" />
          {album.name}
        </h1>
      )}
      pageKey={`album:${albumSlug}`}
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
      bookmarks={albumBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this album yet.")}
      noMatchMessage={t("No bookmarks for this album match these filters.")}
    />
  );
}
