import type { Bookmark, PlexItemResult } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useConnectors } from "../hooks/useConnectors";
import { useMovies } from "../hooks/useMovies";
import { useTvShows } from "../hooks/useTvShows";
import { plexApi } from "../lib/api/plex";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/** A Plex-item link selection: exactly one of the taxonomy pair or the direct-item trio is set. */
export interface PlexItemSelection {
  movieId: string | null;
  tvShowId: string | null;
  plexRatingKey: string | null;
  plexItemType: string | null;
  plexItemTitle: string | null;
}

export const EMPTY_PLEX_SELECTION: PlexItemSelection = {
  movieId: null,
  tvShowId: null,
  plexRatingKey: null,
  plexItemType: null,
  plexItemTitle: null,
};

/**
 * Owns the state and selection logic behind `BookmarkPlexItemField`: the popover/search state, the
 * locally-filtered Movies/TV Shows taxonomy lists, the debounced live Plex search (all item types),
 * and the handlers that resolve a click into a `PlexItemSelection`. Kept separate from the component
 * so the JSX stays a thin shell (the `useBookmarkFormController` pattern — see the
 * `decompose-over-cap` skill).
 */
export function useBookmarkPlexItemField(bookmark: Bookmark, onSelect: (selection: PlexItemSelection) => void) {
  const {
    data: movies,
  } = useMovies();
  const {
    data: tvShows,
  } = useTvShows();
  const {
    data: connectors,
  } = useConnectors();

  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const trimmedQuery = debouncedQuery.trim();
  const liveSearchApplicable = Boolean(connectors?.plex.enabled) && trimmedQuery.length >= MIN_QUERY_LENGTH;
  const liveSearch = useQuery({
    queryKey: ["plex-item-search", trimmedQuery],
    queryFn: () => plexApi.searchItems(trimmedQuery),
    enabled: liveSearchApplicable,
  });
  // Whether the live search has stopped being able to produce more results for the current query —
  // either it doesn't apply (no connector, or the query's too short) or it's already resolved. Used
  // to gate the "no matching items" empty state so it doesn't flash before a debounced search settles.
  const liveSearchSettled = !liveSearchApplicable || liveSearch.isSuccess || liveSearch.isError;

  const term = query.trim().toLowerCase();
  const filteredMovies = (movies ?? []).filter(movie => movie.name.toLowerCase().includes(term));
  const filteredTvShows = (tvShows ?? []).filter(show => show.name.toLowerCase().includes(term));

  const linkedMovie = (movies ?? []).find(movie => movie.id === bookmark.movieId);
  const linkedTvShow = (tvShows ?? []).find(show => show.id === bookmark.tvShowId);
  const selectedLabel = linkedMovie?.name
    ?? linkedTvShow?.name
    ?? (bookmark.plexRatingKey !== null ? (bookmark.plexItemTitle ?? `Item ${bookmark.plexRatingKey}`) : null);

  function closeAndReset(): void {
    setOpen(false);
    setQuery("");
  }

  function selectTitle(kind: "movie" | "show", id: string): void {
    onSelect({
      ...EMPTY_PLEX_SELECTION,
      movieId: kind === "movie" ? id : null,
      tvShowId: kind === "show" ? id : null,
    });
    closeAndReset();
  }

  /** Reuses an already-curated title's id when a live result matches one by rating key. */
  function selectItem(item: PlexItemResult): void {
    if (item.type === "movie" || item.type === "show") {
      const existingId = item.type === "movie"
        ? (movies ?? []).find(movie => movie.plexRatingKey === item.ratingKey)?.id
        : (tvShows ?? []).find(show => show.plexRatingKey === item.ratingKey)?.id;
      if (existingId) {
        selectTitle(item.type, existingId);
        return;
      }
    }
    onSelect({
      ...EMPTY_PLEX_SELECTION,
      plexRatingKey: item.ratingKey,
      plexItemType: item.type,
      plexItemTitle: item.title,
    });
    closeAndReset();
  }

  function unlink(): void {
    onSelect(EMPTY_PLEX_SELECTION);
    setOpen(false);
  }

  function createTitle(kind: "movie" | "show", id: string): void {
    selectTitle(kind, id);
  }

  return {
    open,
    setOpen,
    addOpen,
    setAddOpen,
    query,
    setQuery,
    trimmedQuery,
    liveSearch,
    liveSearchSettled,
    filteredMovies,
    filteredTvShows,
    selectedLabel,
    isLinked: selectedLabel !== null,
    selectTitle,
    selectItem,
    unlink,
    createTitle,
  };
}
