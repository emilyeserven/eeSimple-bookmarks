import type { AiPromptBuilderSettings, UpdateAiPromptBuilderInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { appSettingsApi } from "../../lib/api/settings";
import { describeError } from "../../lib/apiError";
import { notifyError, notifySuccess } from "../../lib/notifications";

const AI_PROMPT_BUILDER_KEY = ["app-settings", "ai-prompt-builder"] as const;

const AI_PROMPT_BUILDER_DEFAULTS: AiPromptBuilderSettings = {
  aiPromptBuilderPrompt: "",
};

/** The stored AI Prompt Builder preamble. */
export function useAiPromptBuilderSettings() {
  return useQuery({
    queryKey: AI_PROMPT_BUILDER_KEY,
    queryFn: appSettingsApi.getAiPromptBuilder,
  });
}

export function useUpdateAiPromptBuilderSettings() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdateAiPromptBuilderInput) =>
      appSettingsApi.updateAiPromptBuilder(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(AI_PROMPT_BUILDER_KEY, saved);
      notifySuccess(t("AI prompt template saved"));
    },
    onError: error => notifyError(describeError(error)),
  });
}

export { AI_PROMPT_BUILDER_DEFAULTS };
