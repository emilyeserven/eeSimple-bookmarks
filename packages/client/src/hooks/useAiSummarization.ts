import { useMutation, useQuery } from "@tanstack/react-query";

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
