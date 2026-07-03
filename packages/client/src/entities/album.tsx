import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Album, UpdateAlbumInput } from "@eesimple/types";

import { AlbumListItem } from "../components/AlbumListItem";
import { AlbumTable } from "../components/AlbumTable";
import { albumWorkbench } from "../components/workbench/album";
import { useBulkDeleteAlbums, useAlbums } from "../hooks/useAlbums";
import { albumsApi } from "../lib/api/taxonomies";

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const ALBUM_ROUTE: EntityRoute = {
  kind: "album",
  prefix: "/taxonomies/albums",
  slugIndex: 2,
  listLabel: "Albums",
  singular: "Album",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const ALBUM_PALETTE: EntityPaletteConfig = {
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
  noun: ["album", "albums"],
  loadingLabel: "Loading albums…",
  entityPlural: "albums",
  emptyMessage: (
    <p className="text-muted-foreground">
      No albums yet.
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
