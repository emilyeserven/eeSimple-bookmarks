import type { CreateBookmarkInput, UpdateBookmarkInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { bookmarksApi } from "../lib/api";

const BOOKMARKS_KEY = ["bookmarks"] as const;

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

/** The homepage bookmarks: bookmarks in homepage categories or carrying a homepage tag. */
export function useHomepageBookmarks() {
  return useQuery({
    queryKey: [...BOOKMARKS_KEY, "homepage"],
    queryFn: () => bookmarksApi.homepage(),
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
