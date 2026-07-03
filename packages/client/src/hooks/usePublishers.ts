import type { CreatePublisherInput, UpdatePublisherInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { publishersApi } from "../lib/api/taxonomies";

const PUBLISHERS_KEY = ["publishers"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;
const MEDIA_PROPERTIES_KEY = ["media-properties"] as const;

/** A publisher's media-property membership surfaces as a count on that media property. */
function invalidatePublisherConsumers(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({
    queryKey: PUBLISHERS_KEY,
  });
  void queryClient.invalidateQueries({
    queryKey: BOOKMARKS_KEY,
  });
  void queryClient.invalidateQueries({
    queryKey: MEDIA_PROPERTIES_KEY,
  });
}

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
    onSuccess: () => invalidatePublisherConsumers(queryClient),
  });
}

export function useUpdatePublisher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdatePublisherInput; }) => publishersApi.update(id, input),
    // A rename ripples into bookmark reads (each carries its publisher).
    onSuccess: () => invalidatePublisherConsumers(queryClient),
  });
}

export function useDeletePublisher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishersApi.remove(id),
    onSuccess: () => invalidatePublisherConsumers(queryClient),
  });
}

export function useBulkDeletePublishers() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(
    publishersApi.bulkDelete,
    () => invalidatePublisherConsumers(queryClient),
  );
}
