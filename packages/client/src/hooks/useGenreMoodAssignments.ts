import type { GenreMoodOwnerType } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { genreMoodAssignmentsApi } from "../lib/api/taxonomies";

const assignmentsKey = (ownerType: GenreMoodOwnerType, ownerId: string) =>
  ["genre-mood-assignments", ownerType, ownerId] as const;

/** The Genres & Moods entries attached to a single owner (bookmark or taxonomy entity). */
export function useOwnerGenreMoods(
  ownerType: GenreMoodOwnerType,
  ownerId: string | undefined,
) {
  return useQuery({
    queryKey: assignmentsKey(ownerType, ownerId ?? ""),
    queryFn: () => genreMoodAssignmentsApi.list(ownerType, ownerId ?? ""),
    enabled: Boolean(ownerId),
  });
}

/** Replace the full set of Genres & Moods entries attached to one owner. */
export function useSetOwnerGenreMoods(
  ownerType: GenreMoodOwnerType,
  ownerId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (genreMoodIds: string[]) =>
      genreMoodAssignmentsApi.set(ownerType, ownerId, genreMoodIds),
    onSuccess: (data) => {
      queryClient.setQueryData(assignmentsKey(ownerType, ownerId), data);
      // Counts on the taxonomy listing change; bookmark reads carry the entries.
      void queryClient.invalidateQueries({
        queryKey: ["genre-moods"],
      });
      if (ownerType === "bookmark") {
        void queryClient.invalidateQueries({
          queryKey: ["bookmarks"],
        });
      }
    },
  });
}
