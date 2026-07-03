import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Podcast, UpdatePodcastInput } from "@eesimple/types";

import { PodcastListItem } from "../components/PodcastListItem";
import { PodcastTable } from "../components/PodcastTable";
import { podcastWorkbench } from "../components/workbench/podcast";
import { useBulkDeletePodcasts, usePodcasts } from "../hooks/usePodcasts";
import { podcastsApi } from "../lib/api/taxonomies";

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const PODCAST_ROUTE: EntityRoute = {
  kind: "podcast",
  prefix: "/taxonomies/podcasts",
  slugIndex: 2,
  listLabel: "Podcasts",
  singular: "Podcast",
  flatCrumbs: true,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const PODCAST_PALETTE: EntityPaletteConfig = {
  queryKey: ["podcasts"],
  listFn: () => podcastsApi.list(),
  updateFn: (id, patch) => podcastsApi.update(id, patch as UpdatePodcastInput),
  extraInvalidateKeys: [["media-properties"], ["bookmarks"]],
};

export const podcastListingConfig: EntityListingConfig<Podcast> = {
  pageKey: "podcasts-listing",
  useItems: usePodcasts,
  matches: (podcast, query) =>
    podcast.name.toLowerCase().includes(query) || podcast.slug.toLowerCase().includes(query),
  useBulkDelete: useBulkDeletePodcasts,
  noun: ["podcast", "podcasts"],
  loadingLabel: "Loading podcasts…",
  entityPlural: "podcasts",
  emptyMessage: (
    <p className="text-muted-foreground">
      No podcasts yet.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <PodcastListItem
      podcast={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <PodcastTable
      data={entities}
      selection={selection}
    />
  ),
};

export const podcastDescriptor: EntityDescriptor<Podcast> = {
  kind: "podcast",
  route: PODCAST_ROUTE,
  palette: PODCAST_PALETTE,
  workbench: podcastWorkbench,
  listing: podcastListingConfig,
};
