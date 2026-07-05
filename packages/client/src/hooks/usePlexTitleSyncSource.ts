import type { PlexTitleDiffCurrent } from "../lib/syncSources/plexTitleDiff";
import type { SyncProvider, SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { request } from "../lib/api/client";
import { buildPlexTitleDiff } from "../lib/syncSources/plexTitleDiff";

/** Reads a string ref, treating missing/blank/non-string as null. */
function strRef(refs: SyncProvider["refs"], key: string): string | null {
  const value = refs?.[key];
  return typeof value === "string" && value !== "" ? value : null;
}

/** The resolved Wikidata metadata returned by `GET …/:id/plex-metadata-preview`. */
interface MetadataPreview {
  name: string | null;
  englishName: string | null;
  wikipediaLinkEn: string | null;
  wikipediaLinkLocal: string | null;
}

/**
 * Fetches a Plex-backed taxonomy's source metadata for the sync modal: the resolved Wikidata
 * native name + English name + Wikipedia links (from the `…/plex-metadata-preview` endpoint) and the
 * Plex poster proxy URL, built into a current-vs-source diff. Only runs while the sync modal is open.
 */
export function usePlexTitleSyncSource(provider: SyncProvider, enabled: boolean): SyncSourceFetch {
  const {
    t,
  } = useTranslation();
  const base = strRef(provider.refs, "base");
  const ratingKey = strRef(provider.refs, "plexRatingKey");
  const label = strRef(provider.refs, "sourceLabel") ?? t("Plex");
  const path = base ? `/${base}/${provider.entityId}/plex-metadata-preview` : null;

  const query = useQuery({
    queryKey: ["plex-title-preview", provider.entityId, path],
    queryFn: () => request<MetadataPreview>(path ?? ""),
    enabled: enabled && path !== null,
    staleTime: 60_000,
  });

  const current: PlexTitleDiffCurrent = {
    name: strRef(provider.refs, "currentName"),
    englishName: strRef(provider.refs, "currentEnglishName"),
    wikipediaLinkEn: strRef(provider.refs, "currentWikipediaLinkEn"),
    wikipediaLinkLocal: strRef(provider.refs, "currentWikipediaLinkLocal"),
    imageUrl: strRef(provider.refs, "currentImageUrl"),
  };
  const posterUrl = ratingKey ? `/api/plex/poster?ratingKey=${encodeURIComponent(ratingKey)}` : null;

  if (query.isPending && enabled && path !== null) {
    return {
      diff: null,
      isLoading: true,
      error: null,
    };
  }
  if (query.isError) {
    return {
      diff: null,
      isLoading: false,
      error: t("Couldn't reach the source. Try again in a moment."),
    };
  }

  const preview = query.data;
  return {
    diff: buildPlexTitleDiff(current, {
      name: preview?.name ?? null,
      englishName: preview?.englishName ?? null,
      wikipediaLinkEn: preview?.wikipediaLinkEn ?? null,
      wikipediaLinkLocal: preview?.wikipediaLinkLocal ?? null,
      posterUrl,
    }, label),
    isLoading: false,
    error: null,
  };
}
