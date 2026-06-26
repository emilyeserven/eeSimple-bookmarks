import type { CreateYouTubeChannelInput, UpdateYouTubeChannelInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { useRateLimitCooldown } from "./useRateLimitCooldown";
import { youtubeChannelsApi } from "../lib/api/taxonomies";
import { ApiError, describeError } from "../lib/apiError";
import { notifyImageFetchError } from "../lib/bugReport";
import { notifyError, notifySuccess } from "../lib/notifications";

const CHANNELS_KEY = ["youtube-channels"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;
const WEBSITES_KEY = ["websites"] as const;

export function useYouTubeChannels() {
  return useQuery({
    queryKey: CHANNELS_KEY,
    queryFn: youtubeChannelsApi.list,
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
  });
}

/** Upload a user-chosen avatar for a channel, replacing any existing one. */
export function useUploadYouTubeChannelImage() {
  const queryClient = useQueryClient();
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
      notifySuccess("Avatar updated");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not upload the avatar")),
  });
}

/** Re-grab a channel's avatar from its public channel page (`og:image`). */
export function useAutoYouTubeChannelImage() {
  const queryClient = useQueryClient();
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
      notifySuccess("Avatar fetched");
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

export function useDeleteYouTubeChannelImage() {
  const queryClient = useQueryClient();
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
      notifySuccess("Avatar removed");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not remove the avatar")),
  });
}
