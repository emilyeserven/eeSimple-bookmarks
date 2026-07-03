import type { Artist } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { ArtistAlbumsSection } from "./ArtistAlbumsSection";
import { PlexTitleGeneralForm } from "./PlexTitleGeneralForm";
import { useUpdateArtist } from "../hooks/useArtists";
import { artistsApi } from "../lib/api/taxonomies";

/** Edit an artist's core fields (auto-saves) plus its many-to-many albums. */
export function ArtistGeneralForm({
  artist,
}: {
  artist: Artist;
}) {
  const navigate = useNavigate();
  const update = useUpdateArtist();
  return (
    <PlexTitleGeneralForm
      entity={artist}
      kind="artist"
      update={update}
      onRenamed={slug => void navigate({
        to: "/taxonomies/artists/$artistSlug/edit/general",
        params: {
          artistSlug: slug,
        },
      })}
      renderExtra={<ArtistAlbumsSection artist={artist} />}
      base="artists"
      imagesApi={artistsApi.images}
      queryKeyPrefix="artist-images"
    />
  );
}
