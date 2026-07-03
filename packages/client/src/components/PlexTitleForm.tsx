import type { Movie, PlexItemResult, TvShow } from "@eesimple/types";

import { useState } from "react";

import { Clapperboard, X } from "lucide-react";

import { AddMediaPropertyModal } from "./AddMediaPropertyModal";
import { PlexItemLookup } from "./PlexItemLookup";
import { useMediaProperties } from "../hooks/useMediaProperties";
import { useCreateMovie } from "../hooks/useMovies";
import { useCreateTvShow } from "../hooks/useTvShows";

import { Combobox } from "@/components/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** The Plex linkage a lookup fills in; held together so the "linked" chip and payload stay in sync. */
interface PlexLink {
  plexRatingKey: string | null;
  plexItemType: string | null;
  year: number | null;
}

const EMPTY_PLEX: PlexLink = {
  plexRatingKey: null,
  plexItemType: null,
  year: null,
};

interface PlexTitleFormProps {
  /** Which taxonomy this form creates — narrows the Plex lookup and the create mutation. */
  kind: "movie" | "show";
  /** Called with the created Movie/TV Show (to select it, or navigate to its edit page). */
  onCreated?: (item: Movie | TvShow) => void;
}

/**
 * Shared create form for a Movie or TV Show (chosen by `kind`). Modeled on `BookForm`: enter a name,
 * or look the title up on Plex to autofill the name / rating key / year. Optionally group it under a
 * media property. Submit-driven (create keeps a Save button); the edit tabs auto-save.
 *
 * The media-property picker intentionally uses the manual `useState` + `AddMediaPropertyModal` pattern
 * rather than `useEntityCreateOption` — `AddMovieModal`/`AddTvShowModal` wrap this component and are
 * imported by `useEntityCreateOption`'s registry, so calling the hook here would create an import
 * cycle. Same rationale as `BookForm` / `LocationForm`.
 */
export function PlexTitleForm({
  kind,
  onCreated,
}: PlexTitleFormProps) {
  const createMovie = useCreateMovie();
  const createTvShow = useCreateTvShow();
  const create = kind === "movie" ? createMovie : createTvShow;
  const {
    data: mediaProperties,
  } = useMediaProperties();

  const [name, setName] = useState("");
  const [mediaPropertyId, setMediaPropertyId] = useState<string>("");
  const [plex, setPlex] = useState<PlexLink>(EMPTY_PLEX);
  const [addMediaPropertyOpen, setAddMediaPropertyOpen] = useState(false);

  function applyCandidate(item: PlexItemResult) {
    // Fill the name only when empty, so a deliberate title isn't overwritten by a search pick.
    setName(current => current.trim() || item.title);
    setPlex({
      plexRatingKey: item.ratingKey,
      plexItemType: item.type,
      year: item.year,
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    create.mutate(
      {
        name: trimmed,
        mediaPropertyId: mediaPropertyId || null,
        ...plex,
      },
      {
        onSuccess: onCreated,
      },
    );
  }

  const noun = kind === "movie" ? "movie" : "TV show";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <PlexItemLookup
        kind={kind}
        onSelect={applyCandidate}
      />

      <div className="space-y-1.5">
        <Label htmlFor="plex-title-name">Name</Label>
        <Input
          id="plex-title-name"
          placeholder={kind === "movie" ? "e.g. The Fellowship of the Ring" : "e.g. The Expanse"}
          value={name}
          onChange={event => setName(event.target.value)}
          autoFocus
        />
      </div>

      {plex.plexRatingKey !== null
        ? (
          <div
            className="
              flex items-center gap-2 rounded-md border px-3 py-2 text-sm
            "
          >
            <Clapperboard className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">
              Linked to Plex{plex.year ? ` (${plex.year})` : ""}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              aria-label="Clear Plex link"
              onClick={() => setPlex(EMPTY_PLEX)}
            >
              <X className="size-4" />
            </Button>
          </div>
        )
        : null}

      <div className="space-y-1.5">
        <Label>Media property</Label>
        <Combobox
          aria-label="Media property"
          options={(mediaProperties ?? []).map(prop => ({
            value: prop.id,
            label: prop.name,
          }))}
          value={mediaPropertyId || undefined}
          onValueChange={value => setMediaPropertyId(value ?? "")}
          placeholder="No media property"
          searchPlaceholder="Search media properties…"
          emptyText="No media properties found."
          createOption={{
            label: "Create media property",
            onSelect: () => setAddMediaPropertyOpen(true),
          }}
        />
      </div>
      <AddMediaPropertyModal
        open={addMediaPropertyOpen}
        onOpenChange={setAddMediaPropertyOpen}
        onCreated={mediaProperty => setMediaPropertyId(mediaProperty.id)}
      />

      {create.isError
        ? <p className="text-sm text-destructive">{create.error.message}</p>
        : null}

      <Button
        type="submit"
        disabled={create.isPending || name.trim().length === 0}
      >
        {create.isPending ? "Creating…" : `Create ${noun}`}
      </Button>
    </form>
  );
}
