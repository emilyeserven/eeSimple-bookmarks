import type { SyncProvider, SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { request } from "../lib/api/client";
import { buildImageTaxonomyDiff } from "../lib/syncSources/imageTaxonomyDiff";
import { resolveSyncSourceFetch, strRef } from "../lib/syncSources/syncSourceQuery";

/** The preview endpoint (returns `{ imageUrl }`) for a JSON-preview source, or null when not resolvable. */
function previewPath(kind: string | null, entityId: string, refs: SyncProvider["refs"]): string | null {
  switch (kind) {
    case "youtube":
      return `/youtube-channels/${entityId}/image/source-preview`;
    case "website":
      return `/websites/${entityId}/image/source-preview`;
    case "person": {
      const source = strRef(refs, "personSource") ?? "website";
      const platform = strRef(refs, "personPlatform");
      const query = platform ? `?source=${source}&platform=${encodeURIComponent(platform)}` : `?source=${source}`;
      return `/people/${entityId}/image/source-preview${query}`;
    }
    default:
      return null;
  }
}

/**
 * Resolves the source image preview for an image-only taxonomy and builds a single image-diff row.
 * YouTube / website / person hit their `…/image/source-preview` endpoint (JSON `{ imageUrl }`); Plex
 * uses the deterministic bytes-proxy URL (`/api/plex/poster?ratingKey=…`) directly. Only runs while
 * the sync modal is open.
 */
export function useImageOnlyTaxonomySyncSource(provider: SyncProvider, enabled: boolean): SyncSourceFetch {
  const {
    t,
  } = useTranslation();
  const kind = strRef(provider.refs, "previewKind");
  const currentImageUrl = strRef(provider.refs, "currentImageUrl");
  const label = strRef(provider.refs, "sourceLabel") ?? t("Source");
  const path = previewPath(kind, provider.entityId, provider.refs);
  const isPlex = kind === "plex";

  const query = useQuery({
    queryKey: ["image-taxonomy-preview", provider.entityId, path],
    queryFn: () => request<{ imageUrl: string | null }>(path ?? ""),
    enabled: enabled && !isPlex && path !== null,
    staleTime: 60_000,
  });

  const plexRatingKey = strRef(provider.refs, "plexRatingKey");
  const plexImageUrl = plexRatingKey ? `/api/plex/poster?ratingKey=${encodeURIComponent(plexRatingKey)}` : null;

  return resolveSyncSourceFetch([
    {
      active: enabled && isPlex,
      isPending: false,
      isError: false,
      data: plexImageUrl,
      buildGroups: nextImageUrl => buildImageTaxonomyDiff(currentImageUrl, nextImageUrl, label).groups,
    },
    {
      active: enabled && !isPlex && path !== null,
      isPending: query.isPending,
      isError: query.isError,
      data: query.data ? query.data.imageUrl : undefined,
      errorMessage: t("Couldn't reach the source. Try again in a moment."),
      buildGroups: nextImageUrl => buildImageTaxonomyDiff(currentImageUrl, nextImageUrl, label).groups,
    },
  ]);
}
