import type { LocationAssignmentOwnerType } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { locationAssignmentsApi } from "../lib/api/taxonomies";

const assignmentsKey = (ownerType: LocationAssignmentOwnerType, ownerId: string) =>
  ["location-assignments", ownerType, ownerId] as const;

/** The Locations attached to a single owner (a media taxonomy entity). */
export function useOwnerLocations(
  ownerType: LocationAssignmentOwnerType,
  ownerId: string | undefined,
) {
  return useQuery({
    queryKey: assignmentsKey(ownerType, ownerId ?? ""),
    queryFn: () => locationAssignmentsApi.list(ownerType, ownerId ?? ""),
    enabled: Boolean(ownerId),
  });
}

/** The normalized place-type keys of every Location attached to any owner of one `ownerType`, grouped by `ownerId`. */
export function usePlaceTypeKeysByOwnerType(ownerType: LocationAssignmentOwnerType) {
  return useQuery({
    queryKey: ["location-assignments", "by-owner-type", ownerType],
    queryFn: () => locationAssignmentsApi.listPlaceTypeKeysByOwnerType(ownerType),
  });
}

/** Replace the full set of Locations attached to one owner. */
export function useSetOwnerLocations(
  ownerType: LocationAssignmentOwnerType,
  ownerId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locationIds: string[]) =>
      locationAssignmentsApi.set(ownerType, ownerId, locationIds),
    onSuccess: (data) => {
      queryClient.setQueryData(assignmentsKey(ownerType, ownerId), data);
      // Counts on the Locations listing change.
      void queryClient.invalidateQueries({
        queryKey: ["locations"],
      });
    },
  });
}
