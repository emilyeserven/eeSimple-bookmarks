import type { UpdateYouTubeChannelInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { youtubeChannelsApi } from "../lib/api";

const CHANNELS_KEY = ["youtube-channels"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

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
