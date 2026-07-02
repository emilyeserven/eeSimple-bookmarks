import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { RelationshipType } from "@eesimple/types";

import { RelationshipTypeCard } from "../components/RelationshipTypeCard";
import { RelationshipTypeTable } from "../components/RelationshipTypeTable";
import { relationshipTypeWorkbench } from "../components/workbench/relationshipType";
import {
  useBulkDeleteRelationshipTypes,
  useRelationshipTypes,
} from "../hooks/useRelationshipTypes";
import { RELATIONSHIP_TYPE_PALETTE } from "../lib/entityPaletteRegistry";
import { RELATIONSHIP_TYPE_ROUTE } from "../lib/entityRoutes";

export const relationshipTypeListingConfig: EntityListingConfig<RelationshipType> = {
  pageKey: "relationship-types-listing",
  layout: "list",
  useItems: useRelationshipTypes,
  matches: (relationshipType, query) => relationshipType.name.toLowerCase().includes(query),
  deletableIds: items => items.filter(rt => !rt.builtIn).map(rt => rt.id),
  isSelectable: rt => !rt.builtIn,
  useBulkDelete: useBulkDeleteRelationshipTypes,
  noun: ["relationship type", "relationship types"],
  loadingLabel: "Loading relationship types…",
  entityPlural: "relationship types",
  emptyMessage: (
    <p className="text-muted-foreground">
      No relationship types yet.
    </p>
  ),
  renderListItem: ({
    entity, ...rest
  }) => (
    <RelationshipTypeCard
      relationshipType={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <RelationshipTypeTable
      data={entities}
      selection={selection}
    />
  ),
};

/** Fifth `EntityDescriptor` migration (after Publisher #868, Author #872, PropertyGroup #873, Newsletter #874) — issue #860. */
export const relationshipTypeDescriptor: EntityDescriptor<RelationshipType> = {
  kind: "relationship-type",
  route: RELATIONSHIP_TYPE_ROUTE,
  palette: RELATIONSHIP_TYPE_PALETTE,
  workbench: relationshipTypeWorkbench,
  listing: relationshipTypeListingConfig,
};
