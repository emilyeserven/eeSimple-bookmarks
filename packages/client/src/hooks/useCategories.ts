import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { categoriesApi } from "../lib/api";

const CATEGORIES_KEY = ["categories"] as const;
const PROPERTIES_KEY = ["custom-properties"] as const;

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: categoriesApi.list,
  });
}

/** Invalidate categories and properties, since a property card shows category names. */
function useCategoryInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: CATEGORIES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: PROPERTIES_KEY,
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
