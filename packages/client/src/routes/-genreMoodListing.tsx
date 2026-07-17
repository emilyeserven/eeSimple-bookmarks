import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useGenreMoodBySlug } from "../hooks/useGenreMoods";
import { tagsForServerQuery } from "../lib/bookmarkSearch";
import { subtreeIds } from "../lib/tagTree";

interface Props {
  genreMoodSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The genre/mood-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function GenreMoodListing({
  genreMoodSlug, activeView, search, onSearchChange,
}: Props) {
  const {
    t,
  } = useTranslation();

  const {
    categories,
    properties,
    bookmarks,
    bookmarksLoading,
    error,
    tagTree,
    youtubeChannels,
    relationshipTypes,
    people,
    placeTypes,
  } = useCategoryPageData(tagsForServerQuery(search));

  const {
    genreMood, isLoading: genreMoodLoading,
  } = useGenreMoodBySlug(genreMoodSlug);

  if (genreMoodLoading) {
    return <p className="text-muted-foreground">{t("Loading entry…")}</p>;
  }

  if (!genreMood) {
    return <p className="text-destructive">{t("Entry not found.")}</p>;
  }

  // Include bookmarks carrying this genre/mood or any of its descendants.
  const genreMoodIds = new Set(subtreeIds(genreMood));
  const genreMoodBookmarks = (bookmarks ?? []).filter(b =>
    b.genreMoods?.some(entry => genreMoodIds.has(entry.id)));

  return (
    <BookmarkSearchView
      activeView={activeView}
      pageKey={`genre-mood:${genreMoodSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      categories={categories ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      bookmarks={genreMoodBookmarks}
      search={search}
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks with this entry yet.")}
      noMatchMessage={t("No bookmarks with this entry match these filters.")}
    />
  );
}
