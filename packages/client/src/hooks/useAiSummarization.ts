import { useMutation } from "@tanstack/react-query";

import { aiSummarizationApi } from "../lib/api/settings";

/** Bulk-transition all "AI Summary Queue" bookmarks to "Summarized by AI". */
export function useMarkAiQueueSummarized() {
  return useMutation({
    mutationFn: () => aiSummarizationApi.markSummarized(),
  });
}
