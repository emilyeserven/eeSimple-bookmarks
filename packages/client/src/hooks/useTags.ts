import type { CreateTagInput, TagReparentPlanInput, UpdateTagInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { tagsApi } from "../lib/api/taxonomies";
import { notifyBulkResult } from "../lib/bulkResults";
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
    mutationFn: ({
      id, reassignTo,
    }: { id: string;
      reassignTo?: string; }) => tagsApi.remove(id, reassignTo),
    onSuccess: () => {
      invalidate();
      notifySuccess(t("Tag deleted"));
    },
  });
}

/**
 * Remove all of a tag's own bookmark associations without deleting the tag (its `bookmark_tags` links
 * + its id in bookmarks' Sections jsonb). Surfaced on a non-leaf tag's edit page, where deletion would
 * cascade away the child subtree.
 */
export function useClearTagAssociations() {
  const invalidate = useTagInvalidation();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => tagsApi.clearAssociations(id),
    onSuccess: () => {
      invalidate();
      notifySuccess(t("Removed all bookmark associations"));
    },
  });
}

export function useBulkDeleteTags() {
  return useBulkDeleteEntity(tagsApi.bulkDelete, useTagInvalidation());
}

/** Move many tags under a new parent (`null` = top level), with the per-item-outcome toast. */
export function useBulkReparentTags() {
  const invalidate = useTagInvalidation();
  return useMutation({
    mutationFn: ({
      ids, parentId,
    }: { ids: string[];
      parentId: string | null; }) => tagsApi.bulkReparent(ids, parentId),
    onSuccess: (results) => {
      invalidate();
      notifyBulkResult(results, "moved");
    },
  });
}

/**
 * Apply an AI-proposed reparent plan (create grouping tags, then move existing tags under their new
 * parents). The caller supplies the success/error toast so it can describe the created/moved counts.
 */
export function useApplyTagReparentPlan() {
  const invalidate = useTagInvalidation();
  return useMutation({
    mutationFn: (input: TagReparentPlanInput) => tagsApi.reparentPlan(input),
    onSuccess: invalidate,
  });
}
