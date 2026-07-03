import type { Bookmark, PlexItemResult } from "@eesimple/types";

import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useAlbums } from "../hooks/useAlbums";
import { useArtists } from "../hooks/useArtists";
import { useConnectors } from "../hooks/useConnectors";
import { useEpisodes } from "../hooks/useEpisodes";
import { useMovies } from "../hooks/useMovies";
import { useTracks } from "../hooks/useTracks";
import { useTvShows } from "../hooks/useTvShows";
import { plexApi } from "../lib/api/plex";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/** The bookmark FK column each Plex-backed taxonomy fills in (exactly one is ever set). */
export type PlexTaxoKey = "movieId" | "tvShowId" | "episodeId" | "albumId" | "artistId" | "trackId";

/** A Plex-item link selection: exactly one taxonomy FK, or the direct-item trio, is set. */
export interface PlexItemSelection {
  movieId: string | null;
  tvShowId: string | null;
  episodeId: string | null;
  albumId: string | null;
  artistId: string | null;
  trackId: string | null;
  plexRatingKey: string | null;
  plexItemType: string | null;
  plexItemTitle: string | null;
}

export const EMPTY_PLEX_SELECTION: PlexItemSelection = {
  movieId: null,
  tvShowId: null,
  episodeId: null,
  albumId: null,
  artistId: null,
  trackId: null,
  plexRatingKey: null,
  plexItemType: null,
  plexItemTitle: null,
};

/** The minimal shape each taxonomy row contributes to the picker. */
interface TaxoRow {
  id: string;
  name: string;
  plexRatingKey: string | null;
}

/** Ordered FK columns + section headings for the six Plex-backed taxonomies. */
const SECTION_META: { key: PlexTaxoKey;
  heading: string; }[] = [
  {
    key: "movieId",
    heading: "Movies",
  },
  {
    key: "tvShowId",
    heading: "TV Shows",
  },
  {
    key: "episodeId",
    heading: "Episodes",
  },
  {
    key: "albumId",
    heading: "Albums",
  },
  {
    key: "artistId",
    heading: "Artists",
  },
  {
    key: "trackId",
    heading: "Tracks",
  },
];

/** Maps a live Plex item `type` to the taxonomy FK it curates into (missing = direct-item only). */
const TYPE_TO_KEY: Record<string, PlexTaxoKey | undefined> = {
  movie: "movieId",
  show: "tvShowId",
  episode: "episodeId",
  album: "albumId",
  artist: "artistId",
  track: "trackId",
};

/** All six Plex-backed taxonomy lists, loaded once (own hook to spread the hook density). */
function usePlexTaxonomyLists(): Record<PlexTaxoKey, TaxoRow[]> {
  const {
    data: movies,
  } = useMovies();
  const {
    data: tvShows,
  } = useTvShows();
  const {
    data: episodes,
  } = useEpisodes();
  const {
    data: albums,
  } = useAlbums();
  const {
    data: artists,
  } = useArtists();
  const {
    data: tracks,
  } = useTracks();
  return {
    movieId: movies ?? [],
    tvShowId: tvShows ?? [],
    episodeId: episodes ?? [],
    albumId: albums ?? [],
    artistId: artists ?? [],
    trackId: tracks ?? [],
  };
}

/** The linked taxonomy row's name for the trigger label, or null when none is linked by FK. */
function linkedRowName(bookmark: Bookmark, lists: Record<PlexTaxoKey, TaxoRow[]>): string | null {
  for (const {
    key,
  } of SECTION_META) {
    const fk = bookmark[key];
    if (fk) {
      const row = lists[key].find(candidate => candidate.id === fk);
      if (row) return row.name;
    }
  }
  return null;
}

/**
 * Owns the state and selection logic behind `BookmarkPlexItemField`: the popover/search state, the
 * locally-filtered Plex-backed taxonomy lists (Movies / TV Shows / Episodes / Albums / Artists /
 * Tracks), the debounced live Plex search (all item types), and the handlers that resolve a click
 * into a `PlexItemSelection`. Kept separate from the component so the JSX stays a thin shell (the
 * `useBookmarkFormController` pattern — see the `decompose-over-cap` skill).
 */
export function useBookmarkPlexItemField(bookmark: Bookmark, onSelect: (selection: PlexItemSelection) => void) {
  const lists = usePlexTaxonomyLists();
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
  // Each taxonomy's locally-filtered rows, in section order — the browsable half of the picker.
  const sections = SECTION_META.map(meta => ({
    ...meta,
    items: lists[meta.key].filter(row => row.name.toLowerCase().includes(term)),
  }));

  const selectedLabel = linkedRowName(bookmark, lists)
    ?? (bookmark.plexRatingKey !== null ? (bookmark.plexItemTitle ?? `Item ${bookmark.plexRatingKey}`) : null);

  function closeAndReset(): void {
    setOpen(false);
    setQuery("");
  }

  /** Link the bookmark to a curated taxonomy row (clears every other FK + the direct-item trio). */
  function selectTitle(key: PlexTaxoKey, id: string): void {
    onSelect({
      ...EMPTY_PLEX_SELECTION,
      [key]: id,
    });
    closeAndReset();
  }

  /** Reuses an already-curated title's id when a live result matches one by rating key + type. */
  function selectItem(item: PlexItemResult): void {
    const key = TYPE_TO_KEY[item.type];
    if (key) {
      const existingId = lists[key].find(row => row.plexRatingKey === item.ratingKey)?.id;
      if (existingId) {
        selectTitle(key, existingId);
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

  function createTitle(key: PlexTaxoKey, id: string): void {
    selectTitle(key, id);
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
    sections,
    selectedLabel,
    isLinked: selectedLabel !== null,
    selectTitle,
    selectItem,
    unlink,
    createTitle,
  };
}
