import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Movie, UpdateMovieInput } from "@eesimple/types";

import { MovieListItem } from "../components/MovieListItem";
import { MovieTable } from "../components/MovieTable";
import { movieWorkbench } from "../components/workbench/movie";
import { useBulkDeleteMovies, useMovies } from "../hooks/useMovies";
import i18n from "../i18n";
import { moviesApi } from "../lib/api/taxonomies";

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const MOVIE_ROUTE: EntityRoute = {
  kind: "movie",
  prefix: "/taxonomies/movies",
  slugIndex: 2,
  listLabel: i18n.t("Movies"),
  singular: i18n.t("Movie"),
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const MOVIE_PALETTE: EntityPaletteConfig = {
  queryKey: ["movies"],
  listFn: () => moviesApi.list(),
  updateFn: (id, patch) => moviesApi.update(id, patch as UpdateMovieInput),
  extraInvalidateKeys: [["media-properties"], ["bookmarks"]],
};

export const movieListingConfig: EntityListingConfig<Movie> = {
  pageKey: "movies-listing",
  useItems: useMovies,
  matches: (movie, query) =>
    movie.name.toLowerCase().includes(query) || movie.slug.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteMovies,
  noun: [i18n.t("movie"), i18n.t("movies")],
  loadingLabel: i18n.t("Loading movies…"),
  entityPlural: i18n.t("movies"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No movies yet.")}
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <MovieListItem
      movie={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <MovieTable
      data={entities}
      selection={selection}
    />
  ),
};

export const movieDescriptor: EntityDescriptor<Movie> = {
  kind: "movie",
  route: MOVIE_ROUTE,
  palette: MOVIE_PALETTE,
  workbench: movieWorkbench,
  listing: movieListingConfig,
};
