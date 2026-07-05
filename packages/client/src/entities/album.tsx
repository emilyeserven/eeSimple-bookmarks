import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Album, UpdateAlbumInput } from "@eesimple/types";

import { AlbumListItem } from "../components/AlbumListItem";
import { AlbumTable } from "../components/AlbumTable";
import { albumWorkbench } from "../components/workbench/album";
import { useBulkDeleteAlbums, useAlbums } from "../hooks/useAlbums";
import i18n from "../i18n";
import { albumsApi } from "../lib/api/taxonomies";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const ALBUM_ROUTE: EntityRoute = {
  kind: "album",
  prefix: "/taxonomies/albums",
  slugIndex: 2,
  listLabel: i18n.t("Albums"),
  singular: i18n.t("Album"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const ALBUM_PALETTE: EntityPaletteConfig = {
  queryKey: ["albums"],
  listFn: () => albumsApi.list(),
  updateFn: (id, patch) => albumsApi.update(id, patch as UpdateAlbumInput),
  extraInvalidateKeys: [["media-properties"], ["bookmarks"]],
};

export const albumListingConfig: EntityListingConfig<Album> = {
  pageKey: "albums-listing",
  useItems: useAlbums,
  matches: (album, query) =>
    album.name.toLowerCase().includes(query) || album.slug.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteAlbums,
  noun: [i18n.t("album"), i18n.t("albums")],
  loadingLabel: i18n.t("Loading albums…"),
  entityPlural: i18n.t("albums"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No albums yet.")}
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <AlbumListItem
      album={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <AlbumTable
      data={entities}
      selection={selection}
    />
  ),
};

export const albumDescriptor: EntityDescriptor<Album> = {
  kind: "album",
  route: ALBUM_ROUTE,
  palette: ALBUM_PALETTE,
  workbench: albumWorkbench,
  listing: albumListingConfig,
};
