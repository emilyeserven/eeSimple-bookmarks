import type { CreateMediaPropertyInput, UpdateMediaPropertyInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { mediaPropertiesApi } from "../lib/api/taxonomies";

const MEDIA_PROPERTIES_KEY = ["media-properties"] as const;
const BOOKS_KEY = ["books"] as const;

export function useMediaProperties() {
  return useQuery({
    queryKey: MEDIA_PROPERTIES_KEY,
    queryFn: mediaPropertiesApi.list,
  });
}

/** Look up a single media property by its slug from the cached list. */
export function useMediaPropertyBySlug(slug: string) {
  const query = useMediaProperties();
  return {
    ...query,
    mediaProperty: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Invalidate every query whose rendering depends on media-property definitions. */
function useInvalidateMediaPropertyConsumers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: MEDIA_PROPERTIES_KEY,
    });
    // A media property's name/existence surfaces on its member books.
    void queryClient.invalidateQueries({
      queryKey: BOOKS_KEY,
    });
  };
}

export function useCreateMediaProperty() {
  const invalidate = useInvalidateMediaPropertyConsumers();
  return useMutation({
    mutationFn: (input: CreateMediaPropertyInput) => mediaPropertiesApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateMediaProperty() {
  const invalidate = useInvalidateMediaPropertyConsumers();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateMediaPropertyInput; }) => mediaPropertiesApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteMediaProperty() {
  const invalidate = useInvalidateMediaPropertyConsumers();
  return useMutation({
    mutationFn: (id: string) => mediaPropertiesApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useBulkDeleteMediaProperties() {
  return useBulkDeleteEntity(mediaPropertiesApi.bulkDelete, useInvalidateMediaPropertyConsumers());
}
