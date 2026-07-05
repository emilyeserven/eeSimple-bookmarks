import type { BookmarkDiffCurrent } from "../lib/syncSources/bookmarkDiff";
import type { SyncProvider, SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { metadataApi } from "../lib/api/metadata";
import { buildBookmarkDiff } from "../lib/syncSources/bookmarkDiff";

/** Reads a string ref, treating missing/blank/non-string as null. */
function strRef(refs: SyncProvider["refs"], key: string): string | null {
  const value = refs?.[key];
  return typeof value === "string" && value !== "" ? value : null;
}

/**
 * Re-scans a bookmark's URL via the consolidated `GET /api/scan` and diffs the result (title,
 * description, page image) against the bookmark's current values (passed through `provider.refs`).
 * Only runs while the sync modal is open. The scan is idempotent + server-cached, so re-opening the
 * modal is cheap.
 */
export function useBookmarkSyncSource(provider: SyncProvider, enabled: boolean): SyncSourceFetch {
  const {
    t,
  } = useTranslation();
  const url = strRef(provider.refs, "url");

  const query = useQuery({
    queryKey: ["bookmark-sync-scan", provider.entityId, url],
    queryFn: () => metadataApi.scan({
      url: url ?? "",
    }),
    enabled: enabled && url !== null,
    staleTime: 60_000,
  });

  if (query.isPending && enabled && url !== null) {
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
      error: t("Couldn't scan the URL. Check the link and try again."),
    };
  }
  if (!query.data) {
    return {
      diff: {
        groups: [],
      },
      isLoading: false,
      error: null,
    };
  }

  const current: BookmarkDiffCurrent = {
    title: strRef(provider.refs, "currentTitle"),
    description: strRef(provider.refs, "currentDescription"),
    imageUrl: strRef(provider.refs, "currentImageUrl"),
  };

  return {
    diff: buildBookmarkDiff(query.data, current),
    isLoading: false,
    error: null,
  };
}
