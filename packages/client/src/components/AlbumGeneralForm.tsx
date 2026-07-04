import type { Album, PlexItemResult } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { AlbumCreditsSection } from "./AlbumCreditsSection";
import { PlexTitleGeneralForm } from "./PlexTitleGeneralForm";
import { useUpdateAlbum } from "../hooks/useAlbums";
import { usePeople, useCreatePerson } from "../hooks/usePeople";
import { albumsApi } from "../lib/api/taxonomies";
import { resolvePersonNames, splitCreditNames } from "../lib/creditNames";

import { notifyFieldSaved } from "@/lib/autoSave";

/**
 * Edit an album's core fields (auto-saves) plus its People/Publisher credits. Picking a Plex item
 * prefills the People credits from the album's Plex artist (`parentTitle`, split on `;`) when no
 * credits are set yet — find-or-creating each Person through the shared `resolvePersonNames`. Group
 * artists can be re-credited to Publishers by hand afterward.
 */
export function AlbumGeneralForm({
  album,
}: {
  album: Album;
}) {
  const navigate = useNavigate();
  const update = useUpdateAlbum();
  const {
    data: people,
  } = usePeople();
  const createPerson = useCreatePerson();

  async function handlePlexSelected(item: PlexItemResult) {
    if (album.personIds.length > 0 || album.groupIds.length > 0 || !item.parentTitle) return;
    const ids = await resolvePersonNames(
      splitCreditNames(item.parentTitle),
      people ?? [],
      createPerson,
    );
    if (ids.length === 0) return;
    update.mutate(
      {
        id: album.id,
        input: {
          personIds: ids,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("People"),
      },
    );
  }

  return (
    <PlexTitleGeneralForm
      entity={album}
      kind="album"
      ownerType="album"
      update={update}
      onRenamed={slug => void navigate({
        to: "/taxonomies/albums/$albumSlug/edit/general",
        params: {
          albumSlug: slug,
        },
      })}
      renderExtra={<AlbumCreditsSection album={album} />}
      onPlexSelected={item => void handlePlexSelected(item)}
      base="albums"
      imagesApi={albumsApi.images}
      queryKeyPrefix="album-images"
    />
  );
}
