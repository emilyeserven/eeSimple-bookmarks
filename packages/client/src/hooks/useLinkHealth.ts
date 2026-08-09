import type { AutoFetchJobStatus } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { linkHealthApi } from "../lib/api/imports";
import { notifySuccess } from "../lib/notifications";

export const BROKEN_LINKS_KEY = ["link-health", "broken"] as const;
const LINK_CHECK_STATUS_KEY = ["link-health", "check-status"] as const;

/** How often (ms) to poll the link-check job while it is running. */
const LINK_CHECK_POLL_MS = 1500;

/** Every bookmark whose last link check failed. */
export function useBrokenBookmarks() {
  return useQuery({
    queryKey: BROKEN_LINKS_KEY,
    queryFn: linkHealthApi.broken,
  });
}

/**
 * Poll the background link-check job status. Self-stopping: only refetches while running, then
 * idles until a start mutation seeds the key.
 */
export function useLinkCheckStatus() {
  return useQuery({
    queryKey: LINK_CHECK_STATUS_KEY,
    queryFn: linkHealthApi.status,
    refetchInterval: query =>
      (query.state.data?.status === "running" ? LINK_CHECK_POLL_MS : false),
  });
}

/**
 * Watch the link-check status and fire a completion toast when the job transitions from running to
 * done, then refresh the broken-link list. Mount once (the header activity hook).
 */
export function useLinkCheckCompletionToast(status: AutoFetchJobStatus | undefined) {
  const {
    t,
  } = useTranslation();
  const queryClient = useQueryClient();
  const previous = useRef<AutoFetchJobStatus | undefined>(undefined);
  useEffect(() => {
    if (
      previous.current?.status === "running"
      && status?.status === "done"
    ) {
      const {
        fetched, failed,
      } = status;
      const message = failed > 0
        ? t("Checked {{total}} links — {{failed}} broken.", {
          total: fetched + failed,
          failed,
        })
        : t("Checked {{total}} links — all working.", {
          total: fetched + failed,
        });
      notifySuccess(
        message,
        {
          link: {
            href: "/settings/advanced/link-health",
            label: t("View in Link Health"),
          },
        },
      );
      void queryClient.invalidateQueries({
        queryKey: BROKEN_LINKS_KEY,
      });
    }
    previous.current = status;
  }, [status, queryClient, t]);
}

/** Start the background bulk link-check job. Kicks the status poll so the indicator appears. */
export function useStartLinkCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => linkHealthApi.start(),
    onSuccess: (data) => {
      queryClient.setQueryData(LINK_CHECK_STATUS_KEY, data);
    },
  });
}

/** Re-check a single bookmark's link, then refresh the broken-link list. */
export function useRecheckBookmarkLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookmarkId: string) => linkHealthApi.recheck(bookmarkId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: BROKEN_LINKS_KEY,
      });
    },
  });
}
