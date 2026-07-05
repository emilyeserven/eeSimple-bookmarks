import type { EntityWorkbench } from "./types";
import type { Movie } from "@eesimple/types";

import i18n from "../../i18n";
import { LanguageUsagesTabEditor, LanguageUsagesTabView } from "../languageUsages/LanguageUsagesTab";
import { MovieGeneralForm } from "../MovieGeneralForm";
import { PlexTaxonomyImageTab } from "../PlexTaxonomyImageTab";
import { PlexTitleGeneralView } from "../PlexTitleGeneralView";

import { useDeleteMovie, useMovieBySlug, useMovies } from "@/hooks/useMovies";
import { moviesApi } from "@/lib/api/taxonomies";

/** Single source of truth for a movie's view/edit UI (main pane routes + right panel). */
export const movieWorkbench: EntityWorkbench<Movie> = {
  useBySlug: (slug) => {
    const {
      movie, isLoading,
    } = useMovieBySlug(slug);
    return {
      entity: movie,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useMovies();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: movie => movie.name,
  useDelete: () => {
    const mutation = useDeleteMovie();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Movie not found."),
  navAriaLabel: i18n.t("Movie sections"),
  listingPath: "/taxonomies/movies",
  getSlug: movie => movie.slug,
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Media property, Plex link, year, and metadata."),
        render: ({
          entity,
        }) => (
          <PlexTitleGeneralView
            entity={entity}
            ownerType="movie"
            createdAt={entity.createdAt}
            bookmarkCount={entity.bookmarkCount}
          />
        ),
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name, media property, Plex link, and year."),
        render: ({
          entity,
        }) => <MovieGeneralForm movie={entity} />,
      },
    },
    {
      key: "image",
      label: i18n.t("Image"),
      view: {
        title: i18n.t("Image"),
        description: i18n.t("The movie's poster image."),
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={moviesApi.images}
            queryKeyPrefix="movie-images"
            readOnly
          />
        ),
      },
      edit: {
        title: i18n.t("Image"),
        description: i18n.t("Upload a poster, or pull it from the linked Plex item."),
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={moviesApi.images}
            queryKeyPrefix="movie-images"
          />
        ),
      },
    },
    {
      key: "languages",
      label: i18n.t("Languages"),
      view: {
        title: i18n.t("Languages"),
        description: i18n.t("Languages this movie is available in and how."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabView
            ownerType="movie"
            ownerId={entity.id}
          />
        ),
      },
      edit: {
        title: i18n.t("Languages"),
        description: i18n.t("Record which languages this movie offers (dub, subtitles, …)."),
        render: ({
          entity,
        }) => (
          <LanguageUsagesTabEditor
            ownerType="movie"
            ownerId={entity.id}
            kind="availability"
          />
        ),
      },
    },
  ],
};
