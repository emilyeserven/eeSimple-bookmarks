import type { AutoFetchJobStatus } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { galleryApi } from "../lib/api/imports";
import { notifySuccess } from "../lib/notifications";

const GALLERY_KEY = ["gallery"] as const;
const AUTO_FETCH_STATUS_KEY = ["gallery", "auto-fetch-status"] as const;

/** How often (ms) to poll the auto-fetch job while it is running. */
const AUTO_FETCH_POLL_MS = 1500;

/** The storage-bucket catalog: registered images plus orphaned objects. */
export function useGallery() {
  return useQuery({
    queryKey: GALLERY_KEY,
    queryFn: galleryApi.list,
  });
}

/** Shared self-stopping status poll for a background fetch job: refetch only while running. */
function useJobStatus(
  queryKey: readonly string[],
  queryFn: () => Promise<AutoFetchJobStatus>,
) {
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: query =>
      (query.state.data?.status === "running" ? AUTO_FETCH_POLL_MS : false),
  });
}

/**
 * Shared completion watcher for a background fetch job: fire a toast when the job transitions from
 * running to done, then refresh the gallery catalog.
 */
function useJobCompletionToast(status: AutoFetchJobStatus | undefined) {
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
      const message = fetched === 1
        ? (failed > 0
          ? t("Fetched 1 image, {{failed}} failed.", {
            failed,
          })
          : t("Fetched 1 image."))
        : (failed > 0
          ? t("Fetched {{fetched}} images, {{failed}} failed.", {
            fetched,
            failed,
          })
          : t("Fetched {{fetched}} images.", {
            fetched,
          }));
      notifySuccess(
        message,
        {
          link: {
            href: "/settings/media/manage",
            label: t("View in Manage Media"),
          },
        },
      );
      void queryClient.invalidateQueries({
        queryKey: GALLERY_KEY,
      });
    }
    previous.current = status;
  }, [status, queryClient, t]);
}

/**
 * Poll the background image auto-fetch job status. Self-stopping: only refetches while running,
 * then idles until a start mutation invalidates the key.
 */
export function useAutoFetchStatus() {
  return useJobStatus(AUTO_FETCH_STATUS_KEY, galleryApi.autoFetchStatus);
}

/**
 * Watch the auto-fetch status and fire a completion toast when the job transitions from running to
 * done, then refresh the gallery catalog. Mount once (the header indicator).
 */
export function useAutoFetchCompletionToast(status: AutoFetchJobStatus | undefined) {
  useJobCompletionToast(status);
}

/** Reconcile the manifest against the live bucket, then refresh the cached catalog with the result. */
export function useScanBucket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => galleryApi.scan(),
    onSuccess: (result) => {
      queryClient.setQueryData(GALLERY_KEY, result.catalog);
    },
  });
}

/** Delete orphan objects (per-item or bulk); refetches the catalog afterwards. */
export function useDeleteOrphans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keys: string[]) => galleryApi.deleteOrphans(keys),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GALLERY_KEY,
      });
    },
  });
}

/** Start a background bulk auto-fetch job. Kicks the status poll so the indicator appears. */
export function useAutoFetchImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => galleryApi.autoFetch(),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTO_FETCH_STATUS_KEY, data);
    },
  });
}

const AUTO_FETCH_FALLBACK_STATUS_KEY = ["gallery", "auto-fetch-fallback-status"] as const;

/**
 * Poll the background screenshot-fallback auto-fetch job status. Self-stopping: only refetches
 * while running, then idles until a start mutation invalidates the key.
 */
export function useAutoFetchWithFallbackStatus() {
  return useJobStatus(AUTO_FETCH_FALLBACK_STATUS_KEY, galleryApi.autoFetchWithFallbackStatus);
}

/**
 * Watch the screenshot-fallback job status and fire a completion toast when it finishes, then
 * refresh the gallery catalog.
 */
export function useAutoFetchWithFallbackCompletionToast(status: AutoFetchJobStatus | undefined) {
  useJobCompletionToast(status);
}

/** Start a background bulk auto-fetch-with-screenshot-fallback job. Kicks the status poll. */
export function useAutoFetchWithFallback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => galleryApi.autoFetchWithFallback(),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTO_FETCH_FALLBACK_STATUS_KEY, data);
    },
  });
}

/** Attach an orphaned object to a bookmark, then refetch the catalog. */
export function useAttachOrphan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      key, bookmarkId,
    }: { key: string;
      bookmarkId: string; }) =>
      galleryApi.attach(key, bookmarkId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GALLERY_KEY,
      });
    },
  });
}
