import type { Album } from "@eesimple/types";

import { useState } from "react";

import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useUpdateAlbum } from "../hooks/useAlbums";
import { useArtists, useCreateArtist } from "../hooks/useArtists";
import { describeError } from "../lib/apiError";
import { resolveArtistNames, splitArtistNames } from "../lib/artistNames";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Album ↔ Artist association for an album's edit General tab (rendered via `renderExtra`). A
 * `MultiCombobox` over all artists (auto-saves `artistIds`), inline-creates a single artist through
 * `useEntityCreateOption`, and a semicolon-delimited "bulk add" input that splits `;` and
 * find-or-creates each artist (via the shared `resolveArtistNames`). Auto-saves on every change.
 */
export function AlbumArtistsSection({
  album,
}: {
  album: Album;
}) {
  const {
    data: artists,
  } = useArtists();
  const update = useUpdateAlbum();
  const createArtist = useCreateArtist();
  const [bulk, setBulk] = useState("");

  function saveArtistIds(artistIds: string[]) {
    update.mutate(
      {
        id: album.id,
        input: {
          artistIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Artists"),
        onError: error => notifyFieldSaveError("Artists", describeError(error)),
      },
    );
  }

  const create = useEntityCreateOption("artist", artist =>
    saveArtistIds([...new Set([...album.artistIds, artist.id])]));

  async function addFromBulk() {
    const names = splitArtistNames(bulk);
    if (names.length === 0) return;
    const ids = await resolveArtistNames(names, artists ?? [], createArtist);
    if (ids.length > 0) saveArtistIds([...new Set([...album.artistIds, ...ids])]);
    setBulk("");
  }

  return (
    <div className="space-y-2">
      <Label>Artists</Label>
      <MultiCombobox
        aria-label="Artists"
        options={(artists ?? []).map(artist => ({
          value: artist.id,
          label: artist.name,
        }))}
        values={album.artistIds}
        onValuesChange={saveArtistIds}
        placeholder="No artists"
        searchPlaceholder="Search artists…"
        emptyText="No artists found."
        createOption={create.createOption}
      />
      {create.modal}
      <div className="flex gap-2">
        <Input
          value={bulk}
          onChange={event => setBulk(event.target.value)}
          placeholder="Add artists, separated by ;"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void addFromBulk();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void addFromBulk()}
        >
          Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Separate multiple artists with a semicolon; new artists are created automatically.
      </p>
    </div>
  );
}

/** Read-only list of an album's artists for its General view (rendered via `renderExtra`). */
export function AlbumArtistsValue({
  album,
}: {
  album: Album;
}) {
  const {
    data: artists,
  } = useArtists();
  const credited = (artists ?? []).filter(artist => album.artistIds.includes(artist.id));
  return (
    <>
      <dt className="text-muted-foreground">Artists</dt>
      <dd>
        {credited.length > 0
          ? credited.map(artist => artist.name).join(", ")
          : <span className="text-muted-foreground">None</span>}
      </dd>
    </>
  );
}
