import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useLocationBySlug } from "../hooks/useLocations";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/locations/$locationSlug/")({
  validateSearch: validateBookmarkSearch,
  component: LocationBookmarksPage,
});

function LocationBookmarksPage() {
  const {
    locationSlug,
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
    youtubeChannels,
    relationshipTypes,
    authors,
  } = useCategoryPageData(tagsForServerQuery(search));

  const {
    location, isLoading: locationLoading,
  } = useLocationBySlug(locationSlug);

  if (locationLoading) {
    return <p className="text-muted-foreground">Loading location…</p>;
  }

  if (!location) {
    return <p className="text-destructive">Location not found.</p>;
  }

  const locationBookmarks = (bookmarks ?? []).filter(b => b.locations.some(l => l.id === location.id));

  return (
    <BookmarkSearchView
      header={(
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MapPin className="size-6 shrink-0" />
            {location.name}
          </h1>
        </div>
      )}
      pageKey={`location:${locationSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      categories={categories ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      authors={authors ?? []}
      bookmarks={locationBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage="No bookmarks for this location yet."
      noMatchMessage="No bookmarks for this location match these filters."
    />
  );
}
