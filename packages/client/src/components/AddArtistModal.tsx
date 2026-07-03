import type { Artist } from "@eesimple/types";

import { PlexTitleForm } from "./PlexTitleForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddArtistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created artist so the opener can select it. */
  onCreated?: (artist: Artist) => void;
}

/** Full create-artist form (name, Plex lookup, media property) inside a dialog. */
export function AddArtistModal({
  open, onOpenChange, onCreated,
}: AddArtistModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New artist</DialogTitle>
          <DialogDescription>
            Give the artist a name, or look it up on Plex to fill in its details automatically.
          </DialogDescription>
        </DialogHeader>

        <PlexTitleForm
          kind="artist"
          onCreated={(item) => {
            onCreated?.(item as Artist);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
