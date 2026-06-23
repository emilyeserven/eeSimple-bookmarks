import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { galleryApi } from "../lib/api/imports";

const GALLERY_KEY = ["gallery"] as const;

/** The storage-bucket catalog: registered images plus orphaned objects. */
export function useGallery() {
  return useQuery({
    queryKey: GALLERY_KEY,
    queryFn: galleryApi.list,
  });
}

/** Reconcile the manifest against the live bucket, then refresh the cached catalog with the result. */
export function useScanBucket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => galleryApi.scan(),
    onSuccess: (result) => {
      queryClient.setQueryData(GALLERY_KEY, result.catalog);
    },
  });
}

/** Delete orphan objects (per-item or bulk); refetches the catalog afterwards. */
export function useDeleteOrphans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keys: string[]) => galleryApi.deleteOrphans(keys),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GALLERY_KEY,
      });
    },
  });
}

/** Bulk auto-fetch og:images for all eligible bookmarks (no image, no error), then refresh. */
export function useAutoFetchImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => galleryApi.autoFetch(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GALLERY_KEY,
      });
    },
  });
}

/** Attach an orphaned object to a bookmark, then refetch the catalog. */
export function useAttachOrphan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      key, bookmarkId,
    }: { key: string;
      bookmarkId: string; }) =>
      galleryApi.attach(key, bookmarkId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GALLERY_KEY,
      });
    },
  });
}
