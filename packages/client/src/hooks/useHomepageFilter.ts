import type { ConditionTree } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { homepageFilterApi } from "../lib/api";

const HOMEPAGE_FILTER_KEY = ["homepage-filter"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

/** The global homepage filter (the condition tree deciding which bookmarks appear there). */
export function useHomepageFilter() {
  return useQuery({
    queryKey: HOMEPAGE_FILTER_KEY,
    queryFn: () => homepageFilterApi.get().then(result => result.conditions),
  });
}

export function useSetHomepageFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conditions: ConditionTree) => homepageFilterApi.set(conditions),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: HOMEPAGE_FILTER_KEY,
      });
      // The homepage bookmark list lives under the bookmarks key prefix.
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      toast.success("Homepage filter saved");
    },
  });
}
