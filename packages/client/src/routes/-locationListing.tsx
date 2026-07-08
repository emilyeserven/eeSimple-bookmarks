import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { MapAncestryDebug } from "../lib/locationMapDebug";
import type { LocationNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { LocationMapSection } from "../components/LocationMapSection";
import { useLocationBySlug, useLocationTree } from "../hooks/useLocations";
import { tagsForServerQuery } from "../lib/bookmarkSearch";
import { findAncestorPath, flattenTree, subtreeIds } from "../lib/tagTree";

interface Props {
  locationSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The location-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`; the map (with the ancestor/child tree) rides in `afterAddForm`.
 */
export function LocationListing({
  locationSlug, activeView, search, onSearchChange,
}: Props) {
  const {
    t,
  } = useTranslation();

  const {
    categories,
    properties,
    bookmarks,
    bookmarksLoading,
    error,
    tagTree,
    youtubeChannels,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useCategoryPageData(tagsForServerQuery(search));

  const {
    location, isLoading: locationLoading,
  } = useLocationBySlug(locationSlug);
  const {
    data: locationTree,
  } = useLocationTree();

  if (locationLoading) {
    return <p className="text-muted-foreground">{t("Loading location…")}</p>;
  }

  if (!location) {
    return <p className="text-destructive">{t("Location not found.")}</p>;
  }

  // Include bookmarks tagged with this location or any of its descendants.
  const locationIds = new Set(subtreeIds(location));
  const locationBookmarks = (bookmarks ?? []).filter(b => b.locations.some(l => locationIds.has(l.id)));

  // Ancestor chain (root → parent), stripped of children so only the ancestors themselves plot —
  // otherwise the map would re-plot the whole tree under a root ancestor. Always included, mirroring
  // `LocationGeneralView`.
  const ancestorPath = locationTree ? findAncestorPath(locationTree, locationSlug) : null;
  const ancestors = (ancestorPath ? ancestorPath.slice(0, -1) : []).map(ancestor => ({
    ...ancestor,
    children: [] as LocationNode[],
  }));
  const mapTree = [
    ...ancestors,
    {
      ...location,
      children: [],
    },
    ...location.children.map(child => ({
      ...child,
      children: [] as LocationNode[],
    })),
  ];

  // Diagnostic for the map's Debug modal: why this location's parent chain is (or isn't) plotted.
  // This page has no "only direct ancestors/children" control, so that flag is always false. Mirrors
  // `LocationGeneralView` so the diagnostic is populated on the bookmarks page too, not just General.
  const ancestryDebug: MapAncestryDebug = {
    onlyDirectRelatives: false,
    treeLoaded: locationTree !== undefined,
    treeNodeCount: flattenTree(locationTree ?? []).length,
    nodeId: location.id,
    nodeSlug: location.slug,
    parentId: location.parentId ?? null,
    foundInTree: ancestorPath !== null,
    ancestors: ancestors.map(ancestor => ({
      id: ancestor.id,
      name: ancestor.name,
      slug: ancestor.slug,
      placeType: ancestor.placeType,
    })),
  };

  return (
    <BookmarkSearchView
      activeView={activeView}
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
          ancestryDebug={ancestryDebug}
        />
      )}
      pageKey={`location:${locationSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      categories={categories ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      genreMoods={genreMoods ?? []}
      bookmarks={locationBookmarks}
      search={search}
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this location yet.")}
      noMatchMessage={t("No bookmarks for this location match these filters.")}
    />
  );
}
