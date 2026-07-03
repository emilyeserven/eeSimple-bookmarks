import type { EntityWorkbench } from "./types";
import type { Episode } from "@eesimple/types";

import { EpisodeGeneralForm } from "../EpisodeGeneralForm";
import { EpisodeTvShowValue } from "../EpisodeTvShowField";
import { PlexTitleGeneralView } from "../PlexTitleGeneralView";

import { useDeleteEpisode, useEpisodeBySlug, useEpisodes } from "@/hooks/useEpisodes";

/** Single source of truth for an episode's view/edit UI (main pane routes + right panel). */
export const episodeWorkbench: EntityWorkbench<Episode> = {
  useBySlug: (slug) => {
    const {
      episode, isLoading,
    } = useEpisodeBySlug(slug);
    return {
      entity: episode,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useEpisodes();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: episode => episode.name,
  useDelete: () => {
    const mutation = useDeleteEpisode();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Episode not found.",
  navAriaLabel: "Episode sections",
  getSlug: episode => episode.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Media property, TV show, Plex link, year, and metadata.",
        render: ({
          entity,
        }) => (
          <PlexTitleGeneralView
            entity={entity}
            createdAt={entity.createdAt}
            bookmarkCount={entity.bookmarkCount}
            renderExtra={<EpisodeTvShowValue episode={entity} />}
          />
        ),
      },
      edit: {
        title: "General",
        description: "Name, media property, TV show, Plex link, and year.",
        render: ({
          entity,
        }) => <EpisodeGeneralForm episode={entity} />,
      },
    },
  ],
};
