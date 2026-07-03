import type { Episode, PlexItemResult } from "@eesimple/types";

import { useState } from "react";

import { AddTvShowModal } from "./AddTvShowModal";
import { Combobox } from "./Combobox";
import { PlexTitleForm } from "./PlexTitleForm";
import { useTvShows } from "../hooks/useTvShows";
import { matchPlexParentId } from "../lib/plexParent";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AddEpisodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created episode so the opener can select it. */
  onCreated?: (episode: Episode) => void;
}

/**
 * Full create-episode form inside a dialog. Enter a name (or look it up on Plex) and optionally pick
 * a parent TV show — a Plex pick auto-selects the show when it already exists. The TV-show picker uses
 * the manual `AddTvShowModal` pattern (not `useEntityCreateOption`) to avoid the AddXModal import cycle.
 */
export function AddEpisodeModal({
  open, onOpenChange, onCreated,
}: AddEpisodeModalProps) {
  const {
    data: tvShows,
  } = useTvShows();
  const [tvShowId, setTvShowId] = useState("");
  const [addTvShowOpen, setAddTvShowOpen] = useState(false);

  function handleCandidate(item: PlexItemResult) {
    if (tvShowId) return;
    const parentId = matchPlexParentId(item, tvShows ?? [], {
      ratingKeyField: "grandparentRatingKey",
      titleField: "grandparentTitle",
    });
    if (parentId) setTvShowId(parentId);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New episode</DialogTitle>
          <DialogDescription>
            Give the episode a name, or look it up on Plex to fill in its details automatically.
          </DialogDescription>
        </DialogHeader>

        <PlexTitleForm
          kind="episode"
          onCreated={(item) => {
            onCreated?.(item as Episode);
            onOpenChange(false);
          }}
          extraFields={(
            <div className="space-y-1.5">
              <Label>TV show</Label>
              <Combobox
                aria-label="TV show"
                options={(tvShows ?? []).map(show => ({
                  value: show.id,
                  label: show.name,
                }))}
                value={tvShowId || undefined}
                onValueChange={value => setTvShowId(value ?? "")}
                placeholder="No TV show"
                searchPlaceholder="Search TV shows…"
                emptyText="No TV shows found."
                createOption={{
                  label: "Create TV show",
                  onSelect: () => setAddTvShowOpen(true),
                }}
              />
              <AddTvShowModal
                open={addTvShowOpen}
                onOpenChange={setAddTvShowOpen}
                onCreated={show => setTvShowId(show.id)}
              />
            </div>
          )}
          buildExtraInput={() => ({
            tvShowId: tvShowId || null,
          })}
          onCandidateSelected={handleCandidate}
        />
      </DialogContent>
    </Dialog>
  );
}
