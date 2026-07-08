import type { ScreenshotQueueSnapshot } from "../lib/headerActivity";
import type { TFunction } from "i18next";

import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { notifySuccess } from "../lib/notifications";
import { useScreenshotQueueStore } from "../stores/screenshotQueueStore";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Completion-toast wording, mirroring the image auto-fetch job's "Fetched N images" phrasing. */
function completionMessage(t: TFunction, completed: number, failed: number): string {
  if (failed > 0) {
    return completed === 1
      ? t("Captured 1 screenshot, {{failed}} failed.", {
        failed,
      })
      : t("Captured {{completed}} screenshots, {{failed}} failed.", {
        completed,
        failed,
      });
  }
  return completed === 1
    ? t("Captured 1 screenshot.")
    : t("Captured {{completed}} screenshots.", {
      completed,
    });
}

/**
 * The app-wide controller for the on-demand screenshot queue. Mounted once (by `useHeaderActivity`);
 * the store's pump runs the captures itself, so this hook only owns the react-query side effects:
 * refresh the bookmark cards as each capture lands, and fire a single completion toast when the run
 * drains. Returns the render snapshot the header progress row is built from.
 */
export function useScreenshotQueue(): ScreenshotQueueSnapshot {
  const {
    t,
  } = useTranslation();
  const queryClient = useQueryClient();
  const total = useScreenshotQueueStore(state => state.total);
  const completed = useScreenshotQueueStore(state => state.completed);
  const failed = useScreenshotQueueStore(state => state.failed);
  const active = useScreenshotQueueStore(state => state.pending.length + state.activeIds.length);
  const runBookmarkIds = useScreenshotQueueStore(state => state.runBookmarkIds);

  const processed = completed + failed;

  // Refresh the bookmark list as each capture completes so the new screenshot shows on the card.
  const prevProcessed = useRef(0);
  useEffect(() => {
    if (processed > prevProcessed.current) {
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    }
    prevProcessed.current = processed;
  }, [processed, queryClient]);

  // One completion toast per run, fired as the queue transitions from active to drained. When the run
  // captured a single bookmark, link the toast to it; a multi-bookmark run has no single target.
  const wasActive = useRef(false);
  useEffect(() => {
    if (wasActive.current && active === 0 && total > 0) {
      const bookmarkId = runBookmarkIds.length === 1 ? runBookmarkIds[0] : undefined;
      notifySuccess(
        completionMessage(t, completed, failed),
        bookmarkId
          ? {
            link: {
              href: `/bookmarks/${bookmarkId}`,
              label: t("View bookmark"),
            },
          }
          : undefined,
      );
    }
    wasActive.current = active > 0;
  }, [active, total, completed, failed, runBookmarkIds, t]);

  return {
    total,
    completed,
    failed,
    active,
  };
}
