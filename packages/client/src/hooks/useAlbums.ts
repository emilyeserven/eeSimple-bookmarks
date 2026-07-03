import type { CreateAlbumInput, UpdateAlbumInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { albumsApi } from "../lib/api/taxonomies";

const ALBUMS_KEY = ["albums"] as const;
const ARTISTS_KEY = ["artists"] as const;
const MEDIA_PROPERTIES_KEY = ["media-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useAlbums() {
  return useQuery({
    queryKey: ALBUMS_KEY,
    queryFn: albumsApi.list,
  });
}

/** Look up a single album by its slug from the cached list. */
export function useAlbumBySlug(slug: string) {
  const query = useAlbums();
  return {
    ...query,
    album: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Invalidate every query whose rendering depends on album definitions (incl. the artist M2M side). */
function useInvalidateAlbumConsumers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: ALBUMS_KEY,
    });
    // The album↔artist link is surfaced from the artist side too.
    void queryClient.invalidateQueries({
      queryKey: ARTISTS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: MEDIA_PROPERTIES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreateAlbum() {
  const invalidate = useInvalidateAlbumConsumers();
  return useMutation({
    mutationFn: (input: CreateAlbumInput) => albumsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateAlbum() {
  const invalidate = useInvalidateAlbumConsumers();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateAlbumInput; }) => albumsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteAlbum() {
  const invalidate = useInvalidateAlbumConsumers();
  return useMutation({
    mutationFn: (id: string) => albumsApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useBulkDeleteAlbums() {
  return useBulkDeleteEntity(albumsApi.bulkDelete, useInvalidateAlbumConsumers());
}
