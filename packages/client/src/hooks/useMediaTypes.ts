import type { CreateMediaTypeInput, UpdateMediaTypeInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { mediaTypesApi } from "../lib/api";

const MEDIA_TYPES_KEY = ["media-types"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useMediaTypes() {
  return useQuery({
    queryKey: MEDIA_TYPES_KEY,
    queryFn: mediaTypesApi.list,
  });
}

/** Look up a single media type by its slug from the cached list. */
export function useMediaTypeBySlug(slug: string) {
  const query = useMediaTypes();
  return {
    ...query,
    mediaType: (query.data ?? []).find(item => item.slug === slug),
  };
}

export function useCreateMediaType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMediaTypeInput) => mediaTypesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: MEDIA_TYPES_KEY,
      });
    },
  });
}

export function useUpdateMediaType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateMediaTypeInput; }) => mediaTypesApi.update(id, input),
    onSuccess: () => {
      // A rename ripples into bookmark reads (each carries its media type).
      void queryClient.invalidateQueries({
        queryKey: MEDIA_TYPES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useDeleteMediaType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaTypesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: MEDIA_TYPES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}
