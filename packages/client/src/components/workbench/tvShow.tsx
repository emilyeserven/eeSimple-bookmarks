import type { EntityWorkbench } from "./types";
import type { TvShow } from "@eesimple/types";

import { PlexTaxonomyImageTab } from "../PlexTaxonomyImageTab";
import { PlexTitleGeneralView } from "../PlexTitleGeneralView";
import { TvShowGeneralForm } from "../TvShowGeneralForm";

import { useDeleteTvShow, useTvShowBySlug, useTvShows } from "@/hooks/useTvShows";
import { tvShowsApi } from "@/lib/api/taxonomies";

/** Single source of truth for a TV show's view/edit UI (main pane routes + right panel). */
export const tvShowWorkbench: EntityWorkbench<TvShow> = {
  useBySlug: (slug) => {
    const {
      tvShow, isLoading,
    } = useTvShowBySlug(slug);
    return {
      entity: tvShow,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useTvShows();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: tvShow => tvShow.name,
  useDelete: () => {
    const mutation = useDeleteTvShow();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "TV show not found.",
  navAriaLabel: "TV show sections",
  getSlug: tvShow => tvShow.slug,
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
        }) => <TvShowGeneralForm tvShow={entity} />,
      },
    },
    {
      key: "image",
      label: "Image",
      view: {
        title: "Image",
        description: "The TV show's poster image.",
        render: ({
          entity,
        }) => (
          <PlexTaxonomyImageTab
            entity={entity}
            imagesApi={tvShowsApi.images}
            queryKeyPrefix="tvShow-images"
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
            imagesApi={tvShowsApi.images}
            queryKeyPrefix="tvShow-images"
          />
        ),
      },
    },
  ],
};
