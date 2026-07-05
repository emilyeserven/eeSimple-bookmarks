import { createFileRoute } from "@tanstack/react-router";
import { Folder } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/categories/$categorySlug/")({
  validateSearch: validateBookmarkSearch,
  component: CategoryBookmarksPage,
});

function CategoryBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    categorySlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    categories,
    categoriesLoading,
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
      header={(
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Folder className="size-6 shrink-0" />
          {category.name}
        </h1>
      )}
      pageKey={`category:${categorySlug}`}
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
      bookmarks={categoryBookmarks}
      search={search}
      onSearchChange={next =>
        navigate({
          search: next,
          replace: true,
          resetScroll: false,
        })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks in this category yet.")}
      noMatchMessage={t("No bookmarks in this category match these filters.")}
    />
  );
}
