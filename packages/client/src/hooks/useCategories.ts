import type {
  CreateCategoryInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { categoriesApi } from "../lib/api/taxonomies";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { notifySuccess } from "../lib/notifications";

const CATEGORIES_KEY = ["categories"] as const;
const PROPERTIES_KEY = ["custom-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: categoriesApi.list,
  });
}

/** A single category looked up by slug from the categories list, plus the list's load state. */
export function useCategoryBySlug(slug: string) {
  const query = useCategories();
  return {
    ...query,
    category: (query.data ?? []).find(item => item.slug === slug),
  };
}

/**
 * Invalidate categories, properties (a property card shows category names), and the
 * homepage bookmarks (homepage flags decide which bookmarks appear there).
 */
function useCategoryInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: CATEGORIES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: PROPERTIES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreateCategory() {
  const invalidate = useCategoryInvalidation();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useCategoryInvalidation();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateCategoryInput; }) => categoriesApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useCategoryInvalidation();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      invalidate();
      notifySuccess("Category deleted");
    },
  });
}

export function useBulkDeleteCategories() {
  return useBulkDeleteEntity(categoriesApi.bulkDelete, useCategoryInvalidation());
}

/** The enabled root-tag allowlist for a category (empty = all root tags enabled). */
export function useCategoryRootTags(categoryId: string) {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, categoryId, "root-tags"],
    queryFn: () => categoriesApi.rootTags(categoryId).then(result => result.tagIds),
  });
}

export function useSetCategoryRootTags(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagIds: string[]) => categoriesApi.setRootTags(categoryId, tagIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...CATEGORIES_KEY, categoryId, "root-tags"],
      });
      // Changing one category's explicit allowlist can change which tags are "globally
      // unassigned," which affects every category's available-tags set.
      void queryClient.invalidateQueries({
        predicate: query =>
          query.queryKey[0] === CATEGORIES_KEY[0]
          && query.queryKey[query.queryKey.length - 1] === "available-tags",
      });
    },
  });
}

/**
 * A category's available tags for tagging bookmarks: root tags explicitly assigned to this
 * category, plus root tags with no category assignment at all.
 */
export function useCategoryAvailableTags(categoryId: string) {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, categoryId, "available-tags"],
    queryFn: () => categoriesApi.availableTags(categoryId).then(result => result.tagIds),
  });
}

/** A category's default custom-property values, applied to new bookmarks added to it. */
export function useCategoryDefaults(categoryId: string) {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, categoryId, "defaults"],
    queryFn: () => categoriesApi.defaults(categoryId),
    enabled: Boolean(categoryId),
  });
}

export function useSetCategoryDefaults(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCategoryDefaultsInput) =>
      categoriesApi.setDefaults(categoryId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...CATEGORIES_KEY, categoryId, "defaults"],
      });
      notifyFieldSaved("Default property values");
    },
    onError: () => notifyFieldSaveError("Default property values"),
  });
}
