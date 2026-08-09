import type { MergeBookmarksInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateBookmarkRelatedQueries } from "./useBookmarks";
import { duplicatesApi } from "../lib/api/duplicates";

export const DUPLICATE_GROUPS_KEY = ["duplicates", "groups"] as const;

/** The whole-collection duplicate scan (on-demand; the page's Rescan button just refetches). */
export function useDuplicateGroups() {
  return useQuery({
    queryKey: DUPLICATE_GROUPS_KEY,
    queryFn: duplicatesApi.scan,
  });
}

/** Merge a duplicate group into one survivor, then refresh the scan and every bookmark surface. */
export function useMergeBookmarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MergeBookmarksInput) => duplicatesApi.merge(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DUPLICATE_GROUPS_KEY,
      });
      invalidateBookmarkRelatedQueries(queryClient);
    },
  });
}
