import type { PlexItemResult, Track } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { PlexTitleGeneralForm } from "./PlexTitleGeneralForm";
import { TrackAlbumField } from "./TrackAlbumField";
import { useAlbums } from "../hooks/useAlbums";
import { useUpdateTrack } from "../hooks/useTracks";
import { tracksApi } from "../lib/api/taxonomies";
import { matchPlexParentId } from "../lib/plexParent";

import { notifyFieldSaved } from "@/lib/autoSave";

/**
 * Edit a track's core fields (auto-saves) plus its parent album. Picking a Plex item auto-links the
 * parent album when it already exists (match by Plex key, then name) and it isn't already set.
 */
export function TrackGeneralForm({
  track,
}: {
  track: Track;
}) {
  const navigate = useNavigate();
  const update = useUpdateTrack();
  const {
    data: albums,
  } = useAlbums();
  const {
    t,
  } = useTranslation();

  function handlePlexSelected(item: PlexItemResult) {
    if (track.albumId) return;
    const parentId = matchPlexParentId(item, albums ?? [], {
      ratingKeyField: "parentRatingKey",
      titleField: "parentTitle",
    });
    if (!parentId) return;
    update.mutate(
      {
        id: track.id,
        input: {
          albumId: parentId,
        },
      },
      {
        onSuccess: () => notifyFieldSaved(t("Album")),
      },
    );
  }

  return (
    <PlexTitleGeneralForm
      entity={track}
      kind="track"
      ownerType="track"
      update={update}
      onRenamed={slug => void navigate({
        to: "/taxonomies/tracks/$trackSlug/edit/general",
        params: {
          trackSlug: slug,
        },
      })}
      renderExtra={<TrackAlbumField track={track} />}
      onPlexSelected={handlePlexSelected}
      base="tracks"
      imagesApi={tracksApi.images}
      queryKeyPrefix="track-images"
    />
  );
}
