import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";

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
 * passes none to `BookmarkSearchView`. The category scope evaluates server-side alongside the filters.
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
    tagTree,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useCategoryPageData();

  const category = (categories ?? []).find(c => c.slug === categorySlug);

  if (categoriesLoading) {
    return <p className="text-muted-foreground">{t("Loading…")}</p>;
  }

  if (!category) {
    return <p className="text-destructive">{t("Category not found.")}</p>;
  }

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
      scope={{
        kind: "category",
        id: category.id,
      }}
      search={search}
      onSearchChange={onSearchChange}
      emptyMessage={t("No bookmarks in this category yet.")}
      noMatchMessage={t("No bookmarks in this category match these filters.")}
    />
  );
}
