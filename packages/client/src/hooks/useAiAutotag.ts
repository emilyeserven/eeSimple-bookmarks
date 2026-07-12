import type { AiAutotagApplyInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { aiAutotagApi } from "../lib/api/settings";

const AI_AUTOTAG_UNTAGGED_KEY = ["ai-autotag", "untagged"] as const;

/** The most recent untagged bookmarks, limited to `limit`, offered to the autotag prompt. */
export function useUntaggedBookmarks(limit: number) {
  return useQuery({
    queryKey: [...AI_AUTOTAG_UNTAGGED_KEY, limit],
    queryFn: () => aiAutotagApi.getUntagged(limit),
  });
}

/** Apply pasted AI tag suggestions: union the selected tags onto each bookmark, creating missing tags. */
export function useApplyAiTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AiAutotagApplyInput) => aiAutotagApi.apply(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AI_AUTOTAG_UNTAGGED_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: ["bookmarks"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["tags"],
      });
    },
  });
}
