import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { tagsForServerQuery } from "../lib/bookmarkSearch";

interface Props {
  categorySlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The category-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function CategoryListing({
  categorySlug, activeView, search, onSearchChange,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    categories,
    categoriesLoading,
    properties,
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

  const category = (categories ?? []).find(c => c.slug === categorySlug);

  if (categoriesLoading || bookmarksLoading) {
    return <p className="text-muted-foreground">{t("Loading…")}</p>;
  }

  if (!category) {
    return <p className="text-destructive">{t("Category not found.")}</p>;
  }

  const categoryBookmarks = (bookmarks ?? []).filter(
    b => b.categoryId === category.id,
  );

  return (
    <BookmarkSearchView
      activeView={activeView}
      pageKey={`category:${categorySlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      youtubeChannels={youtubeChannels ?? []}
      websites={websites ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      genreMoods={genreMoods ?? []}
      bookmarks={categoryBookmarks}
      search={search}
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks in this category yet.")}
      noMatchMessage={t("No bookmarks in this category match these filters.")}
    />
  );
}
