import type { EntityWorkbench } from "./types";
import type { Movie } from "@eesimple/types";

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
  notFound: "Movie not found.",
  navAriaLabel: "Movie sections",
  getSlug: movie => movie.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Media property, Plex link, year, and metadata.",
        render: ({
          entity,
        }) => (
          <PlexTitleGeneralView
            entity={entity}
            createdAt={entity.createdAt}
            bookmarkCount={entity.bookmarkCount}
          />
        ),
      },
      edit: {
        title: "General",
        description: "Name, media property, Plex link, and year.",
        render: ({
          entity,
        }) => <MovieGeneralForm movie={entity} />,
      },
    },
    {
      key: "image",
      label: "Image",
      view: {
        title: "Image",
        description: "The movie's poster image.",
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
        title: "Image",
        description: "Upload a poster, or pull it from the linked Plex item.",
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
  ],
};
