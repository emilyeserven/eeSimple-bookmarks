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

/** Which taxonomy the created Plex title landed in, plus its id — lets the opener set the right FK. */
export interface CreatedPlexTitle {
  kind: "movie" | "show";
  id: string;
}

interface AddPlexTitleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created Movie/TV Show (kind + id) so the opener can link it. */
  onCreated?: (created: CreatedPlexTitle) => void;
}

/**
 * Create a Movie or a TV Show from one dialog — a kind toggle over the shared `PlexTitleForm`. Used by
 * the bookmark's unified Plex-item picker so inline-create works for both kinds from a single combobox.
 */
export function AddPlexTitleModal({
  open, onOpenChange, onCreated,
}: AddPlexTitleModalProps) {
  const [kind, setKind] = useState<"movie" | "show">("movie");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Plex title</DialogTitle>
          <DialogDescription>
            Create a movie or TV show, or look it up on Plex to fill in its details automatically.
          </DialogDescription>
        </DialogHeader>

        <ToggleGroup
          type="single"
          value={kind}
          onValueChange={(value) => {
            if (value === "movie" || value === "show") setKind(value);
          }}
          className="justify-start"
        >
          <ToggleGroupItem value="movie">Movie</ToggleGroupItem>
          <ToggleGroupItem value="show">TV Show</ToggleGroupItem>
        </ToggleGroup>

        <PlexTitleForm
          kind={kind}
          onCreated={(item) => {
            onCreated?.({
              kind,
              id: item.id,
            });
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
