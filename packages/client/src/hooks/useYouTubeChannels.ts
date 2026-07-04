import type { AutoFetchJobStatus, CreateYouTubeChannelInput, UpdateYouTubeChannelInput } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { useRateLimitCooldown } from "./useRateLimitCooldown";
import { youtubeChannelsApi } from "../lib/api/taxonomies";
import { ApiError, describeError } from "../lib/apiError";
import { notifyImageFetchError } from "../lib/bugReport";
import { notifyError, notifySuccess } from "../lib/notifications";

const CHANNELS_KEY = ["youtube-channels"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;
const WEBSITES_KEY = ["websites"] as const;
const BACKFILL_STATUS_KEY = ["youtube-channels", "backfill-images-status"] as const;
const MISSING_IMAGE_COUNT_KEY = ["youtube-channels", "missing-image-count"] as const;

/** How often (ms) to poll the channel-image backfill job while it is running. */
const BACKFILL_POLL_MS = 1500;

export function useYouTubeChannels() {
  return useQuery({
    queryKey: CHANNELS_KEY,
    queryFn: youtubeChannelsApi.list,
  });
}

/** Server-computed count of channels currently missing an avatar — backs the Backfill settings page. */
export function useMissingChannelImageCount() {
  return useQuery({
    queryKey: MISSING_IMAGE_COUNT_KEY,
    queryFn: youtubeChannelsApi.missingImageCount,
  });
}

/** Look up a single channel by its slug from the cached list. */
export function useYouTubeChannelBySlug(slug: string) {
  const query = useYouTubeChannels();
  return {
    ...query,
    channel: (query.data ?? []).find(item => item.slug === slug),
  };
}

export function useCreateYouTubeChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateYouTubeChannelInput) => youtubeChannelsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CHANNELS_KEY,
      });
      // A new channel starts with no avatar, so it's immediately eligible for backfill.
      void queryClient.invalidateQueries({
        queryKey: MISSING_IMAGE_COUNT_KEY,
      });
    },
  });
}

export function useUpdateYouTubeChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateYouTubeChannelInput; }) => youtubeChannelsApi.update(id, input),
    onSuccess: () => {
      // A rename ripples into bookmark reads (each carries its channel).
      void queryClient.invalidateQueries({
        queryKey: CHANNELS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      // Editing the channel's associated websites mutates the shared website↔channel join, so the
      // websites' `youtubeChannelIds` go stale until refetched.
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
    },
  });
}

export function useDeleteYouTubeChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => youtubeChannelsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CHANNELS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: MISSING_IMAGE_COUNT_KEY,
      });
    },
  });
}

export function useBulkDeleteYouTubeChannels() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(youtubeChannelsApi.bulkDelete, () => {
    void queryClient.invalidateQueries({
      queryKey: CHANNELS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: MISSING_IMAGE_COUNT_KEY,
    });
  });
}

/** Upload a user-chosen avatar for a channel, replacing any existing one. */
export function useUploadYouTubeChannelImage() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: ({
      id, file,
    }: { id: string;
      file: File; }) => youtubeChannelsApi.uploadImage(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CHANNELS_KEY,
      });
      // BookmarkYouTubeChannel embeds imageUrl, so bookmark cards must reflect the new avatar.
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: MISSING_IMAGE_COUNT_KEY,
      });
      notifySuccess(t("Avatar updated"));
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not upload the avatar")),
  });
}

/** Re-grab a channel's avatar from its public channel page (`og:image`). */
export function useAutoYouTubeChannelImage() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  const cooldown = useRateLimitCooldown(60_000);
  const mutation = useMutation({
    mutationFn: ({
      id,
    }: { id: string;
      sourceUrl: string; }) => youtubeChannelsApi.autoImage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CHANNELS_KEY,
      });
      // BookmarkYouTubeChannel embeds imageUrl, so bookmark cards must reflect the fetched avatar.
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: MISSING_IMAGE_COUNT_KEY,
      });
      notifySuccess(t("Avatar fetched"));
    },
    onError: (err: Error, {
      sourceUrl,
    }) => {
      if (err instanceof ApiError && err.code === "blocked") cooldown.startCooldown();
      notifyImageFetchError(err, "YouTube channel avatar", "Could not fetch an avatar", sourceUrl);
    },
  });
  return {
    ...mutation,
    cooldown,
  };
}

/**
 * Poll the background channel-image backfill job status. Self-stopping: only refetches while
 * running, then idles until a start mutation invalidates the key.
 */
export function useBackfillChannelImagesStatus() {
  return useQuery({
    queryKey: BACKFILL_STATUS_KEY,
    queryFn: youtubeChannelsApi.backfillImagesStatus,
    refetchInterval: query =>
      (query.state.data?.status === "running" ? BACKFILL_POLL_MS : false),
  });
}

/** Start a background bulk channel-avatar backfill job. Kicks the status poll. */
export function useBackfillChannelImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => youtubeChannelsApi.backfillImages(),
    onSuccess: (data) => {
      queryClient.setQueryData(BACKFILL_STATUS_KEY, data);
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not start the backfill")),
  });
}

/**
 * Watch the channel-image backfill status and fire a completion toast when it transitions from
 * running to done, then refresh the channel + bookmark caches (the avatar is embedded in both).
 */
export function useBackfillChannelImagesCompletionToast(status: AutoFetchJobStatus | undefined) {
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
        `Fetched ${fetched} avatar${fetched === 1 ? "" : "s"}${failed > 0 ? `, ${failed} failed` : ""}.`,
        {
          link: {
            href: "/settings/automations/backfill",
            label: "View in Backfill",
          },
        },
      );
      void queryClient.invalidateQueries({
        queryKey: CHANNELS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: MISSING_IMAGE_COUNT_KEY,
      });
    }
    previous.current = status;
  }, [status, queryClient]);
}

export function useDeleteYouTubeChannelImage() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => youtubeChannelsApi.deleteImage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CHANNELS_KEY,
      });
      // BookmarkYouTubeChannel embeds imageUrl, so bookmark cards must reflect the removed avatar.
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: MISSING_IMAGE_COUNT_KEY,
      });
      notifySuccess(t("Avatar removed"));
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not remove the avatar")),
  });
}
