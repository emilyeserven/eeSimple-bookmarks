import type { PlexItemResult, Track } from "@eesimple/types";

import { useState } from "react";

import { AddAlbumModal } from "./AddAlbumModal";
import { Combobox } from "./Combobox";
import { PlexTitleForm } from "./PlexTitleForm";
import { useAlbums } from "../hooks/useAlbums";
import { matchPlexParentId } from "../lib/plexParent";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AddTrackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created track so the opener can select it. */
  onCreated?: (track: Track) => void;
}

/**
 * Full create-track form inside a dialog. Enter a name (or look it up on Plex) and optionally pick a
 * parent album — a Plex pick auto-selects the album when it already exists. The album picker uses the
 * manual `AddAlbumModal` pattern (not `useEntityCreateOption`) to avoid the AddXModal import cycle.
 */
export function AddTrackModal({
  open, onOpenChange, onCreated,
}: AddTrackModalProps) {
  const {
    data: albums,
  } = useAlbums();
  const [albumId, setAlbumId] = useState("");
  const [addAlbumOpen, setAddAlbumOpen] = useState(false);

  function handleCandidate(item: PlexItemResult) {
    if (albumId) return;
    const parentId = matchPlexParentId(item, albums ?? [], {
      ratingKeyField: "parentRatingKey",
      titleField: "parentTitle",
    });
    if (parentId) setAlbumId(parentId);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New track</DialogTitle>
          <DialogDescription>
            Give the track a name, or look it up on Plex to fill in its details automatically.
          </DialogDescription>
        </DialogHeader>

        <PlexTitleForm
          kind="track"
          onCreated={(item) => {
            onCreated?.(item as Track);
            onOpenChange(false);
          }}
          extraFields={(
            <div className="space-y-1.5">
              <Label>Album</Label>
              <Combobox
                aria-label="Album"
                options={(albums ?? []).map(album => ({
                  value: album.id,
                  label: album.name,
                }))}
                value={albumId || undefined}
                onValueChange={value => setAlbumId(value ?? "")}
                placeholder="No album"
                searchPlaceholder="Search albums…"
                emptyText="No albums found."
                createOption={{
                  label: "Create album",
                  onSelect: () => setAddAlbumOpen(true),
                }}
              />
              <AddAlbumModal
                open={addAlbumOpen}
                onOpenChange={setAddAlbumOpen}
                onCreated={album => setAlbumId(album.id)}
              />
            </div>
          )}
          buildExtraInput={() => ({
            albumId: albumId || null,
          })}
          onCandidateSelected={handleCandidate}
        />
      </DialogContent>
    </Dialog>
  );
}
