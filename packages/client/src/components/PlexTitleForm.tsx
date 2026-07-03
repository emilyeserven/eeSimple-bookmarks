import type { Album, Episode, Movie, PlexItemResult, Track, TvShow } from "@eesimple/types";
import type { ReactNode } from "react";

import { useState } from "react";

import { Clapperboard, X } from "lucide-react";

import { AddMediaPropertyModal } from "./AddMediaPropertyModal";
import { PlexItemLookup } from "./PlexItemLookup";
import { useCreateAlbum } from "../hooks/useAlbums";
import { useCreateEpisode } from "../hooks/useEpisodes";
import { useMediaProperties } from "../hooks/useMediaProperties";
import { useCreateMovie } from "../hooks/useMovies";
import { useCreateTrack } from "../hooks/useTracks";
import { useCreateTvShow } from "../hooks/useTvShows";

/**
 * The five Plex-backed taxonomies that can be *created* from this form (Artists were collapsed into
 * People/Publishers, so they're no longer a createable media taxonomy — though `"artist"` remains a
 * `PlexKind` for the People/Publisher Plex lookup).
 */
export type PlexCreateKind = "movie" | "show" | "episode" | "album" | "track";

import { Combobox } from "@/components/Combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** The Plex linkage a lookup fills in; held together so the "linked" chip and payload stay in sync. */
interface PlexLink {
  plexRatingKey: string | null;
  plexItemType: string | null;
  plexItemTitle: string | null;
  year: number | null;
}

const EMPTY_PLEX: PlexLink = {
  plexRatingKey: null,
  plexItemType: null,
  plexItemTitle: null,
  year: null,
};

/** Any of the five Plex-backed taxonomy rows a create returns. */
type PlexCreatedTitle = Movie | TvShow | Episode | Album | Track;

const NOUNS: Record<PlexCreateKind, string> = {
  movie: "movie",
  show: "TV show",
  episode: "episode",
  album: "album",
  track: "track",
};

interface PlexTitleFormProps {
  /** Which taxonomy this form creates — narrows the Plex lookup and the create mutation. */
  kind: PlexCreateKind;
  /** Called with the created row (to select it, or navigate to its edit page). */
  onCreated?: (item: PlexCreatedTitle) => void;
  /** Extra inputs rendered below the media-property picker (e.g. an Episode's parent TV Show). */
  extraFields?: ReactNode;
  /** Extra create-payload keys merged into the mutation input (e.g. `{ tvShowId }`). */
  buildExtraInput?: () => Record<string, unknown>;
  /** Invoked when a Plex search result is picked, for parent autofill in the wrapper. */
  onCandidateSelected?: (item: PlexItemResult) => void;
}

/**
 * Shared create form for any Plex-backed taxonomy (chosen by `kind`). Enter a name, or look the title
 * up on Plex to autofill the name / rating key / year. Optionally group it under a media property.
 * Wrappers with a parent association (Episodes → TV Show, Tracks → Album) pass `extraFields` (the
 * parent picker), `buildExtraInput` (its create-payload key), and `onCandidateSelected` (parent
 * autofill). Submit-driven; the edit tabs auto-save.
 *
 * The media-property picker intentionally uses the manual `useState` + `AddMediaPropertyModal` pattern
 * rather than `useEntityCreateOption` — the `AddXModal`s wrap this component and are imported by
 * `useEntityCreateOption`'s registry, so calling the hook here would create an import cycle. Same
 * rationale as `BookForm` / `LocationForm`.
 */
export function PlexTitleForm({
  kind,
  onCreated,
  extraFields,
  buildExtraInput,
  onCandidateSelected,
}: PlexTitleFormProps) {
  const create = {
    movie: useCreateMovie(),
    show: useCreateTvShow(),
    episode: useCreateEpisode(),
    album: useCreateAlbum(),
    track: useCreateTrack(),
  }[kind];
  const {
    data: mediaProperties,
  } = useMediaProperties();

  const [name, setName] = useState("");
  const [romanizedName, setRomanizedName] = useState("");
  const [mediaPropertyId, setMediaPropertyId] = useState<string>("");
  const [plex, setPlex] = useState<PlexLink>(EMPTY_PLEX);
  const [addMediaPropertyOpen, setAddMediaPropertyOpen] = useState(false);

  function applyCandidate(item: PlexItemResult) {
    // Fill the name only when empty, so a deliberate title isn't overwritten by a search pick.
    setName(current => current.trim() || item.title);
    setPlex({
      plexRatingKey: item.ratingKey,
      plexItemType: item.type,
      plexItemTitle: item.title,
      year: item.year,
    });
    onCandidateSelected?.(item);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    create.mutate(
      {
        name: trimmed,
        romanizedName: romanizedName.trim() || null,
        mediaPropertyId: mediaPropertyId || null,
        ...plex,
        ...buildExtraInput?.(),
      },
      {
        onSuccess: onCreated,
      },
    );
  }

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
          placeholder="e.g. The title"
          value={name}
          onChange={event => setName(event.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="plex-title-romanized-name">Romanized name</Label>
        <Input
          id="plex-title-romanized-name"
          placeholder="Optional romanized form"
          value={romanizedName}
          onChange={event => setRomanizedName(event.target.value)}
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
              Linked to Plex: {plex.plexItemTitle ?? "Untitled"}{plex.year ? ` (${plex.year})` : ""}
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

      {extraFields}

      {create.isError
        ? <p className="text-sm text-destructive">{create.error.message}</p>
        : null}

      <Button
        type="submit"
        disabled={create.isPending || name.trim().length === 0}
      >
        {create.isPending ? "Creating…" : `Create ${NOUNS[kind]}`}
      </Button>
    </form>
  );
}
