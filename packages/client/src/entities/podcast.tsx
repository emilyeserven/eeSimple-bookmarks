import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Podcast, UpdatePodcastInput } from "@eesimple/types";

import { PodcastListItem } from "../components/PodcastListItem";
import { PodcastTable } from "../components/PodcastTable";
import { podcastWorkbench } from "../components/workbench/podcast";
import { useBulkDeletePodcasts, usePodcasts } from "../hooks/usePodcasts";
import i18n from "../i18n";
import { podcastsApi } from "../lib/api/taxonomies";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const PODCAST_ROUTE: EntityRoute = {
  kind: "podcast",
  prefix: "/taxonomies/podcasts",
  slugIndex: 2,
  listLabel: i18n.t("Podcasts"),
  singular: i18n.t("Podcast"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const PODCAST_PALETTE: EntityPaletteConfig = {
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
  noun: [i18n.t("podcast"), i18n.t("podcasts")],
  loadingLabel: i18n.t("Loading podcasts…"),
  entityPlural: i18n.t("podcasts"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No podcasts yet.")}
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
