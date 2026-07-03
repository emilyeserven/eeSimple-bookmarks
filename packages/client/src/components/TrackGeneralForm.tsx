import type { PlexItemResult, Track } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { PlexTitleGeneralForm } from "./PlexTitleGeneralForm";
import { TrackAlbumField } from "./TrackAlbumField";
import { useAlbums } from "../hooks/useAlbums";
import { useTrackPlexAutofetch, useUpdateTrack } from "../hooks/useTracks";
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
  const autofetch = useTrackPlexAutofetch();
  const {
    data: albums,
  } = useAlbums();

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
        onSuccess: () => notifyFieldSaved("Album"),
      },
    );
  }

  return (
    <PlexTitleGeneralForm
      entity={track}
      kind="track"
      update={update}
      onRenamed={slug => void navigate({
        to: "/taxonomies/tracks/$trackSlug/edit/general",
        params: {
          trackSlug: slug,
        },
      })}
      renderExtra={<TrackAlbumField track={track} />}
      onPlexSelected={handlePlexSelected}
      autofetch={autofetch}
    />
  );
}
