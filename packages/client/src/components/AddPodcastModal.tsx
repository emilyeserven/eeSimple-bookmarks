import type { Podcast } from "@eesimple/types";

import { PodcastForm } from "./PodcastForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddPodcastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created podcast so the opener can select it. */
  onCreated?: (podcast: Podcast) => void;
}

/** Full create-podcast form (name, feed URL, media property) inside a dialog. */
export function AddPodcastModal({
  open, onOpenChange, onCreated,
}: AddPodcastModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New podcast</DialogTitle>
          <DialogDescription>
            Give the podcast a name, or paste its RSS feed URL to sync its details later.
          </DialogDescription>
        </DialogHeader>

        <PodcastForm
          onCreated={(podcast) => {
            onCreated?.(podcast);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
