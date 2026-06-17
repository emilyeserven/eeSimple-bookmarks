import type {
  CreateCustomPropertyInput,
  CreateCustomPropertyTagInput,
  UpdateCustomPropertyInput,
  UpdateCustomPropertyTagInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { customPropertiesApi } from "../lib/api";

const PROPERTIES_KEY = ["custom-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useCustomProperties() {
  return useQuery({
    queryKey: PROPERTIES_KEY,
    queryFn: customPropertiesApi.list,
  });
}

export function useCreateCustomProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomPropertyInput) => customPropertiesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: PROPERTIES_KEY,
    }),
  });
}

export function useDeleteCustomProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customPropertiesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROPERTIES_KEY,
      });
      // A deleted property's values disappear from bookmarks too.
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

/** The tier tree for a single tiered-tags custom property. */
export function usePropertyTagTree(propertyId: string) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, propertyId, "tags"],
    queryFn: () => customPropertiesApi.tagTree(propertyId),
  });
}

/** Invalidate a property's tier tree and bookmarks, since tier edits ripple into both. */
function usePropertyTagInvalidation(propertyId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: [...PROPERTIES_KEY, propertyId, "tags"],
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreatePropertyTag(propertyId: string) {
  const invalidate = usePropertyTagInvalidation(propertyId);
  return useMutation({
    mutationFn: (input: CreateCustomPropertyTagInput) =>
      customPropertiesApi.createTag(propertyId, input),
    onSuccess: invalidate,
  });
}

export function useUpdatePropertyTag(propertyId: string) {
  const invalidate = usePropertyTagInvalidation(propertyId);
  return useMutation({
    mutationFn: ({
      tagId, input,
    }: { tagId: string;
      input: UpdateCustomPropertyTagInput; }) =>
      customPropertiesApi.updateTag(propertyId, tagId, input),
    onSuccess: invalidate,
  });
}

export function useDeletePropertyTag(propertyId: string) {
  const invalidate = usePropertyTagInvalidation(propertyId);
  return useMutation({
    mutationFn: (tagId: string) => customPropertiesApi.removeTag(propertyId, tagId),
    onSuccess: invalidate,
  });
}

export function useUpdateCustomProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateCustomPropertyInput; }) => customPropertiesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: PROPERTIES_KEY,
    }),
  });
}
