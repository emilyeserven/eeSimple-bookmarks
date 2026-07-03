import type { Album, PlexItemResult } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { AlbumArtistsSection } from "./AlbumArtistsSection";
import { PlexTitleGeneralForm } from "./PlexTitleGeneralForm";
import { useAlbumPlexAutofetch, useUpdateAlbum } from "../hooks/useAlbums";
import { useArtists, useCreateArtist } from "../hooks/useArtists";
import { resolveArtistNames, splitArtistNames } from "../lib/artistNames";

import { notifyFieldSaved } from "@/lib/autoSave";

/**
 * Edit an album's core fields (auto-saves) plus its many-to-many artists. Picking a Plex item
 * prefills the artists from the album's Plex artist (`parentTitle`, split on `;`) when no artists
 * are set yet — find-or-creating each through the shared `resolveArtistNames`.
 */
export function AlbumGeneralForm({
  album,
}: {
  album: Album;
}) {
  const navigate = useNavigate();
  const update = useUpdateAlbum();
  const autofetch = useAlbumPlexAutofetch();
  const {
    data: artists,
  } = useArtists();
  const createArtist = useCreateArtist();

  async function handlePlexSelected(item: PlexItemResult) {
    if (album.artistIds.length > 0 || !item.parentTitle) return;
    const ids = await resolveArtistNames(
      splitArtistNames(item.parentTitle),
      artists ?? [],
      createArtist,
    );
    if (ids.length === 0) return;
    update.mutate(
      {
        id: album.id,
        input: {
          artistIds: ids,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Artists"),
      },
    );
  }

  return (
    <PlexTitleGeneralForm
      entity={album}
      kind="album"
      update={update}
      onRenamed={slug => void navigate({
        to: "/taxonomies/albums/$albumSlug/edit/general",
        params: {
          albumSlug: slug,
        },
      })}
      renderExtra={<AlbumArtistsSection album={album} />}
      onPlexSelected={item => void handlePlexSelected(item)}
      autofetch={autofetch}
    />
  );
}
