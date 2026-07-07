import type { CreateTagInput, UpdateTagInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { tagsApi } from "../lib/api/taxonomies";
import { notifySuccess } from "../lib/notifications";
import { flattenTree } from "../lib/tagTree";

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

/**
 * A single tag (as a tree node, so children and bookmark count are available) looked up by slug
 * from the tag tree, plus the tree's load state. Mirrors `useCategoryBySlug`.
 */
export function useTagBySlug(slug: string) {
  const query = useTagTree();
  const tag = query.data
    ? flattenTree(query.data).find(item => item.node.slug === slug)?.node
    : undefined;
  return {
    ...query,
    tag,
  };
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
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => tagsApi.remove(id),
    onSuccess: () => {
      invalidate();
      notifySuccess(t("Tag deleted"));
    },
  });
}

export function useBulkDeleteTags() {
  return useBulkDeleteEntity(tagsApi.bulkDelete, useTagInvalidation());
}
