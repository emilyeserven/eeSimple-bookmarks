import { propertyAppliesToCategory } from "@eesimple/types";
import { createFileRoute } from "@tanstack/react-router";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

import { CategoryIcon } from "@/lib/icons";

export const Route = createFileRoute("/categories/$categorySlug/")({
  validateSearch: validateBookmarkSearch,
  component: CategoryPage,
});

function CategoryPage() {
  const {
    categorySlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    categories, categoriesLoading,
    properties,
    propertyGroups,
    bookmarks, bookmarksLoading, error,
    tagTree,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    authors,
  } = useCategoryPageData(search.tags);

  const category = (categories ?? []).find(item => item.slug === categorySlug);

  if (categoriesLoading) {
    return <p className="text-muted-foreground">Loading category…</p>;
  }

  if (!category) {
    return <p className="text-destructive">Category not found.</p>;
  }

  // Only this category's bookmarks, and only its assigned properties as filters/columns.
  const categoryBookmarks = (bookmarks ?? []).filter(bookmark =>
    bookmark.categoryId === category.id);
  const assignedProperties = (properties ?? []).filter(property =>
    propertyAppliesToCategory(property, category.id));

  return (
    <BookmarkSearchView
      header={(
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CategoryIcon
              name={category.icon}
              className="size-6"
            />
            {category.name}
          </h1>
          {category.description
            ? <p className="text-sm text-muted-foreground">{category.description}</p>
            : null}
        </div>
      )}
      addFormCategoryId={category.id}
      pageKey={`category:${categorySlug}`}
      tree={tagTree ?? []}
      properties={assignedProperties}
      propertyGroups={propertyGroups ?? []}
      mediaTypes={mediaTypes ?? []}
      youtubeChannels={youtubeChannels ?? []}
      websites={websites ?? []}
      relationshipTypes={relationshipTypes ?? []}
      authors={authors ?? []}
      bookmarks={categoryBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage="No bookmarks in this category yet."
      noMatchMessage="No bookmarks in this category match these filters."
    />
  );
}
