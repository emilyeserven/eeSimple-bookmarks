import type { Episode } from "@eesimple/types";

import { Combobox } from "./Combobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useUpdateEpisode } from "../hooks/useEpisodes";
import { useTvShows } from "../hooks/useTvShows";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";

import { Label } from "@/components/ui/label";

/**
 * Auto-saving parent-TV-show picker for an episode's edit General tab (rendered via `renderExtra`).
 * Inline-creates a TV show through `useEntityCreateOption` (edit form — not in the AddXModal chain).
 */
export function EpisodeTvShowField({
  episode,
}: {
  episode: Episode;
}) {
  const {
    data: tvShows,
  } = useTvShows();
  const update = useUpdateEpisode();

  function save(tvShowId: string | null) {
    update.mutate(
      {
        id: episode.id,
        input: {
          tvShowId,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("TV show"),
        onError: error => notifyFieldSaveError("TV show", describeError(error)),
      },
    );
  }

  const create = useEntityCreateOption("tv-show", tvShow => save(tvShow.id));

  return (
    <div className="space-y-1.5">
      <Label>TV show</Label>
      <Combobox
        aria-label="TV show"
        options={(tvShows ?? []).map(show => ({
          value: show.id,
          label: show.name,
        }))}
        value={episode.tvShowId ?? undefined}
        onValueChange={value => save(value ?? null)}
        placeholder="No TV show"
        searchPlaceholder="Search TV shows…"
        emptyText="No TV shows found."
        createOption={create.createOption}
      />
      {create.modal}
    </div>
  );
}

/** Read-only parent-TV-show rows for an episode's General view (rendered via `renderExtra`). */
export function EpisodeTvShowValue({
  episode,
}: {
  episode: Episode;
}) {
  const {
    data: tvShows,
  } = useTvShows();
  const show = episode.tvShowId
    ? (tvShows ?? []).find(item => item.id === episode.tvShowId)
    : undefined;
  return (
    <>
      <dt className="text-muted-foreground">TV show</dt>
      <dd>{show?.name ?? <span className="text-muted-foreground">None</span>}</dd>
    </>
  );
}
