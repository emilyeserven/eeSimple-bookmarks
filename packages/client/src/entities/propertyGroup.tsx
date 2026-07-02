import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { PropertyGroup } from "@eesimple/types";

import { PropertyGroupListItem } from "../components/PropertyGroupListItem";
import { PropertyGroupTable } from "../components/PropertyGroupTable";
import { propertyGroupWorkbench } from "../components/workbench/propertyGroup";
import { useBulkDeletePropertyGroups, usePropertyGroups } from "../hooks/usePropertyGroups";
import { PROPERTY_GROUP_PALETTE } from "../lib/entityPaletteRegistry";
import { PROPERTY_GROUP_ROUTE } from "../lib/entityRoutes";

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
    entity, ...rest
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

/** Third `EntityDescriptor` migration (after Publisher #868, Author #872) — issue #860. */
export const propertyGroupDescriptor: EntityDescriptor<PropertyGroup> = {
  kind: "property-group",
  route: PROPERTY_GROUP_ROUTE,
  palette: PROPERTY_GROUP_PALETTE,
  workbench: propertyGroupWorkbench,
  listing: propertyGroupListingConfig,
};
