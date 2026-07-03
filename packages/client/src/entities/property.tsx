import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { CustomProperty, UpdateCustomPropertyInput } from "@eesimple/types";

import { CustomPropertyTable } from "../components/CustomPropertyTable";
import { PropertyPreview } from "../components/PropertyPreview";
import { propertyWorkbench } from "../components/workbench/property";
import { useBulkDeleteCustomProperties, useCustomProperties } from "../hooks/useCustomProperties";
import { customPropertiesApi } from "../lib/api/taxonomies";
import { TYPE_LABELS } from "../lib/propertyFormat";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const CUSTOM_PROPERTY_ROUTE: EntityRoute = {
  kind: "custom-property",
  prefix: "/custom-properties",
  slugIndex: 1,
  listLabel: "Custom Properties",
  singular: "Custom Property",
  switcher: "custom-property",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const CUSTOM_PROPERTY_PALETTE: EntityPaletteConfig = {
  queryKey: ["custom-properties"],
  listFn: () => customPropertiesApi.list(),
  updateFn: (id, patch) => customPropertiesApi.update(id, patch as UpdateCustomPropertyInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
  fields: [
    {
      type: "boolean",
      key: "enabled",
      label: "Enabled",
      getValue: entity => (entity as CustomProperty).enabled,
    },
    {
      type: "boolean",
      key: "editableOnCard",
      label: "Editable on Card",
      getValue: entity => (entity as CustomProperty).editableOnCard,
    },
    {
      type: "boolean",
      key: "editableViaCmdk",
      label: "Editable via CMD+K",
      getValue: entity => (entity as CustomProperty).editableViaCmdk,
    },
    {
      type: "boolean",
      key: "enabledInInbox",
      label: "Enabled in Inbox",
      getValue: entity => (entity as CustomProperty).enabledInInbox,
    },
  ],
};

export const customPropertyListingConfig: EntityListingConfig<CustomProperty> = {
  pageKey: "custom-properties-listing",
  useItems: useCustomProperties,
  matches: (property, query) =>
    property.name.toLowerCase().includes(query) || TYPE_LABELS[property.type].toLowerCase().includes(query),
  deletableIds: items => items.filter(p => !p.builtIn).map(p => p.id),
  isSelectable: property => !property.builtIn,
  useBulkDelete: useBulkDeleteCustomProperties,
  noun: ["property", "properties"],
  loadingLabel: "Loading custom properties…",
  entityPlural: "custom properties",
  emptyMessage: (
    <p className="text-muted-foreground">
      No custom properties yet. Create one to get started.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <PropertyPreview
      property={entity}
      allProperties={allItems}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <CustomPropertyTable
      filtered={entities}
      selection={selection}
    />
  ),
};

/** Tenth `EntityDescriptor` migration (after Publisher #868, Person #872, PropertyGroup #873, Newsletter #874, RelationshipType + SavedFilter #875, Website #880, Category #881, YouTubeChannel #882) — issue #860. */
export const customPropertyDescriptor: EntityDescriptor<CustomProperty> = {
  kind: "custom-property",
  route: CUSTOM_PROPERTY_ROUTE,
  palette: CUSTOM_PROPERTY_PALETTE,
  workbench: propertyWorkbench,
  listing: customPropertyListingConfig,
};
