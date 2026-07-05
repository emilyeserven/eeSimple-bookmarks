import type { ActiveReelArchiveJob } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { reelArchiveApi } from "../lib/api/reelArchive";
import { notifyError, notifySuccess } from "../lib/notifications";

const ACTIVE_KEY = ["reel-archive", "active"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

/** How often (ms) to poll active reel-archive jobs while any are in flight. */
const ACTIVE_POLL_MS = 1500;

/**
 * Poll the in-flight reel-archive jobs (queued/processing) for the header progress indicator.
 * Self-stopping: it only refetches on an interval while at least one job is active, then idles until
 * an enqueue invalidates the key (the archive mutation does this on submit).
 */
export function useActiveReelArchiveJobs() {
  return useQuery({
    queryKey: ACTIVE_KEY,
    queryFn: reelArchiveApi.listActive,
    refetchInterval: query =>
      (query.state.data && query.state.data.length > 0 ? ACTIVE_POLL_MS : false),
  });
}

/**
 * Watch the active-job poll and fire a toast when each reel-archive job leaves the queue (completed
 * or failed), refreshing the bookmark list so a newly-stored reel's player appears. Mount once (the
 * header indicator); it tracks the previously-active set in a ref to detect transitions.
 */
export function useReelArchiveCompletionToast(active: ActiveReelArchiveJob[] | undefined) {
  const {
    t,
  } = useTranslation();
  const queryClient = useQueryClient();
  const previous = useRef<Map<string, ActiveReelArchiveJob>>(new Map());
  useEffect(() => {
    const current = new Map((active ?? []).map(item => [item.id, item]));
    for (const [id, item] of previous.current) {
      if (current.has(id)) continue;
      // This job just left the active set — resolve its final state and toast accordingly.
      void reelArchiveApi.getJob(id).then((record) => {
        const title = item.bookmarkTitle ?? null;
        if (record.status === "failed") {
          const reason = record.errorReason ?? null;
          if (title && reason) {
            notifyError(t("Reel archive for \"{{title}}\" failed: {{reason}}", {
              title,
              reason,
            }));
          }
          else if (title) {
            notifyError(t("Reel archive for \"{{title}}\" failed.", {
              title,
            }));
          }
          else if (reason) {
            notifyError(t("Reel archive failed: {{reason}}", {
              reason,
            }));
          }
          else {
            notifyError(t("Reel archive failed."));
          }
          return;
        }
        notifySuccess(
          title
            ? t("Reel archived for \"{{title}}\"", {
              title,
            })
            : t("Reel archived"),
        );
      }).catch(() => {
        // Best-effort notification; the bookmark refresh below still surfaces the stored reel.
      });
    }
    if (current.size !== previous.current.size || [...current.keys()].some(id => !previous.current.has(id))) {
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    }
    previous.current = current;
  }, [active, queryClient, t]);
}
