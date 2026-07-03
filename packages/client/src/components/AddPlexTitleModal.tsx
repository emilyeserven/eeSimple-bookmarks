import type { PlexTaxoKey } from "./useBookmarkPlexItemField";
import type { PlexKind } from "@/lib/plexParent";

import { useState } from "react";

import { PlexTitleForm } from "./PlexTitleForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Which Plex FK the created title fills in, plus its id — lets the opener set the right bookmark FK. */
export interface CreatedPlexTitle {
  key: PlexTaxoKey;
  id: string;
}

/** Each create kind, its toggle label, and the bookmark FK a created row of that kind fills in. */
const KIND_OPTIONS: { kind: PlexKind;
  label: string;
  key: PlexTaxoKey; }[] = [
  {
    kind: "movie",
    label: "Movie",
    key: "movieId",
  },
  {
    kind: "show",
    label: "TV Show",
    key: "tvShowId",
  },
  {
    kind: "episode",
    label: "Episode",
    key: "episodeId",
  },
  {
    kind: "album",
    label: "Album",
    key: "albumId",
  },
  {
    kind: "artist",
    label: "Artist",
    key: "artistId",
  },
  {
    kind: "track",
    label: "Track",
    key: "trackId",
  },
];

interface AddPlexTitleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created title (FK key + id) so the opener can link it. */
  onCreated?: (created: CreatedPlexTitle) => void;
}

/**
 * Create any of the six Plex-backed taxonomy rows from one dialog — a kind toggle over the shared
 * `PlexTitleForm`. Used by the bookmark's unified Plex-item picker so inline-create works for every
 * kind from a single combobox.
 */
export function AddPlexTitleModal({
  open, onOpenChange, onCreated,
}: AddPlexTitleModalProps) {
  const [kind, setKind] = useState<PlexKind>("movie");
  const active = KIND_OPTIONS.find(option => option.kind === kind) ?? KIND_OPTIONS[0];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Plex title</DialogTitle>
          <DialogDescription>
            Create a movie, TV show, episode, album, artist, or track — or look it up on Plex to fill
            in its details automatically.
          </DialogDescription>
        </DialogHeader>

        <ToggleGroup
          type="single"
          value={kind}
          onValueChange={(value) => {
            if (KIND_OPTIONS.some(option => option.kind === value)) setKind(value as PlexKind);
          }}
          className="flex-wrap justify-start"
        >
          {KIND_OPTIONS.map(option => (
            <ToggleGroupItem
              key={option.kind}
              value={option.kind}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <PlexTitleForm
          kind={kind}
          onCreated={(item) => {
            onCreated?.({
              key: active.key,
              id: item.id,
            });
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
