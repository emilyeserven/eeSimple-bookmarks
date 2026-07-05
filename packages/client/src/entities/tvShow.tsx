import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { TvShow, UpdateTvShowInput } from "@eesimple/types";

import { TvShowListItem } from "../components/TvShowListItem";
import { TvShowTable } from "../components/TvShowTable";
import { tvShowWorkbench } from "../components/workbench/tvShow";
import { useBulkDeleteTvShows, useTvShows } from "../hooks/useTvShows";
import i18n from "../i18n";
import { tvShowsApi } from "../lib/api/taxonomies";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const TV_SHOW_ROUTE: EntityRoute = {
  kind: "tv-show",
  prefix: "/taxonomies/tv-shows",
  slugIndex: 2,
  listLabel: i18n.t("TV Shows"),
  singular: i18n.t("TV Show"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const TV_SHOW_PALETTE: EntityPaletteConfig = {
  queryKey: ["tv-shows"],
  listFn: () => tvShowsApi.list(),
  updateFn: (id, patch) => tvShowsApi.update(id, patch as UpdateTvShowInput),
  extraInvalidateKeys: [["media-properties"], ["bookmarks"]],
};

export const tvShowListingConfig: EntityListingConfig<TvShow> = {
  pageKey: "tv-shows-listing",
  useItems: useTvShows,
  matches: (show, query) =>
    show.name.toLowerCase().includes(query) || show.slug.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteTvShows,
  noun: [i18n.t("TV show"), i18n.t("TV shows")],
  loadingLabel: i18n.t("Loading TV shows…"),
  entityPlural: i18n.t("TV shows"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No TV shows yet.")}
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <TvShowListItem
      tvShow={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <TvShowTable
      data={entities}
      selection={selection}
    />
  ),
};

export const tvShowDescriptor: EntityDescriptor<TvShow> = {
  kind: "tv-show",
  route: TV_SHOW_ROUTE,
  palette: TV_SHOW_PALETTE,
  workbench: tvShowWorkbench,
  listing: tvShowListingConfig,
};
