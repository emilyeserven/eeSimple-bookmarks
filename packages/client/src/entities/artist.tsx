import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Artist, UpdateArtistInput } from "@eesimple/types";

import { ArtistListItem } from "../components/ArtistListItem";
import { ArtistTable } from "../components/ArtistTable";
import { artistWorkbench } from "../components/workbench/artist";
import { useBulkDeleteArtists, useArtists } from "../hooks/useArtists";
import { artistsApi } from "../lib/api/taxonomies";

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const ARTIST_ROUTE: EntityRoute = {
  kind: "artist",
  prefix: "/taxonomies/artists",
  slugIndex: 2,
  listLabel: "Artists",
  singular: "Artist",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const ARTIST_PALETTE: EntityPaletteConfig = {
  queryKey: ["artists"],
  listFn: () => artistsApi.list(),
  updateFn: (id, patch) => artistsApi.update(id, patch as UpdateArtistInput),
  extraInvalidateKeys: [["media-properties"], ["bookmarks"]],
};

export const artistListingConfig: EntityListingConfig<Artist> = {
  pageKey: "artists-listing",
  useItems: useArtists,
  matches: (artist, query) =>
    artist.name.toLowerCase().includes(query) || artist.slug.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteArtists,
  noun: ["artist", "artists"],
  loadingLabel: "Loading artists…",
  entityPlural: "artists",
  emptyMessage: (
    <p className="text-muted-foreground">
      No artists yet.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <ArtistListItem
      artist={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <ArtistTable
      data={entities}
      selection={selection}
    />
  ),
};

export const artistDescriptor: EntityDescriptor<Artist> = {
  kind: "artist",
  route: ARTIST_ROUTE,
  palette: ARTIST_PALETTE,
  workbench: artistWorkbench,
  listing: artistListingConfig,
};
