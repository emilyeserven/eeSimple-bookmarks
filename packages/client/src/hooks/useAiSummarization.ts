import type { AiSummaryApplyInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { aiSummarizationApi } from "../lib/api/settings";

const AI_SUMMARY_QUEUE_KEY = ["ai-summarization", "queue"] as const;

/** Bookmarks currently in the "AI Summary Queue" content status. */
export function useAiSummaryQueue() {
  return useQuery({
    queryKey: AI_SUMMARY_QUEUE_KEY,
    queryFn: aiSummarizationApi.getQueue,
  });
}

/** Bulk-transition all "AI Summary Queue" bookmarks to "Summarized by AI". */
export function useMarkAiQueueSummarized() {
  return useMutation({
    mutationFn: () => aiSummarizationApi.markSummarized(),
  });
}

/** Apply pasted AI summaries: write descriptions, mark summarized, and attach suggested tags. */
export function useApplyAiSummaries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AiSummaryApplyInput) => aiSummarizationApi.apply(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AI_SUMMARY_QUEUE_KEY,
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
