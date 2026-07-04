import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { PropertyGroup, UpdatePropertyGroupInput } from "@eesimple/types";

import { PropertyGroupListItem } from "../components/PropertyGroupListItem";
import { PropertyGroupTable } from "../components/PropertyGroupTable";
import { propertyGroupWorkbench } from "../components/workbench/propertyGroup";
import { useBulkDeletePropertyGroups, usePropertyGroups } from "../hooks/usePropertyGroups";
import { propertyGroupsApi } from "../lib/api/taxonomies";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const PROPERTY_GROUP_ROUTE: EntityRoute = {
  kind: "property-group",
  prefix: "/taxonomies/property-groups",
  slugIndex: 2,
  listLabel: "Property Groups",
  singular: "Property Group",
  switcher: "property-group",
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const PROPERTY_GROUP_PALETTE: EntityPaletteConfig = {
  queryKey: ["property-groups"],
  listFn: () => propertyGroupsApi.list(),
  updateFn: (id, patch) => propertyGroupsApi.update(id, patch as UpdatePropertyGroupInput),
  extraInvalidateKeys: [["custom-properties"]],
};

export const propertyGroupListingConfig: EntityListingConfig<PropertyGroup> = {
  pageKey: "property-groups-listing",
  useItems: usePropertyGroups,
  matches: (group, query) =>
    group.name.toLowerCase().includes(query) || group.slug.toLowerCase().includes(query),
  useBulkDelete: useBulkDeletePropertyGroups,
  noun: ["property group", "property groups"],
  loadingLabel: "Loading property groups…",
  entityPlural: "property groups",
  emptyMessage: (
    <p className="text-muted-foreground">
      No property groups yet.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <PropertyGroupListItem
      group={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <PropertyGroupTable
      data={entities}
      selection={selection}
    />
  ),
};

/** Third `EntityDescriptor` migration (after Group #868, Person #872) — issue #860. */
export const propertyGroupDescriptor: EntityDescriptor<PropertyGroup> = {
  kind: "property-group",
  route: PROPERTY_GROUP_ROUTE,
  palette: PROPERTY_GROUP_PALETTE,
  workbench: propertyGroupWorkbench,
  listing: propertyGroupListingConfig,
};
