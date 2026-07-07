import type { PlexMetadataPreview } from "../lib/api/bookmarks";
import type { BookmarkDiffCurrent } from "../lib/syncSources/bookmarkDiff";
import type { SyncProvider, SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";
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
import { numRef, resolveSyncSourceFetch, strRef } from "../lib/syncSources/syncSourceQuery";

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
 *
 * Only the primary URL scan's failure surfaces a user-facing error (`errorMessage` below) — the
 * secondary Plex/podcast/Kavita/ISBN sources silently contribute nothing when they error, matching
 * the previous behavior.
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

  const current: BookmarkDiffCurrent = {
    title: strRef(provider.refs, "currentTitle"),
    description: strRef(provider.refs, "currentDescription"),
    imageUrl: strRef(provider.refs, "currentImageUrl"),
  };

  return resolveSyncSourceFetch([
    {
      active: enabled && url !== null,
      isPending: scanQuery.isPending,
      isError: scanQuery.isError,
      data: scanQuery.data,
      errorMessage: t("Couldn't scan the URL. Check the link and try again."),
      buildGroups: data => buildBookmarkDiff(data, current).groups,
    },
    {
      active: enabled && plexRatingKey !== null,
      isPending: plexQuery.isPending,
      isError: plexQuery.isError,
      data: plexQuery.data,
      buildGroups: (data: PlexMetadataPreview) => {
        const posterUrl = plexRatingKey ? `/api/plex/poster?ratingKey=${encodeURIComponent(plexRatingKey)}` : null;
        return buildBookmarkPlexDiff({
          title: current.title,
          wikipediaLinkEn: strRef(provider.refs, "currentWikipediaLinkEn"),
          wikipediaLinkLocal: strRef(provider.refs, "currentWikipediaLinkLocal"),
          imageUrl: current.imageUrl,
        }, {
          name: data.name,
          wikipediaLinkEn: data.wikipediaLinkEn,
          wikipediaLinkLocal: data.wikipediaLinkLocal,
          posterUrl,
        }, t("Plex")).groups;
      },
    },
    {
      active: enabled && (feedUrl !== null || itunesId !== null),
      isPending: podcastQuery.isPending,
      isError: podcastQuery.isError,
      data: podcastQuery.data,
      buildGroups: (data: PodcastFeedResult) => buildBookmarkPodcastDiff({
        title: current.title,
        description: current.description,
        itunesUrl: strRef(provider.refs, "currentItunesUrl"),
        pocketCastsUrl: strRef(provider.refs, "currentPocketCastsUrl"),
        imageUrl: current.imageUrl,
      }, {
        title: data.title,
        description: data.description,
        itunesUrl: data.providerLinks?.itunesUrl ?? data.itunesUrl,
        pocketCastsUrl: data.providerLinks?.pocketCastsUrl ?? null,
        imageUrl: data.imageUrl,
      }, t("Podcast feed")).groups,
    },
    {
      active: enabled && kavitaSeriesId !== null,
      isPending: kavitaQuery.isPending,
      isError: kavitaQuery.isError,
      data: kavitaQuery.data,
      buildGroups: (data: KavitaSeriesDetail) => {
        const coverUrl = kavitaSeriesId !== null ? `/api/kavita/series/${kavitaSeriesId}/cover` : null;
        return buildBookmarkKavitaDiff({
          kavitaSeriesName: strRef(provider.refs, "currentKavitaSeriesName"),
          imageUrl: current.imageUrl,
        }, {
          name: data.name,
          coverUrl,
        }, t("Kavita")).groups;
      },
    },
    {
      active: enabled && isbn !== null,
      isPending: isbnQuery.isPending,
      isError: isbnQuery.isError,
      data: isbnQuery.data,
      buildGroups: (data: FetchIsbnMetadataResult) => buildBookmarkIsbnDiff({
        title: current.title,
        description: current.description,
        imageUrl: current.imageUrl,
      }, {
        title: data.title,
        description: data.description,
        coverUrl: data.coverUrl,
      }, t("ISBN metadata")).groups,
    },
  ]);
}
