import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Track, UpdateTrackInput } from "@eesimple/types";

import { TrackListItem } from "../components/TrackListItem";
import { TrackTable } from "../components/TrackTable";
import { trackWorkbench } from "../components/workbench/track";
import { useBulkDeleteTracks, useTracks } from "../hooks/useTracks";
import i18n from "../i18n";
import { tracksApi } from "../lib/api/taxonomies";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const TRACK_ROUTE: EntityRoute = {
  kind: "track",
  prefix: "/taxonomies/tracks",
  slugIndex: 2,
  listLabel: i18n.t("Tracks"),
  singular: i18n.t("Track"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const TRACK_PALETTE: EntityPaletteConfig = {
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
  noun: [i18n.t("track"), i18n.t("tracks")],
  loadingLabel: i18n.t("Loading tracks…"),
  entityPlural: i18n.t("tracks"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No tracks yet.")}
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
