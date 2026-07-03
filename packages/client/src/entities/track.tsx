import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Track, UpdateTrackInput } from "@eesimple/types";

import { TrackListItem } from "../components/TrackListItem";
import { TrackTable } from "../components/TrackTable";
import { trackWorkbench } from "../components/workbench/track";
import { useBulkDeleteTracks, useTracks } from "../hooks/useTracks";
import { tracksApi } from "../lib/api/taxonomies";

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const TRACK_ROUTE: EntityRoute = {
  kind: "track",
  prefix: "/taxonomies/tracks",
  slugIndex: 2,
  listLabel: "Tracks",
  singular: "Track",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const TRACK_PALETTE: EntityPaletteConfig = {
  queryKey: ["tracks"],
  listFn: () => tracksApi.list(),
  updateFn: (id, patch) => tracksApi.update(id, patch as UpdateTrackInput),
  extraInvalidateKeys: [["media-properties"], ["bookmarks"]],
};

export const trackListingConfig: EntityListingConfig<Track> = {
  pageKey: "tracks-listing",
  useItems: useTracks,
  matches: (track, query) =>
    track.name.toLowerCase().includes(query) || track.slug.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteTracks,
  noun: ["track", "tracks"],
  loadingLabel: "Loading tracks…",
  entityPlural: "tracks",
  emptyMessage: (
    <p className="text-muted-foreground">
      No tracks yet.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <TrackListItem
      track={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <TrackTable
      data={entities}
      selection={selection}
    />
  ),
};

export const trackDescriptor: EntityDescriptor<Track> = {
  kind: "track",
  route: TRACK_ROUTE,
  palette: TRACK_PALETTE,
  workbench: trackWorkbench,
  listing: trackListingConfig,
};
