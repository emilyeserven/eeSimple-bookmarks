import type { Bookmark } from "@eesimple/types";

import { useState } from "react";

import { AddPlexTitleModal } from "./AddPlexTitleModal";
import { BookmarkPlexDetailLink } from "./BookmarkPlexField";
import { useMovies } from "../hooks/useMovies";
import { useTvShows } from "../hooks/useTvShows";

import { Combobox } from "@/components/Combobox";
import { Label } from "@/components/ui/label";

/** The linked-title FK pair a selection resolves to (at most one set). */
export interface PlexTitleLink {
  movieId: string | null;
  tvShowId: string | null;
}

interface BookmarkPlexItemFieldProps {
  bookmark: Bookmark;
  /** Persists the selection (movie/show FK pair) — the controller's immediate-save handler. */
  onSelect: (link: PlexTitleLink) => void;
}

/**
 * Link a bookmark to a Movie or TV Show from the taxonomies. Replaces the old direct Plex-item picker:
 * Plex selection now flows through the Movies / TV Shows taxonomies, and each carries the Plex linkage
 * that powers poster / deep-link features. A single grouped picker spans both taxonomies; inline
 * "Create a Plex title…" opens the movie/TV-show create dialog. A bookmark still carrying a legacy
 * direct Plex link (no movie/show) shows that link read-only below, so old links stay reachable.
 */
export function BookmarkPlexItemField({
  bookmark,
  onSelect,
}: BookmarkPlexItemFieldProps) {
  const {
    data: movies,
  } = useMovies();
  const {
    data: tvShows,
  } = useTvShows();
  const [addOpen, setAddOpen] = useState(false);

  const value = bookmark.movieId ?? bookmark.tvShowId ?? undefined;
  const showLegacyPlex = bookmark.movieId === null
    && bookmark.tvShowId === null
    && bookmark.plexRatingKey !== null;

  function handleChange(selected: string | undefined): void {
    if (!selected) {
      onSelect({
        movieId: null,
        tvShowId: null,
      });
      return;
    }
    const isMovie = (movies ?? []).some(movie => movie.id === selected);
    onSelect({
      movieId: isMovie ? selected : null,
      tvShowId: isMovie ? null : selected,
    });
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="bookmark-plex-item">Plex item</Label>
      <Combobox
        id="bookmark-plex-item"
        aria-label="Plex item"
        groups={[
          {
            heading: "Movies",
            options: (movies ?? []).map(movie => ({
              value: movie.id,
              label: movie.name,
            })),
          },
          {
            heading: "TV Shows",
            options: (tvShows ?? []).map(show => ({
              value: show.id,
              label: show.name,
            })),
          },
        ]}
        value={value}
        onValueChange={handleChange}
        placeholder="No Plex item"
        searchPlaceholder="Search movies and TV shows…"
        emptyText="No movies or TV shows found."
        createOption={{
          label: "Create a Plex title…",
          onSelect: () => setAddOpen(true),
        }}
      />
      <AddPlexTitleModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={created => onSelect({
          movieId: created.kind === "movie" ? created.id : null,
          tvShowId: created.kind === "show" ? created.id : null,
        })}
      />
      {showLegacyPlex
        ? (
          <p className="text-xs text-muted-foreground">
            Legacy Plex link:
            {" "}
            <BookmarkPlexDetailLink bookmark={bookmark} />
          </p>
        )
        : null}
    </div>
  );
}
