import { propertyAppliesToCategory } from "@eesimple/types";
import { Link, createFileRoute } from "@tanstack/react-router";

import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useTagTree } from "../hooks/useTags";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

import { Button } from "@/components/ui/button";
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
    data: categories, isLoading: categoriesLoading,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: bookmarks, isLoading: bookmarksLoading, error,
  } = useBookmarks(search.tag);
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const {
    data: youtubeChannels,
  } = useYouTubeChannels();

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
        <div className="flex items-start justify-between gap-2">
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
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link
              to="/categories/$categorySlug/edit/general"
              params={{
                categorySlug,
              }}
            >
              Edit
            </Link>
          </Button>
        </div>
      )}
      addFormCategoryId={category.id}
      pageKey={`category:${categorySlug}`}
      tree={tagTree ?? []}
      properties={assignedProperties}
      mediaTypes={mediaTypes ?? []}
      youtubeChannels={youtubeChannels ?? []}
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
