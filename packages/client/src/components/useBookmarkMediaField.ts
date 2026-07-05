import type { Bookmark } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { useAlbums } from "../hooks/useAlbums";
import { useBooks } from "../hooks/useBooks";
import { useEpisodes } from "../hooks/useEpisodes";
import { useExpandedSet } from "../hooks/useExpandedSet";
import { useMovies } from "../hooks/useMovies";
import { usePodcasts } from "../hooks/usePodcasts";
import { useTracks } from "../hooks/useTracks";
import { useTvShows } from "../hooks/useTvShows";

/**
 * The seven Media Properties taxonomies a bookmark can link to via a single FK. Deliberately NOT
 * `PlexKind | "book" | "podcast"` — `PlexKind` still includes `"artist"` (People/Groups Plex-link
 * against the Plex `artist` item type), but a bookmark no longer links to an Artist taxonomy row.
 */
type MediaKind = "book" | "movie" | "show" | "episode" | "album" | "track" | "podcast";

/** The bookmark FK column each media taxonomy fills in (exactly one is ever set). */
export type MediaTaxoKey
  = | "bookId"
    | "podcastId"
    | "movieId"
    | "tvShowId"
    | "episodeId"
    | "albumId"
    | "trackId";

/** A media-item link selection: exactly one taxonomy FK is set, or all null to unlink. */
export interface MediaSelection {
  bookId: string | null;
  podcastId: string | null;
  movieId: string | null;
  tvShowId: string | null;
  episodeId: string | null;
  albumId: string | null;
  trackId: string | null;
}

export const EMPTY_MEDIA_SELECTION: MediaSelection = {
  bookId: null,
  podcastId: null,
  movieId: null,
  tvShowId: null,
  episodeId: null,
  albumId: null,
  trackId: null,
};

/** Build a {@link MediaSelection} from a persisted bookmark's media-link FKs (edit surface). */
export function mediaSelectionFromBookmark(bookmark: Bookmark): MediaSelection {
  return {
    bookId: bookmark.bookId,
    movieId: bookmark.movieId,
    tvShowId: bookmark.tvShowId,
    episodeId: bookmark.episodeId,
    albumId: bookmark.albumId,
    trackId: bookmark.trackId,
    podcastId: bookmark.podcastId,
  };
}

/** What `AddMediaTitleModal` hands back: which bookmark FK the created title fills in, plus its id. */
export interface CreatedMediaTitle {
  key: MediaTaxoKey;
  id: string;
}

/** The minimal shape each taxonomy row contributes to the picker. */
interface TaxoRow {
  id: string;
  name: string;
}

/** Ordered FK columns + section headings for the seven media taxonomies. */
interface MediaKindMeta {
  kind: MediaKind;
  fkKey: MediaTaxoKey;
  heading: string;
}

const MEDIA_KIND_META: MediaKindMeta[] = [
  {
    kind: "book",
    fkKey: "bookId",
    heading: "Books",
  },
  {
    kind: "podcast",
    fkKey: "podcastId",
    heading: "Podcasts",
  },
  {
    kind: "movie",
    fkKey: "movieId",
    heading: "Movies",
  },
  {
    kind: "show",
    fkKey: "tvShowId",
    heading: "TV Shows",
  },
  {
    kind: "episode",
    fkKey: "episodeId",
    heading: "Episodes",
  },
  {
    kind: "album",
    fkKey: "albumId",
    heading: "Albums",
  },
  {
    kind: "track",
    fkKey: "trackId",
    heading: "Tracks",
  },
];

/** All seven media taxonomy lists, loaded once (own hook to spread the hook density). */
function useMediaTaxonomyLists(): Record<MediaKind, TaxoRow[]> {
  const {
    data: books,
  } = useBooks();
  const {
    data: podcasts,
  } = usePodcasts();
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
    data: tracks,
  } = useTracks();
  return {
    book: books ?? [],
    podcast: podcasts ?? [],
    movie: movies ?? [],
    show: tvShows ?? [],
    episode: episodes ?? [],
    album: albums ?? [],
    track: tracks ?? [],
  };
}

/** One collapsible taxonomy section of the picker. */
export interface MediaSection {
  kind: MediaKind;
  heading: string;
  /** Rows to render — filtered by the search query when one is active, else the full list. */
  items: TaxoRow[];
  /** Total row count for this taxonomy, independent of the current search query. */
  totalCount: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/** The linked FK's meta entry, or `undefined` when the selection isn't linked to any media item. */
function linkedMeta(selection: MediaSelection): MediaKindMeta | undefined {
  return MEDIA_KIND_META.find(meta => selection[meta.fkKey] !== null);
}

/**
 * Owns the state and selection logic behind `BookmarkMediaField`: the popover/search state, the
 * seven taxonomy lists (each independently collapsible via `useExpandedSet`), and the handlers that
 * resolve a click or a create-modal result into a `MediaSelection`. Kept separate from the component
 * so the JSX stays a thin shell (the `useBookmarkFormController` pattern — see the
 * `decompose-over-cap` skill).
 *
 * Driven off a `value: MediaSelection` (not a persisted bookmark) so it works on the create form too,
 * where no bookmark exists yet — the edit surface derives the value via
 * {@link mediaSelectionFromBookmark} and persists each `onSelect` immediately, while the create form
 * threads the six FK form fields through. `bookmark` is passed only to surface the legacy Kavita/Plex
 * read-only links (edit surface); it is `null`/absent on create.
 */
export function useBookmarkMediaField(
  value: MediaSelection,
  onSelect: (selection: MediaSelection) => void,
  bookmark?: Bookmark | null,
) {
  const {
    t,
  } = useTranslation();
  const lists = useMediaTaxonomyLists();
  const expanded = useExpandedSet(MEDIA_KIND_META.map(meta => meta.kind));

  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");

  const term = query.trim().toLowerCase();
  const hasQuery = term.length > 0;

  // While searching, a matching section always shows its results regardless of collapse state (the
  // stored collapse state isn't mutated — it's restored once the query clears), mirroring why the
  // old `PlexResultsTree`'s collapse only ever applied to browsing, never to hiding active search hits.
  const sections: MediaSection[] = MEDIA_KIND_META.map((meta) => {
    const allItems = lists[meta.kind];
    const isExpanded = expanded.expanded.has(meta.kind);
    const items = hasQuery
      ? allItems.filter(row => row.name.toLowerCase().includes(term))
      : (isExpanded ? allItems : []);
    return {
      kind: meta.kind,
      heading: t(meta.heading),
      items,
      totalCount: allItems.length,
      collapsed: !hasQuery && !isExpanded,
      onToggleCollapsed: () => expanded.onToggle(meta.kind),
    };
  });

  const linked = linkedMeta(value);
  const linkedRow = linked ? lists[linked.kind].find(row => row.id === value[linked.fkKey]) : undefined;
  const selectedLabel = linkedRow?.name ?? null;

  function closeAndReset(): void {
    setOpen(false);
    setQuery("");
  }

  /** Link the bookmark to a taxonomy row — re-selecting the linked row clears it instead. */
  function selectItem(kind: MediaKind, id: string): void {
    const meta = MEDIA_KIND_META.find(candidate => candidate.kind === kind);
    if (!meta) return;
    onSelect(value[meta.fkKey] === id
      ? EMPTY_MEDIA_SELECTION
      : {
        ...EMPTY_MEDIA_SELECTION,
        [meta.fkKey]: id,
      });
    closeAndReset();
  }

  function handleCreated(created: CreatedMediaTitle): void {
    onSelect({
      ...EMPTY_MEDIA_SELECTION,
      [created.key]: created.id,
    });
    closeAndReset();
  }

  return {
    open,
    setOpen,
    addOpen,
    setAddOpen,
    query,
    setQuery,
    sections,
    selectedLabel,
    isLinked: selectedLabel !== null,
    selectItem,
    handleCreated,
    showLegacyKavita: (bookmark?.bookId ?? null) === null && (bookmark?.kavitaSeriesId ?? null) !== null,
    showLegacyPlex: !linked && (bookmark?.plexRatingKey ?? null) !== null,
  };
}
