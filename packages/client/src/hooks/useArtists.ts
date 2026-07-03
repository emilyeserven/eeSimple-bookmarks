import type { CreateArtistInput, UpdateArtistInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { artistsApi } from "../lib/api/taxonomies";

const ARTISTS_KEY = ["artists"] as const;
const ALBUMS_KEY = ["albums"] as const;
const MEDIA_PROPERTIES_KEY = ["media-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useArtists() {
  return useQuery({
    queryKey: ARTISTS_KEY,
    queryFn: artistsApi.list,
  });
}

/** Look up a single artist by its slug from the cached list. */
export function useArtistBySlug(slug: string) {
  const query = useArtists();
  return {
    ...query,
    artist: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Invalidate every query whose rendering depends on artist definitions (incl. the album M2M side). */
function useInvalidateArtistConsumers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: ARTISTS_KEY,
    });
    // The album↔artist link is surfaced from the album side too.
    void queryClient.invalidateQueries({
      queryKey: ALBUMS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: MEDIA_PROPERTIES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreateArtist() {
  const invalidate = useInvalidateArtistConsumers();
  return useMutation({
    mutationFn: (input: CreateArtistInput) => artistsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateArtist() {
  const invalidate = useInvalidateArtistConsumers();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateArtistInput; }) => artistsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteArtist() {
  const invalidate = useInvalidateArtistConsumers();
  return useMutation({
    mutationFn: (id: string) => artistsApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useBulkDeleteArtists() {
  return useBulkDeleteEntity(artistsApi.bulkDelete, useInvalidateArtistConsumers());
}
