import type { EntityDescriptor, EntityTreeListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { MediaType, MediaTypeNode, UpdateMediaTypeInput } from "@eesimple/types";

import { MediaTypeTable } from "../components/MediaTypeTable";
import { MediaTypeTreeList } from "../components/MediaTypeTreeList";
import { mediaTypeWorkbench } from "../components/workbench/mediaType";
import { useBulkDeleteMediaTypes, useMediaTypeTree } from "../hooks/useMediaTypes";
import i18n from "../i18n";
import { mediaTypesApi } from "../lib/api/taxonomies";
import { flattenTree } from "../lib/tagTree";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const MEDIA_TYPE_ROUTE: EntityRoute = {
  kind: "media-type",
  prefix: "/taxonomies/media-types",
  slugIndex: 2,
  listLabel: i18n.t("Media Types"),
  singular: i18n.t("Media Type"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const MEDIA_TYPE_PALETTE: EntityPaletteConfig = {
  queryKey: ["media-types"],
  listFn: () => mediaTypesApi.list(),
  updateFn: (id, patch) => mediaTypesApi.update(id, patch as UpdateMediaTypeInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
};

export const mediaTypeTreeListingConfig: EntityTreeListingConfig<MediaTypeNode> = {
  pageKey: "media-types-listing",
  useTree: useMediaTypeTree,
  matches: (node, query) =>
    node.name.toLowerCase().includes(query) || node.slug.toLowerCase().includes(query),
  deletableIds: tree => flattenTree(tree).filter(f => !f.node.builtIn).map(f => f.node.id),
  useBulkDelete: useBulkDeleteMediaTypes,
  noun: [i18n.t("media type"), i18n.t("media types")],
  loadingLabel: i18n.t("Loading media types…"),
  entityPlural: i18n.t("media types"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No media types yet.")}
    </p>
  ),
  renderTree: ({
    sortedTree, expanded, onToggle, columns,
  }) => (
    <MediaTypeTreeList
      tree={sortedTree}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
    />
  ),
  renderTable: ({
    sortedTree, selection,
  }) => (
    <MediaTypeTable
      tree={sortedTree}
      selection={selection}
    />
  ),
};

/** Twelfth `EntityDescriptor` migration and the first tree taxonomy on the new tree scaffold — issue #860. */
export const mediaTypeDescriptor: EntityDescriptor<MediaType, MediaTypeNode> = {
  kind: "media-type",
  route: MEDIA_TYPE_ROUTE,
  palette: MEDIA_TYPE_PALETTE,
  workbench: mediaTypeWorkbench,
  treeListing: mediaTypeTreeListingConfig,
};
