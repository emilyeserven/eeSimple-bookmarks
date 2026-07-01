import { createFileRoute } from "@tanstack/react-router";
import { Folder } from "lucide-react";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/categories/$categorySlug/")({
  validateSearch: validateBookmarkSearch,
  component: CategoryBookmarksPage,
});

function CategoryBookmarksPage() {
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
    authors,
    placeTypes,
  } = useCategoryPageData(tagsForServerQuery(search));

  const category = (categories ?? []).find(c => c.slug === categorySlug);

  if (categoriesLoading || bookmarksLoading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (!category) {
    return <p className="text-destructive">Category not found.</p>;
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
      authors={authors ?? []}
      placeTypes={placeTypes ?? []}
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
      emptyMessage="No bookmarks in this category yet."
      noMatchMessage="No bookmarks in this category match these filters."
    />
  );
}
