import type { Episode, PlexItemResult } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EpisodeTvShowField } from "./EpisodeTvShowField";
import { PlexTitleGeneralForm } from "./PlexTitleGeneralForm";
import { useUpdateEpisode } from "../hooks/useEpisodes";
import { useTvShows } from "../hooks/useTvShows";
import { episodesApi } from "../lib/api/taxonomies";
import { matchPlexParentId } from "../lib/plexParent";

import { notifyFieldSaved } from "@/lib/autoSave";

/**
 * Edit an episode's core fields (auto-saves) plus its parent TV show. Picking a Plex item auto-links
 * the parent show when it already exists (match by Plex key, then name) and it isn't already set.
 */
export function EpisodeGeneralForm({
  episode,
}: {
  episode: Episode;
}) {
  const navigate = useNavigate();
  const update = useUpdateEpisode();
  const {
    data: tvShows,
  } = useTvShows();
  const {
    t,
  } = useTranslation();

  function handlePlexSelected(item: PlexItemResult) {
    if (episode.tvShowId) return;
    const parentId = matchPlexParentId(item, tvShows ?? [], {
      ratingKeyField: "grandparentRatingKey",
      titleField: "grandparentTitle",
    });
    if (!parentId) return;
    update.mutate(
      {
        id: episode.id,
        input: {
          tvShowId: parentId,
        },
      },
      {
        onSuccess: () => notifyFieldSaved(t("TV show")),
      },
    );
  }

  return (
    <PlexTitleGeneralForm
      entity={episode}
      kind="episode"
      ownerType="episode"
      mediaOwnerType="episode"
      update={update}
      onRenamed={slug => void navigate({
        to: "/taxonomies/episodes/$episodeSlug/edit/general",
        params: {
          episodeSlug: slug,
        },
      })}
      renderExtra={<EpisodeTvShowField episode={episode} />}
      onPlexSelected={handlePlexSelected}
      base="episodes"
      imagesApi={episodesApi.images}
      queryKeyPrefix="episode-images"
    />
  );
}
