import type { PlexMetadataPreview } from "../lib/api/bookmarks";
import type { BookmarkDiffCurrent } from "../lib/syncSources/bookmarkDiff";
import type { SyncDiff, SyncProvider, SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";
import type { FetchIsbnMetadataResult, KavitaSeriesDetail, PodcastFeedResult } from "@eesimple/types";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { bookmarksApi } from "../lib/api/bookmarks";
import { kavitaApi } from "../lib/api/kavita";
import { metadataApi } from "../lib/api/metadata";
import {
  buildBookmarkDiff,
  buildBookmarkIsbnDiff,
  buildBookmarkKavitaDiff,
  buildBookmarkPlexDiff,
  buildBookmarkPodcastDiff,
} from "../lib/syncSources/bookmarkDiff";

/** Reads a string ref, treating missing/blank/non-string as null. */
function strRef(refs: SyncProvider["refs"], key: string): string | null {
  const value = refs?.[key];
  return typeof value === "string" && value !== "" ? value : null;
}

/** Reads a number ref, treating missing/non-number as null. */
function numRef(refs: SyncProvider["refs"], key: string): number | null {
  const value = refs?.[key];
  return typeof value === "number" ? value : null;
}

/**
 * Re-scans a bookmark's URL via the consolidated `GET /api/scan` and diffs the result (title,
 * description, page image) against the bookmark's current values (passed through `provider.refs`).
 * Only runs while the sync modal is open. The scan is idempotent + server-cached, so re-opening the
 * modal is cheap.
 *
 * A bookmark carrying its own promoted media identity (see #1070) additionally gets a "Plex" /
 * "Podcast feed" / "Kavita" / "ISBN metadata" group appended to the same combined diff — each gated on
 * the matching identity ref being present, so a plain URL bookmark shows only "Page metadata" while a
 * migrated media-item bookmark shows every source it actually carries. Bookmarks register a single
 * `SyncProvider`, so this is a combined multi-group diff rather than separate `descriptorKind`s.
 */
export function useBookmarkSyncSource(provider: SyncProvider, enabled: boolean): SyncSourceFetch {
  const {
    t,
  } = useTranslation();
  const url = strRef(provider.refs, "url");
  const plexRatingKey = strRef(provider.refs, "plexRatingKey");
  const feedUrl = strRef(provider.refs, "feedUrl");
  const itunesId = numRef(provider.refs, "itunesId");
  const kavitaSeriesId = numRef(provider.refs, "kavitaSeriesId");
  const isbn = strRef(provider.refs, "isbn");

  const scanQuery = useQuery({
    queryKey: ["bookmark-sync-scan", provider.entityId, url],
    queryFn: () => metadataApi.scan({
      url: url ?? "",
    }),
    enabled: enabled && url !== null,
    staleTime: 60_000,
  });

  const plexQuery = useQuery({
    queryKey: ["bookmark-sync-plex", provider.entityId],
    queryFn: () => bookmarksApi.plexMetadataPreview(provider.entityId),
    enabled: enabled && plexRatingKey !== null,
    staleTime: 60_000,
  });

  const podcastQuery = useQuery({
    queryKey: ["bookmark-sync-podcast", provider.entityId],
    queryFn: () => bookmarksApi.feedPreview(provider.entityId),
    enabled: enabled && (feedUrl !== null || itunesId !== null),
    staleTime: 60_000,
  });

  const kavitaQuery = useQuery({
    queryKey: ["bookmark-sync-kavita", kavitaSeriesId],
    queryFn: () => kavitaApi.getSeriesDetail(kavitaSeriesId as number),
    enabled: enabled && kavitaSeriesId !== null,
    staleTime: 60_000,
  });

  const isbnQuery = useQuery({
    queryKey: ["bookmark-sync-isbn", isbn],
    queryFn: () => metadataApi.fetchIsbnMetadata({
      isbn: isbn as string,
    }),
    enabled: enabled && isbn !== null,
    staleTime: 60_000,
  });

  const anyPending = (scanQuery.isPending && enabled && url !== null)
    || (plexQuery.isPending && enabled && plexRatingKey !== null)
    || (podcastQuery.isPending && enabled && (feedUrl !== null || itunesId !== null))
    || (kavitaQuery.isPending && enabled && kavitaSeriesId !== null)
    || (isbnQuery.isPending && enabled && isbn !== null);
  if (anyPending) {
    return {
      diff: null,
      isLoading: true,
      error: null,
    };
  }

  const current: BookmarkDiffCurrent = {
    title: strRef(provider.refs, "currentTitle"),
    description: strRef(provider.refs, "currentDescription"),
    imageUrl: strRef(provider.refs, "currentImageUrl"),
  };

  const groups: SyncDiff["groups"] = [];

  if (scanQuery.isError) {
    return {
      diff: null,
      isLoading: false,
      error: t("Couldn't scan the URL. Check the link and try again."),
    };
  }
  if (scanQuery.data) {
    groups.push(...buildBookmarkDiff(scanQuery.data, current).groups);
  }

  if (plexQuery.data) {
    const source = plexQuery.data as PlexMetadataPreview;
    const posterUrl = plexRatingKey ? `/api/plex/poster?ratingKey=${encodeURIComponent(plexRatingKey)}` : null;
    groups.push(...buildBookmarkPlexDiff({
      title: current.title,
      wikipediaLinkEn: strRef(provider.refs, "currentWikipediaLinkEn"),
      wikipediaLinkLocal: strRef(provider.refs, "currentWikipediaLinkLocal"),
      imageUrl: current.imageUrl,
    }, {
      name: source.name,
      wikipediaLinkEn: source.wikipediaLinkEn,
      wikipediaLinkLocal: source.wikipediaLinkLocal,
      posterUrl,
    }, t("Plex")).groups);
  }

  if (podcastQuery.data) {
    const source = podcastQuery.data as PodcastFeedResult;
    groups.push(...buildBookmarkPodcastDiff({
      title: current.title,
      description: current.description,
      itunesUrl: strRef(provider.refs, "currentItunesUrl"),
      pocketCastsUrl: strRef(provider.refs, "currentPocketCastsUrl"),
      imageUrl: current.imageUrl,
    }, {
      title: source.title,
      description: source.description,
      itunesUrl: source.providerLinks?.itunesUrl ?? source.itunesUrl,
      pocketCastsUrl: source.providerLinks?.pocketCastsUrl ?? null,
      imageUrl: source.imageUrl,
    }, t("Podcast feed")).groups);
  }

  if (kavitaQuery.data) {
    const source = kavitaQuery.data as KavitaSeriesDetail;
    const coverUrl = kavitaSeriesId !== null ? `/api/kavita/series/${kavitaSeriesId}/cover` : null;
    groups.push(...buildBookmarkKavitaDiff({
      kavitaSeriesName: strRef(provider.refs, "currentKavitaSeriesName"),
      imageUrl: current.imageUrl,
    }, {
      name: source.name,
      coverUrl,
    }, t("Kavita")).groups);
  }

  if (isbnQuery.data) {
    const source = isbnQuery.data as FetchIsbnMetadataResult;
    groups.push(...buildBookmarkIsbnDiff({
      title: current.title,
      description: current.description,
      imageUrl: current.imageUrl,
    }, {
      title: source.title,
      description: source.description,
      coverUrl: source.coverUrl,
    }, t("ISBN metadata")).groups);
  }

  return {
    diff: {
      groups,
    },
    isLoading: false,
    error: null,
  };
}
