import type { MediaMatchItem } from "../lib/mediaItemsForBookmarks";
import type { Bookmark } from "@eesimple/types";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useAlbums } from "../hooks/useAlbums";
import { useBooks } from "../hooks/useBooks";
import { useEpisodes } from "../hooks/useEpisodes";
import { useMovies } from "../hooks/useMovies";
import { usePodcasts } from "../hooks/usePodcasts";
import { useTracks } from "../hooks/useTracks";
import { useTvShows } from "../hooks/useTvShows";
import { mediaItemsForBookmarks } from "../lib/mediaItemsForBookmarks";

import { Badge } from "@/components/ui/badge";
import { RowCard } from "@/components/ui/card";

/**
 * The link to a media item's own page. Each media taxonomy has a distinct slug-routed index with a
 * kind-specific param name, so the `to`/`params` are spelled out per kind (keeping TanStack Router's
 * typed links). A new media taxonomy adds a branch here alongside its `MEDIA_KINDS` entry.
 */
function MediaItemLink({
  item, className, children,
}: {
  item: MediaMatchItem;
  className: string;
  children: React.ReactNode;
}) {
  const {
    t,
  } = useTranslation();
  const title = t("Show bookmarks for {{name}}", {
    name: item.name,
  });
  switch (item.kind) {
    case "movie":
      return (
        <Link
          to="/taxonomies/movies/$movieSlug"
          params={{
            movieSlug: item.slug,
          }}
          title={title}
          className={className}
        >{children}
        </Link>
      );
    case "tvShow":
      return (
        <Link
          to="/taxonomies/tv-shows/$tvShowSlug"
          params={{
            tvShowSlug: item.slug,
          }}
          title={title}
          className={className}
        >{children}
        </Link>
      );
    case "episode":
      return (
        <Link
          to="/taxonomies/episodes/$episodeSlug"
          params={{
            episodeSlug: item.slug,
          }}
          title={title}
          className={className}
        >{children}
        </Link>
      );
    case "album":
      return (
        <Link
          to="/taxonomies/albums/$albumSlug"
          params={{
            albumSlug: item.slug,
          }}
          title={title}
          className={className}
        >{children}
        </Link>
      );
    case "track":
      return (
        <Link
          to="/taxonomies/tracks/$trackSlug"
          params={{
            trackSlug: item.slug,
          }}
          title={title}
          className={className}
        >{children}
        </Link>
      );
    case "book":
      return (
        <Link
          to="/taxonomies/books/$bookSlug"
          params={{
            bookSlug: item.slug,
          }}
          title={title}
          className={className}
        >{children}
        </Link>
      );
    case "podcast":
      return (
        <Link
          to="/taxonomies/podcasts/$podcastSlug"
          params={{
            podcastSlug: item.slug,
          }}
          title={title}
          className={className}
        >{children}
        </Link>
      );
  }
}

/**
 * The "Media" tab body: a single flat list of the media taxonomy items (movies, books, TV shows, …)
 * referenced by the bookmarks that pass the current filters, each linking to its own page with a
 * badge counting the matching bookmarks. The media lists are fetched here (not threaded through the
 * listing routes) so they load only when this pane is mounted — i.e. only once the tab is opened.
 */
export function MediaItemsPane({
  bookmarks,
}: {
  bookmarks: Bookmark[];
}) {
  const {
    t,
  } = useTranslation();
  const movies = useMovies();
  const tvShows = useTvShows();
  const episodes = useEpisodes();
  const albums = useAlbums();
  const tracks = useTracks();
  const books = useBooks();
  const podcasts = usePodcasts();

  const anyLoading = movies.isLoading || tvShows.isLoading || episodes.isLoading
    || albums.isLoading || tracks.isLoading || books.isLoading || podcasts.isLoading;

  const items = useMemo(
    () => mediaItemsForBookmarks(bookmarks, {
      movies: movies.data ?? [],
      tvShows: tvShows.data ?? [],
      episodes: episodes.data ?? [],
      albums: albums.data ?? [],
      tracks: tracks.data ?? [],
      books: books.data ?? [],
      podcasts: podcasts.data ?? [],
    }),
    [bookmarks, movies.data, tvShows.data, episodes.data, albums.data, tracks.data, books.data, podcasts.data],
  );

  if (anyLoading && items.length === 0) {
    return <p className="text-muted-foreground">{t("Loading media…")}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        {t("No media items are linked to the bookmarks matching these filters.")}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li key={`${item.kind}:${item.id}`}>
          <RowCard className="flex items-center gap-3 p-3">
            <Badge
              variant="secondary"
              className="shrink-0"
            >{item.label}
            </Badge>
            <MediaItemLink
              item={item}
              className="
                min-w-0 flex-1 truncate font-medium
                hover:underline
              "
            >
              {item.name}
            </MediaItemLink>
            <span className="shrink-0 text-sm text-muted-foreground">
              {item.matchCount} {item.matchCount === 1 ? t("bookmark") : t("bookmarks")}
            </span>
          </RowCard>
        </li>
      ))}
    </ul>
  );
}
