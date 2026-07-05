import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { MediaProperty, UpdateMediaPropertyInput } from "@eesimple/types";

import { MediaPropertyListItem } from "../components/MediaPropertyListItem";
import { MediaPropertyTable } from "../components/MediaPropertyTable";
import { mediaPropertyWorkbench } from "../components/workbench/mediaProperty";
import { useBulkDeleteMediaProperties, useMediaProperties } from "../hooks/useMediaProperties";
import i18n from "../i18n";
import { mediaPropertiesApi } from "../lib/api/taxonomies";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const MEDIA_PROPERTY_ROUTE: EntityRoute = {
  kind: "media-property",
  prefix: "/taxonomies/media-properties",
  slugIndex: 2,
  listLabel: i18n.t("Media Properties"),
  singular: i18n.t("Media Property"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const MEDIA_PROPERTY_PALETTE: EntityPaletteConfig = {
  queryKey: ["media-properties"],
  listFn: () => mediaPropertiesApi.list(),
  updateFn: (id, patch) => mediaPropertiesApi.update(id, patch as UpdateMediaPropertyInput),
  extraInvalidateKeys: [["books"]],
};

export const mediaPropertyListingConfig: EntityListingConfig<MediaProperty> = {
  pageKey: "media-properties-listing",
  useItems: useMediaProperties,
  matches: (prop, query) =>
    prop.name.toLowerCase().includes(query) || prop.slug.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteMediaProperties,
  noun: [i18n.t("media property"), i18n.t("media properties")],
  loadingLabel: i18n.t("Loading media properties…"),
  entityPlural: i18n.t("media properties"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No media properties yet.")}
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <MediaPropertyListItem
      mediaProperty={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <MediaPropertyTable
      data={entities}
      selection={selection}
    />
  ),
};

export const mediaPropertyDescriptor: EntityDescriptor<MediaProperty> = {
  kind: "media-property",
  route: MEDIA_PROPERTY_ROUTE,
  palette: MEDIA_PROPERTY_PALETTE,
  workbench: mediaPropertyWorkbench,
  listing: mediaPropertyListingConfig,
};
