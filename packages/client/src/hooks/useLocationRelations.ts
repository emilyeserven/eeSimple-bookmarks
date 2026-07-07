import type { CreateLocationRelationInput, UpdateLocationRelationInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { locationRelationsApi } from "../lib/api/taxonomies";

const LOCATION_RELATIONS_KEY = ["location-relations"] as const;

export function useLocationRelations() {
  return useQuery({
    queryKey: LOCATION_RELATIONS_KEY,
    queryFn: locationRelationsApi.list,
  });
}

/** Resolve a single location relation by slug from the cached list (no dedicated REST endpoint needed). */
export function useLocationRelationBySlug(slug: string) {
  const query = useLocationRelations();
  return {
    ...query,
    locationRelation: (query.data ?? []).find(relation => relation.slug === slug),
  };
}

export function useCreateLocationRelation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLocationRelationInput) => locationRelationsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: LOCATION_RELATIONS_KEY,
      });
    },
  });
}

export function useUpdateLocationRelation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateLocationRelationInput; }) =>
      locationRelationsApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: LOCATION_RELATIONS_KEY,
      });
      // A rename changes the relation name hydrated onto bookmark location edges + the Locations list.
      void queryClient.invalidateQueries({
        queryKey: ["bookmarks"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["locations"],
      });
    },
  });
}

export function useDeleteLocationRelation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, reassignTo,
    }: { id: string;
      reassignTo?: string; }) => locationRelationsApi.remove(id, reassignTo),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: LOCATION_RELATIONS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: ["bookmarks"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["locations"],
      });
    },
  });
}

export function useBulkDeleteLocationRelations() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(locationRelationsApi.bulkDelete, () => {
    void queryClient.invalidateQueries({
      queryKey: LOCATION_RELATIONS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: ["bookmarks"],
    });
    void queryClient.invalidateQueries({
      queryKey: ["locations"],
    });
  });
}
