import type { CreatePlaceTypeInput, UpdatePlaceTypeInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { placeTypesApi } from "../lib/api/taxonomies";

const PLACE_TYPES_KEY = ["place-types"] as const;

function invalidatePlaceTypeConsumers(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: PLACE_TYPES_KEY,
  });
  // A rename/reassign/delete ripples into locations (each embeds its place type), so refresh
  // anything keyed on locations too.
  void queryClient.invalidateQueries({
    queryKey: ["locations"],
  });
}

export function usePlaceTypes() {
  return useQuery({
    queryKey: PLACE_TYPES_KEY,
    queryFn: placeTypesApi.list,
  });
}

/** Resolve a single place type by slug from the cached list (no dedicated REST endpoint needed). */
export function usePlaceTypeBySlug(slug: string) {
  const query = usePlaceTypes();
  return {
    ...query,
    placeType: (query.data ?? []).find(placeType => placeType.slug === slug),
  };
}

export function useCreatePlaceType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlaceTypeInput) => placeTypesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PLACE_TYPES_KEY,
      });
    },
  });
}

export function useUpdatePlaceType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdatePlaceTypeInput; }) =>
      placeTypesApi.update(id, input),
    onSuccess: () => invalidatePlaceTypeConsumers(queryClient),
  });
}

export function useDeletePlaceType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, reassignTo,
    }: { id: string;
      reassignTo?: string; }) => placeTypesApi.remove(id, reassignTo),
    onSuccess: () => invalidatePlaceTypeConsumers(queryClient),
  });
}

export function useBulkDeletePlaceTypes() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(placeTypesApi.bulkDelete, () => invalidatePlaceTypeConsumers(queryClient));
}
