import type { CreateBookmarkInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { bookmarksApi } from "../lib/api";

const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useBookmarks() {
  return useQuery({
    queryKey: BOOKMARKS_KEY,
    queryFn: bookmarksApi.list,
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

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookmarksApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    }),
  });
}
