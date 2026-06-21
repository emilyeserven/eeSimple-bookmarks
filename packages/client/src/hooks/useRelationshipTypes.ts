import type {
  CreateRelationshipTypeInput,
  UpdateRelationshipTypeInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { relationshipTypesApi } from "../lib/api";

const RELATIONSHIP_TYPES_KEY = ["relationship-types"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useRelationshipTypes() {
  return useQuery({
    queryKey: RELATIONSHIP_TYPES_KEY,
    queryFn: relationshipTypesApi.list,
  });
}

export function useCreateRelationshipType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRelationshipTypeInput) => relationshipTypesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: RELATIONSHIP_TYPES_KEY,
      });
    },
  });
}

export function useUpdateRelationshipType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateRelationshipTypeInput; }) => relationshipTypesApi.update(id, input),
    onSuccess: () => {
      // A rename ripples into bookmark reads (each carries its relationship type names).
      void queryClient.invalidateQueries({
        queryKey: RELATIONSHIP_TYPES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useDeleteRelationshipType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => relationshipTypesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: RELATIONSHIP_TYPES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}
