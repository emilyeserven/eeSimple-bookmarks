import type { CreateEpisodeInput, UpdateEpisodeInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { episodesApi } from "../lib/api/taxonomies";

const EPISODES_KEY = ["episodes"] as const;
const MEDIA_PROPERTIES_KEY = ["media-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useEpisodes() {
  return useQuery({
    queryKey: EPISODES_KEY,
    queryFn: episodesApi.list,
  });
}

/** Look up a single episode by its slug from the cached list. */
export function useEpisodeBySlug(slug: string) {
  const query = useEpisodes();
  return {
    ...query,
    episode: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Invalidate every query whose rendering depends on episode definitions. */
function useInvalidateEpisodeConsumers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: EPISODES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: MEDIA_PROPERTIES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreateEpisode() {
  const invalidate = useInvalidateEpisodeConsumers();
  return useMutation({
    mutationFn: (input: CreateEpisodeInput) => episodesApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateEpisode() {
  const invalidate = useInvalidateEpisodeConsumers();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateEpisodeInput; }) => episodesApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteEpisode() {
  const invalidate = useInvalidateEpisodeConsumers();
  return useMutation({
    mutationFn: (id: string) => episodesApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useBulkDeleteEpisodes() {
  return useBulkDeleteEntity(episodesApi.bulkDelete, useInvalidateEpisodeConsumers());
}
