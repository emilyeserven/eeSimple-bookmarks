import type { PodcastLinkFields, PodcastResolvedLink } from "../lib/podcastLinks";
import type { Bookmark, PodcastLinkProvider } from "@eesimple/types";

import { PODCAST_LINK_PROVIDERS } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { resolvePodcastDefaultLink } from "../lib/podcastLinks";

/** The Kavita linkage resolved for a bookmark's detail/deep-link display. */
export interface BookmarkKavitaLink {
  seriesId: number;
  libraryId: number | null;
  seriesName: string | null;
}

/**
 * The bookmark's own Kavita linkage (`kavitaSeriesId`/`kavitaLibraryId`/`kavitaSeriesName`). Powers
 * the cover / ToC import gates and the "View on Kavita" link-outs. Returns `null` when unlinked.
 */
export function useBookmarkKavitaLink(bookmark: Bookmark): BookmarkKavitaLink | null {
  if (bookmark.kavitaSeriesId === null) return null;
  return {
    seriesId: bookmark.kavitaSeriesId,
    libraryId: bookmark.kavitaLibraryId,
    seriesName: bookmark.kavitaSeriesName,
  };
}

/**
 * The effective Kavita series id for a bookmark — the numeric-only projection of
 * {@link useBookmarkKavitaLink}. Powers the cover / ToC import gates.
 */
export function useBookmarkKavitaSeriesId(bookmark: Bookmark): number | null {
  return useBookmarkKavitaLink(bookmark)?.seriesId ?? null;
}

/** The Plex linkage resolved for a bookmark's detail/deep-link/poster display. */
export interface BookmarkPlexLink {
  ratingKey: string;
  title: string;
}

/**
 * The bookmark's own Plex linkage (`plexRatingKey`/`plexItemTitle`). Powers the "View on Plex"
 * link-outs. Returns `null` when unlinked.
 */
export function useBookmarkPlexLink(bookmark: Bookmark): BookmarkPlexLink | null {
  const {
    t,
  } = useTranslation();
  if (bookmark.plexRatingKey === null) return null;
  return {
    ratingKey: bookmark.plexRatingKey,
    title: bookmark.plexItemTitle ?? t("Item {{ratingKey}}", {
      ratingKey: bookmark.plexRatingKey,
    }),
  };
}

/**
 * The effective Plex rating key for a bookmark — the string-only projection of
 * {@link useBookmarkPlexLink}. Powers the "Use Plex poster" gate.
 */
export function useBookmarkPlexRatingKey(bookmark: Bookmark): string | null {
  return useBookmarkPlexLink(bookmark)?.ratingKey ?? null;
}

/** A bookmark's own promoted podcast link fields (see #1070), as {@link PodcastLinkFields}. */
function bookmarkPodcastLinkFields(bookmark: Bookmark): PodcastLinkFields {
  const provider = bookmark.defaultLinkProvider;
  const defaultLinkProvider = (PODCAST_LINK_PROVIDERS as readonly string[]).includes(provider ?? "")
    ? provider as PodcastLinkProvider
    : null;
  return {
    feedUrl: bookmark.feedUrl,
    itunesUrl: bookmark.itunesUrl,
    spotifyUrl: bookmark.spotifyUrl,
    pocketCastsUrl: bookmark.pocketCastsUrl,
    defaultLinkProvider,
  };
}

/**
 * The external link a bookmark's podcast identity points at — its own `defaultLinkProvider`'s URL
 * (else its first available service). Resolved client-side (podcast links are public URLs, no
 * connector gating). `null` when the bookmark's own fields have no URL.
 */
export function useBookmarkPodcastLink(bookmark: Bookmark): PodcastResolvedLink | null {
  return resolvePodcastDefaultLink(bookmarkPodcastLinkFields(bookmark));
}
