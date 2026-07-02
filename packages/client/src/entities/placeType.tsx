import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { PlaceType, UpdatePlaceTypeInput } from "@eesimple/types";

import { PlaceTypeListItem } from "../components/PlaceTypeListItem";
import { PlaceTypeTable } from "../components/PlaceTypeTable";
import { placeTypeWorkbench } from "../components/workbench/placeType";
import { useBulkDeletePlaceTypes, usePlaceTypes } from "../hooks/usePlaceTypes";
import { placeTypesApi } from "../lib/api/taxonomies";

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const PLACE_TYPE_ROUTE: EntityRoute = {
  kind: "place-type",
  prefix: "/taxonomies/place-types",
  slugIndex: 2,
  listLabel: "Place Types",
  singular: "Place Type",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const PLACE_TYPE_PALETTE: EntityPaletteConfig = {
  queryKey: ["place-types"],
  listFn: () => placeTypesApi.list(),
  updateFn: (id, patch) => placeTypesApi.update(id, patch as UpdatePlaceTypeInput),
  extraInvalidateKeys: [["locations"]],
};

/**
 * Built as a factory (not a static module-level config) because `renderListItem` needs to close over
 * Manager-local "Filter map" toggle state (`filterIds`/`onToggleFilter`) — the per-row button that
 * focuses `PlaceTypesListing`'s map on a place type. `PlaceTypeManager.tsx` builds a fresh, memoized
 * config each render via `buildPlaceTypeListingConfig`; `placeTypeDescriptor` below references a
 * no-op instance since `EntityDescriptor.listing` isn't consumed by anything yet.
 */
export function buildPlaceTypeListingConfig(opts: {
  filterIds: Set<string>;
  onToggleFilter: (id: string) => void;
}): EntityListingConfig<PlaceType> {
  return {
    pageKey: "place-types-listing",
    useItems: usePlaceTypes,
    matches: (placeType, query) =>
      placeType.name.toLowerCase().includes(query) || placeType.slug.toLowerCase().includes(query),
    useBulkDelete: useBulkDeletePlaceTypes,
    noun: ["place type", "place types"],
    loadingLabel: "Loading place types…",
    entityPlural: "place types",
    emptyMessage: (
      <p className="text-muted-foreground">
        No place types yet. They are seeded from your locations’ place classifications.
      </p>
    ),
    renderListItem: ({
      entity, selectable, selected, onSelectToggle, inSelectionMode,
    }) => (
      <PlaceTypeListItem
        placeType={entity}
        selectable={selectable}
        selected={selected}
        onSelectToggle={onSelectToggle}
        inSelectionMode={inSelectionMode}
        filtered={opts.filterIds.has(entity.id)}
        onToggleFilter={() => opts.onToggleFilter(entity.id)}
      />
    ),
    renderTable: ({
      entities, selection,
    }) => (
      <PlaceTypeTable
        placeTypes={entities}
        selection={selection}
      />
    ),
  };
}

/** Eleventh `EntityDescriptor` migration (after Publisher #868, Author #872, PropertyGroup #873, Newsletter #874, RelationshipType + SavedFilter #875, Website #880, Category #881, YouTubeChannel #882, CustomProperty) — issue #860. */
export const placeTypeDescriptor: EntityDescriptor<PlaceType> = {
  kind: "place-type",
  route: PLACE_TYPE_ROUTE,
  palette: PLACE_TYPE_PALETTE,
  workbench: placeTypeWorkbench,
  listing: buildPlaceTypeListingConfig({
    filterIds: new Set(),
    onToggleFilter: () => undefined,
  }),
};
