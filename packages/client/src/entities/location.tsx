import type { EntityDescriptor, EntityTreeListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { LocationNode, UpdateLocationInput } from "@eesimple/types";

import { LocationSortToggle } from "../components/LocationSortToggle";
import { LocationTableView } from "../components/LocationTableView";
import { LocationTreeList } from "../components/LocationTreeList";
import { locationWorkbench } from "../components/workbench/location";
import { usePlaceTypeDisplayConfig } from "../hooks/useAppSettings";
import { useBulkDeleteLocations, useLocationTree } from "../hooks/useLocations";
import { locationsApi } from "../lib/api/taxonomies";
import { sortLocationTree } from "../lib/locationSort";
import { flattenTree } from "../lib/tagTree";
import { useUiStore } from "../stores/uiStore";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const LOCATION_ROUTE: EntityRoute = {
  kind: "location",
  prefix: "/taxonomies/locations",
  slugIndex: 2,
  listLabel: "Locations",
  singular: "Location",
  flatCrumbs: false,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const LOCATION_PALETTE: EntityPaletteConfig = {
  queryKey: ["locations"],
  listFn: () => locationsApi.list(),
  updateFn: (id, patch) => locationsApi.update(id, patch as UpdateLocationInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
};

/**
 * The scaffold's `useSortedTree` slot: re-sorts the (already search-filtered) tree per the
 * per-device `locationSortMode` uiStore pref — `"default"` keeps the server order, `"place-type"`
 * groups every level by place-type rank via the Settings-configured display config. The
 * `LocationSortToggle` toolbar control writes the same pref.
 */
export function useLocationSortedTree(tree: LocationNode[]): LocationNode[] {
  const sortMode = useUiStore(state => state.locationSortMode);
  const displayConfig = usePlaceTypeDisplayConfig();
  return sortLocationTree(tree, sortMode, displayConfig);
}

/**
 * Built as a factory (not a static module-level config) because `renderTree` must close over
 * Manager-local map-filter state (`filterIds`/`onToggleFilter`) — the per-row "Filter on map"
 * buttons share the id set the `LocationMapSection` above the tree is focused on (the PlaceType
 * pattern). `LocationManager.tsx` builds a fresh, memoized config each render;
 * `locationDescriptor` below references a no-op instance since `EntityDescriptor.treeListing`
 * isn't consumed by anything yet.
 */
export function buildLocationTreeListingConfig(opts: {
  /** Location ids currently focusing the map (empty = all). */
  filterIds: string[];
  /** Toggle a location into/out of the map filter from a per-row button. */
  onToggleFilter: (id: string) => void;
}): EntityTreeListingConfig<LocationNode> {
  return {
    pageKey: "locations-listing",
    useTree: useLocationTree,
    matches: (node, query) =>
      node.name.toLowerCase().includes(query)
      || node.slug.toLowerCase().includes(query)
      || (node.placeType?.toLowerCase().includes(query) ?? false),
    deletableIds: tree => flattenTree(tree).map(f => f.node.id),
    useBulkDelete: useBulkDeleteLocations,
    noun: ["location", "locations"],
    loadingLabel: "Loading locations…",
    entityPlural: "locations",
    emptyMessage: (
      <p className="text-muted-foreground">
        No locations yet.
      </p>
    ),
    useSortedTree: useLocationSortedTree,
    renderToolbar: () => <LocationSortToggle />,
    renderTree: ({
      sortedTree, expanded, onToggle, onExpandMany, columns,
    }) => (
      <LocationTreeList
        tree={sortedTree}
        expanded={expanded}
        onToggle={onToggle}
        onExpandMany={onExpandMany}
        columns={columns}
        filterIds={opts.filterIds}
        onToggleFilter={opts.onToggleFilter}
      />
    ),
    renderTable: ({
      sortedTree, selection,
    }) => (
      <LocationTableView
        sortedTree={sortedTree}
        selection={selection}
      />
    ),
  };
}

/** Final batch-3 `EntityDescriptor` migration and the third tree taxonomy on the tree scaffold — issue #860. */
export const locationDescriptor: EntityDescriptor<LocationNode, LocationNode> = {
  kind: "location",
  route: LOCATION_ROUTE,
  palette: LOCATION_PALETTE,
  workbench: locationWorkbench,
  treeListing: buildLocationTreeListingConfig({
    filterIds: [],
    onToggleFilter: () => undefined,
  }),
};
