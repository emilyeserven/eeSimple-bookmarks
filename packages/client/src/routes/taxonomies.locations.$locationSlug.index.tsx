import type { LocationNode } from "@eesimple/types";

import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";
import { Images, MapPin } from "lucide-react";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { LocationMapSection } from "../components/LocationMapSection";
import { RomanizedLabel } from "../components/RomanizedLabel";
import { useShowLocationAncestorsOnMap } from "../hooks/useAppSettings";
import { useLocationBySlug, useLocationTree } from "../hooks/useLocations";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";
import { findAncestorPath, subtreeIds } from "../lib/tagTree";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
    placeTypes,
  } = useCategoryPageData(tagsForServerQuery(search));

  const {
    location, isLoading: locationLoading,
  } = useLocationBySlug(locationSlug);
  const {
    data: locationTree,
  } = useLocationTree();
  const showAncestorsOnMap = useShowLocationAncestorsOnMap();

  if (locationLoading) {
    return <p className="text-muted-foreground">Loading location…</p>;
  }

  if (!location) {
    return <p className="text-destructive">Location not found.</p>;
  }

  // Include bookmarks tagged with this location or any of its descendants.
  const locationIds = new Set(subtreeIds(location));
  const locationBookmarks = (bookmarks ?? []).filter(b => b.locations.some(l => locationIds.has(l.id)));

  // Ancestor chain (root → parent), stripped of children so only the ancestors themselves plot —
  // otherwise the map would re-plot the whole tree under a root ancestor. Only included when the
  // "Show ancestors on map" preference is on, mirroring `LocationGeneralView`.
  const ancestorPath = locationTree ? findAncestorPath(locationTree, locationSlug) : null;
  const ancestors = (ancestorPath ? ancestorPath.slice(0, -1) : []).map(ancestor => ({
    ...ancestor,
    children: [] as LocationNode[],
  }));
  const mapTree = [
    ...(showAncestorsOnMap ? ancestors : []),
    {
      ...location,
      children: [],
    },
    ...location.children.map(child => ({
      ...child,
      children: [] as LocationNode[],
    })),
  ];

  return (
    <BookmarkSearchView
      header={(
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="flex min-w-0 items-center gap-2 text-2xl font-bold">
              <MapPin className="size-6 shrink-0" />
              <RomanizedLabel
                name={location.name}
                romanized={location.romanizedName}
              />
            </h1>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <Link
                to="/taxonomies/locations/$locationSlug/gallery"
                params={{
                  locationSlug,
                }}
              >
                <Images className="size-4" />
                Gallery
              </Link>
            </Button>
          </div>
          {location.children.length > 0 && (
            <div
              className="
                flex flex-wrap items-center gap-2 text-sm text-muted-foreground
              "
            >
              <span>Sub-locations:</span>
              {location.children.map(child => (
                <SubLocationPill
                  key={child.id}
                  location={child}
                />
              ))}
            </div>
          )}
        </div>
      )}
      afterAddForm={(
        <LocationMapSection
          mapKey={location.id}
          tree={mapTree}
          autoRefreshLocationId={location.id}
          mapClassName="h-80 w-full rounded-lg border"
          showLevels
          scope={{
            kind: "location",
            currentPlaceType: location.placeType,
          }}
        />
      )}
      pageKey={`location:${locationSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      categories={categories ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      authors={authors ?? []}
      placeTypes={placeTypes ?? []}
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

/**
 * A single sub-location chip. When the location has its own children, hovering the pill opens a
 * popover listing its descendant tree (preserving hierarchy), so each pill exposes its own
 * subtree instead of one popover covering every direct child at once.
 */
function SubLocationPill({
  location,
}: { location: LocationNode }) {
  const [open, setOpen] = useState(false);
  const hasChildren = location.children.length > 0;

  const pill = (
    <Link
      to="/taxonomies/locations/$locationSlug"
      params={{
        locationSlug: location.slug,
      }}
      className="
        rounded-full border px-2.5 py-0.5 font-medium
        hover:bg-accent
      "
      onMouseEnter={hasChildren ? () => setOpen(true) : undefined}
      onMouseLeave={hasChildren ? () => setOpen(false) : undefined}
    >
      <RomanizedLabel
        name={location.name}
        romanized={location.romanizedName}
      />
    </Link>
  );

  if (!hasChildren) {
    return pill;
  }

  return (
    <Popover open={open}>
      <PopoverTrigger asChild>{pill}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[500px] w-64 overflow-y-auto"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <LocationChildrenTree locations={location.children} />
      </PopoverContent>
    </Popover>
  );
}

/** Recursively renders a location subtree, indenting each level to preserve its hierarchy. */
function LocationChildrenTree({
  locations,
}: { locations: LocationNode[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {locations.map(child => (
        <li key={child.id}>
          <Link
            to="/taxonomies/locations/$locationSlug"
            params={{
              locationSlug: child.slug,
            }}
            className="hover:underline"
          >
            <RomanizedLabel
              name={child.name}
              romanized={child.romanizedName}
            />
          </Link>
          {child.children.length > 0 && (
            <div className="mt-1 ml-3 border-l pl-2">
              <LocationChildrenTree locations={child.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
