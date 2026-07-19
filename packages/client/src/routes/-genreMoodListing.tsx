import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useGenreMoodBySlug } from "../hooks/useGenreMoods";

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
    tagTree,
    youtubeChannels,
    relationshipTypes,
    people,
    placeTypes,
  } = useCategoryPageData();

  const {
    genreMood, isLoading: genreMoodLoading,
  } = useGenreMoodBySlug(genreMoodSlug);

  if (genreMoodLoading) {
    return <p className="text-muted-foreground">{t("Loading entry…")}</p>;
  }

  if (!genreMood) {
    return <p className="text-destructive">{t("Entry not found.")}</p>;
  }

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
      scope={{
        kind: "genreMood",
        id: genreMood.id,
      }}
      search={search}
      onSearchChange={onSearchChange}
      emptyMessage={t("No bookmarks with this entry yet.")}
      noMatchMessage={t("No bookmarks with this entry match these filters.")}
    />
  );
}
