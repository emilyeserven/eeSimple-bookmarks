import type { CreatePublisherInput, UpdatePublisherInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { publishersApi } from "../lib/api/taxonomies";

const PUBLISHERS_KEY = ["publishers"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function usePublishers() {
  return useQuery({
    queryKey: PUBLISHERS_KEY,
    queryFn: publishersApi.list,
  });
}

/** Look up a single publisher by its slug from the cached list. */
export function usePublisherBySlug(slug: string) {
  const query = usePublishers();
  return {
    ...query,
    publisher: (query.data ?? []).find(item => item.slug === slug),
  };
}

export function useCreatePublisher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePublisherInput) => publishersApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PUBLISHERS_KEY,
      });
    },
  });
}

export function useUpdatePublisher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdatePublisherInput; }) => publishersApi.update(id, input),
    onSuccess: () => {
      // A rename ripples into bookmark reads (each carries its publisher).
      void queryClient.invalidateQueries({
        queryKey: PUBLISHERS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useDeletePublisher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishersApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PUBLISHERS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useBulkDeletePublishers() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(publishersApi.bulkDelete, () => {
    void queryClient.invalidateQueries({
      queryKey: PUBLISHERS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  });
}
