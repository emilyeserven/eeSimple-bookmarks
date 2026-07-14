import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { RelationshipType, UpdateRelationshipTypeInput } from "@eesimple/types";

import { RelationshipTypeCard } from "../components/RelationshipTypeCard";
import { RelationshipTypeTable } from "../components/RelationshipTypeTable";
import { relationshipTypeWorkbench } from "../components/workbench/relationshipType";
import {
  useBulkDeleteRelationshipTypes,
  useRelationshipTypes,
} from "../hooks/useRelationshipTypes";
import i18n from "../i18n";
import { relationshipTypesApi } from "../lib/api/taxonomies";
import { starredPaletteField } from "../lib/starredPaletteField";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const RELATIONSHIP_TYPE_ROUTE: EntityRoute = {
  kind: "relationship-type",
  prefix: "/taxonomies/relationship-types",
  slugIndex: 2,
  listLabel: i18n.t("Relationship Types"),
  singular: i18n.t("Relationship Type"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const RELATIONSHIP_TYPE_PALETTE: EntityPaletteConfig = {
  queryKey: ["relationship-types"],
  listFn: () => relationshipTypesApi.list(),
  updateFn: (id, patch) => relationshipTypesApi.update(id, patch as UpdateRelationshipTypeInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
  fields: [
    {
      type: "boolean",
      key: "directional",
      label: i18n.t("Directional"),
      getValue: entity => (entity as RelationshipType).directional,
      isEditable: entity => !(entity as RelationshipType).builtIn,
    },
    starredPaletteField,
  ],
};

export const relationshipTypeListingConfig: EntityListingConfig<RelationshipType> = {
  pageKey: "relationship-types-listing",
  layout: "list",
  useItems: useRelationshipTypes,
  matches: (relationshipType, query) => relationshipType.name.toLowerCase().includes(query),
  deletableIds: items => items.filter(rt => !rt.builtIn).map(rt => rt.id),
  isSelectable: rt => !rt.builtIn,
  useBulkDelete: useBulkDeleteRelationshipTypes,
  noun: [i18n.t("relationship type"), i18n.t("relationship types")],
  loadingLabel: i18n.t("Loading relationship types…"),
  entityPlural: i18n.t("relationship types"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No relationship types yet.")}
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
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

/** Fifth `EntityDescriptor` migration (after Group #868, Person #872, PropertyGroup #873, Newsletter #874) — issue #860. */
export const relationshipTypeDescriptor: EntityDescriptor<RelationshipType> = {
  kind: "relationship-type",
  route: RELATIONSHIP_TYPE_ROUTE,
  palette: RELATIONSHIP_TYPE_PALETTE,
  workbench: relationshipTypeWorkbench,
  listing: relationshipTypeListingConfig,
};
