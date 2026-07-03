import type { Artist } from "@eesimple/types";

import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useAlbums } from "../hooks/useAlbums";
import { useUpdateArtist } from "../hooks/useArtists";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

import { Label } from "@/components/ui/label";

/**
 * Artist ↔ Album association for an artist's edit General tab (rendered via `renderExtra`) — the
 * mirror of {@link AlbumArtistsSection}. A `MultiCombobox` over all albums that auto-saves
 * `albumIds`, with inline album creation via `useEntityCreateOption`.
 */
export function ArtistAlbumsSection({
  artist,
}: {
  artist: Artist;
}) {
  const {
    data: albums,
  } = useAlbums();
  const update = useUpdateArtist();

  function saveAlbumIds(albumIds: string[]) {
    update.mutate(
      {
        id: artist.id,
        input: {
          albumIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Albums"),
        onError: error => notifyFieldSaveError("Albums", describeError(error)),
      },
    );
  }

  const create = useEntityCreateOption("album", album =>
    saveAlbumIds([...new Set([...artist.albumIds, album.id])]));

  return (
    <div className="space-y-2">
      <Label>Albums</Label>
      <MultiCombobox
        aria-label="Albums"
        options={(albums ?? []).map(album => ({
          value: album.id,
          label: album.name,
        }))}
        values={artist.albumIds}
        onValuesChange={saveAlbumIds}
        placeholder="No albums"
        searchPlaceholder="Search albums…"
        emptyText="No albums found."
        createOption={create.createOption}
      />
      {create.modal}
    </div>
  );
}

/** Read-only list of an artist's albums for its General view (rendered via `renderExtra`). */
export function ArtistAlbumsValue({
  artist,
}: {
  artist: Artist;
}) {
  const {
    data: albums,
  } = useAlbums();
  const credited = (albums ?? []).filter(album => artist.albumIds.includes(album.id));
  return (
    <>
      <dt className="text-muted-foreground">Albums</dt>
      <dd>
        {credited.length > 0
          ? credited.map(album => album.name).join(", ")
          : <span className="text-muted-foreground">None</span>}
      </dd>
    </>
  );
}
