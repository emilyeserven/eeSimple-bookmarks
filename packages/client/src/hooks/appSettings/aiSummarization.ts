import type { AiSummarizationSettings, UpdateAiSummarizationInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { appSettingsApi } from "../../lib/api/settings";
import { describeError } from "../../lib/apiError";
import { notifyError, notifySuccess } from "../../lib/notifications";

const AI_SUMMARIZATION_KEY = ["app-settings", "ai-summarization"] as const;

const AI_SUMMARIZATION_DEFAULTS: AiSummarizationSettings = {
  aiSummarizationPrompt: "",
  aiSummarizationSuggestTags: false,
};

/** The stored AI summarization prompt and related settings. */
export function useAiSummarizationSettings() {
  return useQuery({
    queryKey: AI_SUMMARIZATION_KEY,
    queryFn: appSettingsApi.getAiSummarization,
  });
}

export function useUpdateAiSummarizationSettings() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdateAiSummarizationInput) =>
      appSettingsApi.updateAiSummarization(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(AI_SUMMARIZATION_KEY, saved);
      notifySuccess(t("AI summarization prompt saved"));
    },
    onError: error => notifyError(describeError(error)),
  });
}

export { AI_SUMMARIZATION_DEFAULTS };
