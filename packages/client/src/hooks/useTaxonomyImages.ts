import type { createTaxonomyImageApi } from "../lib/api/taxonomyImages";
import type { TaxonomyImage } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { describeError } from "../lib/apiError";
import { notifyError } from "../lib/notifications";

type TaxonomyImageApi = ReturnType<typeof createTaxonomyImageApi>;

/**
 * The image gallery for one Plex/Kavita-backed media taxonomy entity: the current image list plus
 * upload / auto-fetch / set-main / remove mutations. `api` is one entity's `createTaxonomyImageApi`
 * instance (e.g. `moviesApi.images`); `queryKey` should be unique per entity+id (e.g.
 * `["movie-images", movieId]`) so different entities' galleries don't collide in the cache.
 */
export function useTaxonomyImages(api: TaxonomyImageApi, ownerId: string, queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKey, ownerId, api],
    queryFn: () => api.list(ownerId),
  });

  function invalidate(): void {
    void queryClient.invalidateQueries({
      queryKey,
    });
  }

  const upload = useMutation({
    mutationFn: (file: File) => api.upload(ownerId, file),
    onSuccess: invalidate,
    onError: (err: Error) => notifyError(describeError(err, "Could not upload the image")),
  });

  const autoFetch = useMutation({
    mutationFn: (source: string) => api.autoFetch(ownerId, source),
    onSuccess: invalidate,
    onError: (err: Error) => notifyError(describeError(err, "Could not import the image")),
  });

  const setMain = useMutation({
    mutationFn: (imageId: string) => api.setMain(ownerId, imageId),
    onSuccess: invalidate,
    onError: (err: Error) => notifyError(describeError(err, "Could not set the main image")),
  });

  const remove = useMutation({
    mutationFn: (imageId: string) => api.remove(ownerId, imageId),
    onSuccess: invalidate,
    onError: (err: Error) => notifyError(describeError(err, "Could not remove the image")),
  });

  return {
    images: (query.data ?? []) as TaxonomyImage[],
    isLoading: query.isLoading,
    upload,
    autoFetch,
    setMain,
    remove,
    isMutating: upload.isPending || autoFetch.isPending || setMain.isPending || remove.isPending,
  };
}
