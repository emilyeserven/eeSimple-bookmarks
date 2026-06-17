import type { CreateTagInput, UpdateTagInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tagsApi } from "../lib/api";

const TAGS_KEY = ["tags"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useTags() {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: tagsApi.list,
  });
}

export function useTagTree() {
  return useQuery({
    queryKey: [...TAGS_KEY, "tree"],
    queryFn: tagsApi.tree,
  });
}

/** Invalidate tags (tree + list) and bookmarks, since tag edits ripple into both. */
function useTagInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: TAGS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreateTag() {
  const invalidate = useTagInvalidation();
  return useMutation({
    mutationFn: (input: CreateTagInput) => tagsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTag() {
  const invalidate = useTagInvalidation();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateTagInput; }) => tagsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTag() {
  const invalidate = useTagInvalidation();
  return useMutation({
    mutationFn: (id: string) => tagsApi.remove(id),
    onSuccess: invalidate,
  });
}
