import type { ToastedMutationVars } from "./shared";
import type { UpdateBookmarkGraphInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";
import { notifyError, notifySuccess } from "../../lib/notifications";

const BOOKMARK_GRAPH_KEY = ["app-settings", "bookmark-graph"] as const;

/** Bookmark Graph settings: per-dimension relatedness weights + how many related cards to show. */
export function useBookmarkGraphSettings() {
  return useQuery({
    queryKey: BOOKMARK_GRAPH_KEY,
    queryFn: appSettingsApi.getBookmarkGraph,
  });
}

export function useUpdateBookmarkGraphSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToastedMutationVars<UpdateBookmarkGraphInput>) =>
      appSettingsApi.updateBookmarkGraph(vars.input),
    onSuccess: (saved, vars) => {
      queryClient.setQueryData(BOOKMARK_GRAPH_KEY, saved);
      notifySuccess(vars.successMessage);
    },
    onError: (error, vars) => notifyError(vars.errorMessage ?? error.message),
  });
}
