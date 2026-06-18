import type { BulkUrlUpdate, CreateBookmarkInput, UpdateBookmarkInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { bookmarksApi } from "../lib/api";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Bookmarks whose URL host equals `domain` — powers the bulk shortened-link expansion review. */
export function useBookmarksOnHost(domain: string | null) {
  return useQuery({
    queryKey: [...BOOKMARKS_KEY, "on-host", domain],
    queryFn: () => bookmarksApi.onHost(domain ?? ""),
    enabled: Boolean(domain),
  });
}

/** Apply a batch of URL rewrites (e.g. expanding shortened links). */
export function useBulkExpandBookmarkUrls() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: BulkUrlUpdate[]) => bookmarksApi.bulkUrl(items),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
  });
}

export function useBookmarks(tagId?: string) {
  return useQuery({
    queryKey: [...BOOKMARKS_KEY, tagId ?? null],
    queryFn: () => bookmarksApi.list(tagId),
  });
}

/** A single bookmark fetched by id; nested under the bookmarks key so edits invalidate it. */
export function useBookmark(id: string) {
  return useQuery({
    queryKey: [...BOOKMARKS_KEY, "detail", id],
    queryFn: () => bookmarksApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookmarkInput) => bookmarksApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
  });
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateBookmarkInput; }) => bookmarksApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookmarksApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      toast.success("Bookmark deleted");
    },
  });
}

/** Upload an image file for an existing bookmark, replacing any current image. */
export function useUploadBookmarkImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, file,
    }: { id: string;
      file: File; }) => bookmarksApi.uploadImage(id, file),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
    onError: (err: Error) => toast.error(err.message || "Could not upload that image"),
  });
}

/** Auto-capture a bookmark's preview image from its page (og:image). */
export function useAutoBookmarkImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookmarksApi.autoImage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      toast.success("Page image fetched");
    },
    onError: (err: Error) => {
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      toast.error(err.message || "Could not fetch a preview image");
    },
  });
}

/** Remove a bookmark's image. */
export function useDeleteBookmarkImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookmarksApi.deleteImage(id),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
    onError: (err: Error) => toast.error(err.message || "Could not remove the image"),
  });
}
