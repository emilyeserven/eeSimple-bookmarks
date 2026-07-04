import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Episode, UpdateEpisodeInput } from "@eesimple/types";

import { EpisodeListItem } from "../components/EpisodeListItem";
import { EpisodeTable } from "../components/EpisodeTable";
import { episodeWorkbench } from "../components/workbench/episode";
import { useBulkDeleteEpisodes, useEpisodes } from "../hooks/useEpisodes";
import { episodesApi } from "../lib/api/taxonomies";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const EPISODE_ROUTE: EntityRoute = {
  kind: "episode",
  prefix: "/taxonomies/episodes",
  slugIndex: 2,
  listLabel: "Episodes",
  singular: "Episode",
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const EPISODE_PALETTE: EntityPaletteConfig = {
  queryKey: ["episodes"],
  listFn: () => episodesApi.list(),
  updateFn: (id, patch) => episodesApi.update(id, patch as UpdateEpisodeInput),
  extraInvalidateKeys: [["media-properties"], ["bookmarks"]],
};

export const episodeListingConfig: EntityListingConfig<Episode> = {
  pageKey: "episodes-listing",
  useItems: useEpisodes,
  matches: (episode, query) =>
    episode.name.toLowerCase().includes(query) || episode.slug.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteEpisodes,
  noun: ["episode", "episodes"],
  loadingLabel: "Loading episodes…",
  entityPlural: "episodes",
  emptyMessage: (
    <p className="text-muted-foreground">
      No episodes yet.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <EpisodeListItem
      episode={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <EpisodeTable
      data={entities}
      selection={selection}
    />
  ),
};

export const episodeDescriptor: EntityDescriptor<Episode> = {
  kind: "episode",
  route: EPISODE_ROUTE,
  palette: EPISODE_PALETTE,
  workbench: episodeWorkbench,
  listing: episodeListingConfig,
};
