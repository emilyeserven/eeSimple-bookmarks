import type { AutoFetchJobStatus } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

/**
 * Poll the background image auto-fetch job status. Self-stopping: only refetches while running,
 * then idles until a start mutation invalidates the key.
 */
export function useAutoFetchStatus() {
  return useQuery({
    queryKey: AUTO_FETCH_STATUS_KEY,
    queryFn: galleryApi.autoFetchStatus,
    refetchInterval: query =>
      (query.state.data?.status === "running" ? AUTO_FETCH_POLL_MS : false),
  });
}

/**
 * Watch the auto-fetch status and fire a completion toast when the job transitions from running to
 * done, then refresh the gallery catalog. Mount once (the header indicator).
 */
export function useAutoFetchCompletionToast(status: AutoFetchJobStatus | undefined) {
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
      notifySuccess(
        `Fetched ${fetched} image${fetched === 1 ? "" : "s"}${failed > 0 ? `, ${failed} failed` : ""}.`,
        {
          link: {
            href: "/settings/media/manage",
            label: "View in Manage Media",
          },
        },
      );
      void queryClient.invalidateQueries({
        queryKey: GALLERY_KEY,
      });
    }
    previous.current = status;
  }, [status, queryClient]);
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
  return useQuery({
    queryKey: AUTO_FETCH_FALLBACK_STATUS_KEY,
    queryFn: galleryApi.autoFetchWithFallbackStatus,
    refetchInterval: query =>
      (query.state.data?.status === "running" ? AUTO_FETCH_POLL_MS : false),
  });
}

/**
 * Watch the screenshot-fallback job status and fire a completion toast when it finishes, then
 * refresh the gallery catalog.
 */
export function useAutoFetchWithFallbackCompletionToast(status: AutoFetchJobStatus | undefined) {
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
      notifySuccess(
        `Fetched ${fetched} image${fetched === 1 ? "" : "s"}${failed > 0 ? `, ${failed} failed` : ""}.`,
        {
          link: {
            href: "/settings/media/manage",
            label: "View in Manage Media",
          },
        },
      );
      void queryClient.invalidateQueries({
        queryKey: GALLERY_KEY,
      });
    }
    previous.current = status;
  }, [status, queryClient]);
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
