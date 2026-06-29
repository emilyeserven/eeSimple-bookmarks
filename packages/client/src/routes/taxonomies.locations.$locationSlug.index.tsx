import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { RomanizedLabel } from "../components/RomanizedLabel";
import { useLocationBySlug } from "../hooks/useLocations";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";
import { subtreeIds } from "../lib/tagTree";

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

  // Include bookmarks tagged with this location or any of its descendants.
  const locationIds = new Set(subtreeIds(location));
  const locationBookmarks = (bookmarks ?? []).filter(b => b.locations.some(l => locationIds.has(l.id)));

  return (
    <BookmarkSearchView
      header={(
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MapPin className="size-6 shrink-0" />
            <RomanizedLabel
              name={location.name}
              romanized={location.romanizedName}
            />
          </h1>
          {location.children.length > 0 && (
            <div
              className="
                flex flex-wrap items-center gap-2 text-sm text-muted-foreground
              "
            >
              <span>Sub-locations:</span>
              {location.children.map(child => (
                <Link
                  key={child.id}
                  to="/taxonomies/locations/$locationSlug"
                  params={{
                    locationSlug: child.slug,
                  }}
                  className="
                    rounded-full border px-2.5 py-0.5 font-medium
                    hover:bg-accent
                  "
                >
                  <RomanizedLabel
                    name={child.name}
                    romanized={child.romanizedName}
                  />
                </Link>
              ))}
            </div>
          )}
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
