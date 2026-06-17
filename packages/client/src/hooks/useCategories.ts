import type {
  CreateCategoryInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { categoriesApi } from "../lib/api";

const CATEGORIES_KEY = ["categories"] as const;
const PROPERTIES_KEY = ["custom-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;
const HOMEPAGE_TAGS_KEY = ["homepage-tags"] as const;

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: categoriesApi.list,
  });
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
    onSuccess: invalidate,
  });
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
    },
  });
}

/** The tags selected to surface their bookmarks on the homepage. */
export function useHomepageTags() {
  return useQuery({
    queryKey: HOMEPAGE_TAGS_KEY,
    queryFn: () => categoriesApi.homepageTags().then(result => result.tagIds),
  });
}

export function useSetHomepageTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagIds: string[]) => categoriesApi.setHomepageTags(tagIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: HOMEPAGE_TAGS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
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
    },
  });
}
