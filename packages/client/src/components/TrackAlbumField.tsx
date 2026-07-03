import type { Track } from "@eesimple/types";

import { Combobox } from "./Combobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useAlbums } from "../hooks/useAlbums";
import { useUpdateTrack } from "../hooks/useTracks";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

import { Label } from "@/components/ui/label";

/**
 * Auto-saving parent-album picker for a track's edit General tab (rendered via `renderExtra`).
 * Inline-creates an album through `useEntityCreateOption` (edit form — not in the AddXModal chain).
 */
export function TrackAlbumField({
  track,
}: {
  track: Track;
}) {
  const {
    data: albums,
  } = useAlbums();
  const update = useUpdateTrack();

  function save(albumId: string | null) {
    update.mutate(
      {
        id: track.id,
        input: {
          albumId,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Album"),
        onError: error => notifyFieldSaveError("Album", describeError(error)),
      },
    );
  }

  const create = useEntityCreateOption("album", album => save(album.id));

  return (
    <div className="space-y-1.5">
      <Label>Album</Label>
      <Combobox
        aria-label="Album"
        options={(albums ?? []).map(album => ({
          value: album.id,
          label: album.name,
        }))}
        value={track.albumId ?? undefined}
        onValueChange={value => save(value ?? null)}
        placeholder="No album"
        searchPlaceholder="Search albums…"
        emptyText="No albums found."
        createOption={create.createOption}
      />
      {create.modal}
    </div>
  );
}

/** Read-only parent-album rows for a track's General view (rendered via `renderExtra`). */
export function TrackAlbumValue({
  track,
}: {
  track: Track;
}) {
  const {
    data: albums,
  } = useAlbums();
  const album = track.albumId
    ? (albums ?? []).find(item => item.id === track.albumId)
    : undefined;
  return (
    <>
      <dt className="text-muted-foreground">Album</dt>
      <dd>{album?.name ?? <span className="text-muted-foreground">None</span>}</dd>
    </>
  );
}
