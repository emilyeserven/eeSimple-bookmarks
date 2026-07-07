import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { LocationRelation, UpdateLocationRelationInput } from "@eesimple/types";

import { LocationRelationListItem } from "../components/LocationRelationListItem";
import { LocationRelationTable } from "../components/LocationRelationTable";
import { locationRelationWorkbench } from "../components/workbench/locationRelation";
import { useBulkDeleteLocationRelations, useLocationRelations } from "../hooks/useLocationRelations";
import i18n from "../i18n";
import { locationRelationsApi } from "../lib/api/taxonomies";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const LOCATION_RELATION_ROUTE: EntityRoute = {
  kind: "location-relation",
  prefix: "/taxonomies/location-relations",
  slugIndex: 2,
  listLabel: i18n.t("Location Relations"),
  singular: i18n.t("Location Relation"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const LOCATION_RELATION_PALETTE: EntityPaletteConfig = {
  queryKey: ["location-relations"],
  listFn: () => locationRelationsApi.list(),
  updateFn: (id, patch) => locationRelationsApi.update(id, patch as UpdateLocationRelationInput),
  extraInvalidateKeys: [["bookmarks"], ["locations"]],
};

/** The flat listing config powering the browsable Location Relations page (`ListingScaffold`). */
export function buildLocationRelationListingConfig(): EntityListingConfig<LocationRelation> {
  return {
    pageKey: "location-relations-listing",
    useItems: useLocationRelations,
    matches: (relation, query) =>
      relation.name.toLowerCase().includes(query) || relation.slug.toLowerCase().includes(query),
    useBulkDelete: useBulkDeleteLocationRelations,
    isSelectable: relation => !relation.builtIn,
    noun: [i18n.t("location relation"), i18n.t("location relations")],
    loadingLabel: i18n.t("Loading location relations…"),
    entityPlural: i18n.t("location relations"),
    emptyMessage: (
      <p className="text-muted-foreground">
        {i18n.t("No location relations yet.")}
      </p>
    ),
    renderListItem: ({
      entity, selectable, selected, onSelectToggle, inSelectionMode,
    }) => (
      <LocationRelationListItem
        locationRelation={entity}
        selectable={selectable}
        selected={selected}
        onSelectToggle={onSelectToggle}
        inSelectionMode={inSelectionMode}
      />
    ),
    renderTable: ({
      entities, selection,
    }) => (
      <LocationRelationTable
        locationRelations={entities}
        selection={selection}
      />
    ),
  };
}

/** Location Relation — a Locations-adjacent taxonomy attached per `(bookmark, location)` edge. */
export const locationRelationDescriptor: EntityDescriptor<LocationRelation> = {
  kind: "location-relation",
  route: LOCATION_RELATION_ROUTE,
  palette: LOCATION_RELATION_PALETTE,
  workbench: locationRelationWorkbench,
  listing: buildLocationRelationListingConfig(),
};
