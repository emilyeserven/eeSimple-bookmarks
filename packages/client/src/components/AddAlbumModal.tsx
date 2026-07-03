import type { Album } from "@eesimple/types";

import { PlexTitleForm } from "./PlexTitleForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddAlbumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created album so the opener can select it. */
  onCreated?: (album: Album) => void;
}

/** Full create-album form (name, Plex lookup, media property) inside a dialog. */
export function AddAlbumModal({
  open, onOpenChange, onCreated,
}: AddAlbumModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New album</DialogTitle>
          <DialogDescription>
            Give the album a name, or look it up on Plex to fill in its details automatically.
          </DialogDescription>
        </DialogHeader>

        <PlexTitleForm
          kind="album"
          onCreated={(item) => {
            onCreated?.(item as Album);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
