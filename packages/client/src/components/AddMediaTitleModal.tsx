import type { CreatedMediaTitle, MediaTaxoKey } from "./useBookmarkMediaField";

import { useState } from "react";

import { BookForm } from "./BookForm";
import { PlexTitleForm } from "./PlexTitleForm";
import { PodcastForm } from "./PodcastForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Which taxonomy a create-modal kind toggle targets (the seven bookmark-linkable media taxonomies). */
type CreateKind = "book" | "movie" | "show" | "episode" | "album" | "track" | "podcast";

/** Each create kind, its toggle label, and the bookmark FK a created row of that kind fills in. */
const KIND_OPTIONS: { kind: CreateKind;
  label: string;
  key: MediaTaxoKey; }[] = [
  {
    kind: "book",
    label: "Book",
    key: "bookId",
  },
  {
    kind: "podcast",
    label: "Podcast",
    key: "podcastId",
  },
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
    kind: "track",
    label: "Track",
    key: "trackId",
  },
];

interface AddMediaTitleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created title (FK key + id) so the opener can link it. */
  onCreated?: (created: CreatedMediaTitle) => void;
}

/**
 * Create any of the six bookmark-linkable Media Properties taxonomy rows from one dialog — a kind
 * toggle over `BookForm` (Book, with its own Kavita lookup) and the shared `PlexTitleForm` (the other
 * five kinds). Used by the bookmark's unified Media picker so inline-create works for every kind from
 * one combobox.
 */
export function AddMediaTitleModal({
  open, onOpenChange, onCreated,
}: AddMediaTitleModalProps) {
  const [kind, setKind] = useState<CreateKind>("book");
  const active = KIND_OPTIONS.find(option => option.kind === kind) ?? KIND_OPTIONS[0];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New media title</DialogTitle>
          <DialogDescription>
            Create a book, movie, TV show, episode, album, or track — or look it up on
            Kavita or Plex to fill in its details automatically.
          </DialogDescription>
        </DialogHeader>

        <ToggleGroup
          type="single"
          value={kind}
          onValueChange={(value) => {
            if (KIND_OPTIONS.some(option => option.kind === value)) setKind(value as CreateKind);
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

        {kind === "book"
          ? (
            <BookForm
              onCreated={(book) => {
                onCreated?.({
                  key: "bookId",
                  id: book.id,
                });
                onOpenChange(false);
              }}
            />
          )
          : kind === "podcast"
            ? (
              <PodcastForm
                onCreated={(podcast) => {
                  onCreated?.({
                    key: "podcastId",
                    id: podcast.id,
                  });
                  onOpenChange(false);
                }}
              />
            )
            : (
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
            )}
      </DialogContent>
    </Dialog>
  );
}
