import type { AiAutotagSettings, UpdateAiAutotagInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { appSettingsApi } from "../../lib/api/settings";
import { describeError } from "../../lib/apiError";
import { notifyError, notifySuccess } from "../../lib/notifications";

const AI_AUTOTAG_KEY = ["app-settings", "ai-autotag"] as const;

const AI_AUTOTAG_DEFAULTS: AiAutotagSettings = {
  aiAutotagPrompt: "",
  aiAutotagIncludeExistingTags: false,
};

/** The stored AI autotag prompt and related settings. */
export function useAiAutotagSettings() {
  return useQuery({
    queryKey: AI_AUTOTAG_KEY,
    queryFn: appSettingsApi.getAiAutotag,
  });
}

export function useUpdateAiAutotagSettings() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: UpdateAiAutotagInput) =>
      appSettingsApi.updateAiAutotag(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(AI_AUTOTAG_KEY, saved);
      notifySuccess(t("AI autotag prompt saved"));
    },
    onError: error => notifyError(describeError(error)),
  });
}

export { AI_AUTOTAG_DEFAULTS };
